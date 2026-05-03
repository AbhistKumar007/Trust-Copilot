/**
 * POST /api/copilot-chat
 * AI Copilot Chat endpoint — powered by Google Gemini
 *
 * Accepts a user message + optional session history.
 * If the message contains a wallet address, fetches on-chain context first.
 * Returns a structured AI response with verdict, explanation, and optional on-chain data.
 */

const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { fetchTransactions } = require("../services/walletService");
const { calculateRiskScore } = require("../services/riskService");
const { validate } = require("../middleware/validator");

// ─── Known scam address database (lightweight in-memory list) ────────────────
const KNOWN_SCAM_ADDRESSES = new Set([
  "0xdead000000000000000042069420694206942069",
  "0x00000000219ab540356cbb839cbe05303d7705fa",
  "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
  "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b",
  "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract wallet addresses from a user message (EVM + Solana-ish patterns)
 */
function extractAddresses(text) {
  const evmPattern = /0x[a-fA-F0-9]{40}/g;
  const solPattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

  const evmMatches = text.match(evmPattern) || [];
  // Only pick up Solana-style if no EVM addresses found
  const solMatches =
    evmMatches.length === 0
      ? (text.match(solPattern) || []).filter((m) => m.length >= 32 && m.length <= 44)
      : [];

  return [...new Set([...evmMatches, ...solMatches])];
}

/**
 * Fetch on-chain context for a given EVM address (best-effort).
 */
async function getOnChainContext(address) {
  const isKnownScam = KNOWN_SCAM_ADDRESSES.has(address.toLowerCase());

  try {
    const walletData = await fetchTransactions(address.toLowerCase(), "1");
    const riskResult = calculateRiskScore(walletData);

    return {
      address,
      found: true,
      isKnownScam,
      riskScore: riskResult.score,
      riskLevel: riskResult.riskLevel,
      verdict: riskResult.recommendation.verdict,
      totalTransactions: walletData.summary?.totalTransactions ?? 0,
      walletAgeDays: walletData.summary?.walletAgeDays ?? 0,
      failedTransactions: walletData.summary?.failedTransactionCount ?? 0,
      txFrequencyPerDay: walletData.summary?.txFrequencyPerDay ?? 0,
      flaggedContractCount: walletData.summary?.flaggedContractCount ?? 0,
      tokenDumpScore: walletData.summary?.tokenDumpScore ?? 0,
      suspiciousTransactionCount: walletData.suspiciousTransactions?.length ?? 0,
      factors: riskResult.factors ?? [],
      dataSource: walletData.source,
    };
  } catch {
    return {
      address,
      found: false,
      isKnownScam,
      riskScore: isKnownScam ? 95 : null,
      riskLevel: isKnownScam ? "Critical" : "Unknown",
      verdict: isKnownScam ? "Avoid" : "Unknown",
      error: "Could not fetch on-chain data. Results based on known scam database only.",
    };
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are TrustCopilot, an expert crypto security advisor built into the TrustCopilot platform.
Analyze wallet addresses, transactions, and contracts. Always respond in simple, clear language.
Give a direct Safe / Risky / Avoid verdict with reasoning.

When on-chain context is provided, use it to give specific, data-driven answers.
When asked about risk scores, explain what the numbers mean in plain English.
When asked about suspicious transactions, explain what the patterns mean for security.

Format your responses with:
1. A clear verdict (Safe ✅ / Risky ⚠️ / Avoid 🚫 / Informational ℹ️) when relevant
2. A concise explanation (2-4 sentences)
3. Specific risk factors if available
4. A recommended action

Always be honest and direct. If data is unavailable, say so clearly.
Never make up transaction data. Be conversational but professional.`;

// ─── Route ────────────────────────────────────────────────────────────────────

router.post(
  "/copilot-chat",
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 1000 })
      .withMessage("Message too long (max 1000 characters)"),
    body("history")
      .optional()
      .isArray({ max: 20 })
      .withMessage("History must be an array of up to 20 messages"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;

      // Check if Gemini API key is configured
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        return res.status(503).json({
          success: false,
          error:
            "AI Copilot is not configured. Please set GEMINI_API_KEY in backend .env (get yours at https://aistudio.google.com/app/apikey)",
        });
      }

      // ── Step 1: Extract wallet addresses from user message ──────────────────
      const addresses = extractAddresses(message);
      let onChainContexts = [];
      let contextSummary = "";

      if (addresses.length > 0) {
        // Fetch context for up to 2 addresses
        const toFetch = addresses.slice(0, 2);
        onChainContexts = await Promise.all(toFetch.map(getOnChainContext));

        // Build context block for the AI
        contextSummary = onChainContexts
          .map((ctx) => {
            if (!ctx.found && !ctx.isKnownScam) {
              return `\n[ON-CHAIN DATA for ${ctx.address}]: ${ctx.error || "No data available."}`;
            }
            return `\n[ON-CHAIN DATA for ${ctx.address}]:
- Known Scam Address: ${ctx.isKnownScam ? "YES ⛔" : "No"}
- Risk Score: ${ctx.riskScore ?? "N/A"}/100
- Risk Level: ${ctx.riskLevel}
- Verdict: ${ctx.verdict}
- Total Transactions: ${ctx.totalTransactions ?? "N/A"}
- Wallet Age: ${ctx.walletAgeDays ?? "N/A"} days
- Failed Transactions: ${ctx.failedTransactions ?? "N/A"}
- TX Frequency/Day: ${ctx.txFrequencyPerDay ?? "N/A"}
- Flagged Contracts Interacted: ${ctx.flaggedContractCount ?? "N/A"}
- Token Dump Score: ${ctx.tokenDumpScore ?? "N/A"}/100
- Suspicious Transaction Count: ${ctx.suspiciousTransactionCount ?? "N/A"}
- Risk Factors: ${ctx.factors?.map((f) => `${f.label} (${f.severity})`).join(", ") || "None detected"}
- Data Source: ${ctx.dataSource ?? "N/A"}`;
          })
          .join("\n\n");
      }

      // ── Step 2: Build Gemini chat history ─────────────────────────────────
      let safeHistory = (history || [])
        .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
        .slice(-18)
        .map((m) => ({
          // Gemini uses "model" instead of "assistant"
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      // Gemini requires the first message in history to be from the 'user'
      while (safeHistory.length > 0 && safeHistory[0].role === "model") {
        safeHistory.shift();
      }

      // Inject on-chain context into the user message
      const userMessageWithContext = contextSummary
        ? `${message}\n\n${contextSummary}`
        : message;

      // ── Step 3: Call Gemini ────────────────────────────────────────────────
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.4,
        },
      });

      const chat = model.startChat({ history: safeHistory });
      const result = await chat.sendMessage(userMessageWithContext);
      const responseText = result.response.text();

      // ── Step 4: Respond ────────────────────────────────────────────────────
      res.json({
        success: true,
        data: {
          response: responseText || "I couldn't generate a response. Please try again.",
          onChainContexts: onChainContexts.length > 0 ? onChainContexts : null,
          addressesAnalyzed: addresses,
          tokensUsed:
            (result.response.usageMetadata?.promptTokenCount ?? 0) +
            (result.response.usageMetadata?.candidatesTokenCount ?? 0),
          model: "gemini-flash-latest",
        },
      });
    } catch (err) {
      console.error("Gemini API Error:", err);
      // Handle Gemini API errors gracefully
      if (err?.status === 400 && err?.message?.includes("API_KEY")) {
        return res.status(401).json({
          success: false,
          error: "Invalid Gemini API key. Please check your GEMINI_API_KEY in backend .env",
        });
      }
      if (err?.status === 429 || err?.message?.includes("quota")) {
        return res.status(429).json({
          success: false,
          error: "Gemini rate limit reached. Please wait a moment and try again. If you just updated your API key, please restart your backend server.",
        });
      }
      next(err);
    }
  }
);

module.exports = router;
