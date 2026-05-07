/**
 * POST /api/wallet-personality
 * Generates a Wallet Personality Card for a connected wallet address.
 *
 * Uses Etherscan for on-chain data (wallet age, top tokens) and
 * Google Gemini to generate a unique AI quote about the wallet.
 */

const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { validate } = require("../middleware/validator");

// ─── Constants ────────────────────────────────────────────────────────────────

const ETHERSCAN_BASE = "https://api.etherscan.io/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch the first transaction timestamp for a wallet (wallet age).
 */
async function fetchWalletAge(address, apiKey) {
  try {
    const url = `${ETHERSCAN_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    if (data.status === "1" && data.result?.length > 0) {
      const firstTs = parseInt(data.result[0].timeStamp, 10);
      const ageMs = Date.now() - firstTs * 1000;
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      return { ageDays, firstTxDate: new Date(firstTs * 1000).toLocaleDateString() };
    }
  } catch {
    // silently fall through
  }
  return { ageDays: 0, firstTxDate: "Unknown" };
}

/**
 * Fetch total tx count + failed tx count for stats computation.
 */
async function fetchTxStats(address, apiKey) {
  try {
    const url = `${ETHERSCAN_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    if (data.status === "1" && Array.isArray(data.result)) {
      const txs = data.result;
      const total = txs.length;
      const failed = txs.filter((t) => t.isError === "1").length;
      // Measure avg hold between buys/sells using value field as proxy
      const highValueTxs = txs.filter((t) => parseFloat(t.value) > 0.5e18).length;
      return { total, failed, highValueTxs };
    }
  } catch {
    // silently fall through
  }
  return { total: 0, failed: 0, highValueTxs: 0 };
}

/**
 * Fetch top 3 ERC-20 tokens held by the wallet.
 */
async function fetchTopTokens(address, apiKey) {
  try {
    const url = `${ETHERSCAN_BASE}?module=account&action=tokentx&address=${address}&page=1&offset=50&sort=desc&apikey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    if (data.status === "1" && Array.isArray(data.result)) {
      // Count token appearances as a proxy for "held" tokens
      const tokenCounts = {};
      for (const tx of data.result) {
        const sym = tx.tokenSymbol || "?";
        tokenCounts[sym] = (tokenCounts[sym] || 0) + 1;
      }
      const sorted = Object.entries(tokenCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([sym]) => sym);
      return sorted.length > 0 ? sorted : ["ETH"];
    }
  } catch {
    // silently fall through
  }
  return ["ETH"];
}

/**
 * Derive personality stats from on-chain data (all values 0-100).
 */
function computeStats({ total, failed, highValueTxs, ageDays, balance }) {
  const balanceNum = parseFloat(balance) || 0;

  // Hold Strength: older wallet + lower tx count + higher balance = stronger holder
  const holdStrength = Math.min(
    100,
    Math.round(
      (ageDays / 365) * 35 +
      (1 - Math.min(total, 200) / 200) * 25 +
      Math.min(balanceNum / 10, 1) * 40
    )
  );

  // Trade Frequency: raw tx count mapped to 0-100
  const tradeFrequency = Math.min(100, Math.round((Math.min(total, 200) / 200) * 100));

  // Risk Appetite: high-value txs + failed txs = riskier
  const riskAppetite = Math.min(
    100,
    Math.round((highValueTxs / Math.max(total, 1)) * 60 + (failed / Math.max(total, 1)) * 40)
  );

  // Suspicion Level: failed txs + very high frequency = more suspicious
  const suspicionLevel = Math.min(
    100,
    Math.round(
      (failed / Math.max(total, 1)) * 50 +
      (tradeFrequency > 70 ? 30 : 0) +
      (ageDays < 30 && total > 20 ? 20 : 0)
    )
  );

  return { holdStrength, tradeFrequency, riskAppetite, suspicionLevel };
}

/**
 * Map stats to a Trust Grade (S/A/B/C/D).
 */
function computeGrade({ holdStrength, suspicionLevel, riskAppetite }) {
  const score = holdStrength - suspicionLevel * 0.5 - riskAppetite * 0.2;
  if (score >= 70) return "S";
  if (score >= 50) return "A";
  if (score >= 30) return "B";
  if (score >= 10) return "C";
  return "D";
}

/**
 * Map stats to a personality archetype title.
 */
function computePersonality({ holdStrength, tradeFrequency, riskAppetite, suspicionLevel, ageDays }) {
  if (suspicionLevel >= 50) return "Bot Suspect";
  if (holdStrength >= 70 && tradeFrequency <= 30) return "Diamond Hodler";
  if (riskAppetite >= 65 && tradeFrequency >= 60) return "Degen Trader";
  if (holdStrength >= 60 && riskAppetite >= 50) return "Whale Hunter";
  if (holdStrength >= 50 && tradeFrequency <= 40 && ageDays >= 180) return "Silent Accumulator";
  if (riskAppetite <= 30 && suspicionLevel <= 20) return "Cautious Investor";
  // fallback by dominant trait
  if (tradeFrequency >= 60) return "Degen Trader";
  if (holdStrength >= 40) return "Silent Accumulator";
  return "Cautious Investor";
}

/**
 * Generate a unique AI quote about the wallet using Gemini.
 */
async function generateAIQuote({ address, personalityTitle, grade, holdStrength, tradeFrequency, riskAppetite, suspicionLevel, ageDays, topTokens, apiKey }) {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const prompt = `You are TrustCopilot, an AI crypto security system. Generate a single witty, insightful one-liner quote (max 120 characters) about this wallet's on-chain personality. Do NOT use quotes around the text. Do NOT add any explanation.

Wallet profile:
- Address: ${shortAddr}
- Personality: ${personalityTitle}
- Trust Grade: ${grade}
- Hold Strength: ${holdStrength}%
- Trade Frequency: ${tradeFrequency}%
- Risk Appetite: ${riskAppetite}%
- Suspicion Level: ${suspicionLevel}%
- Wallet Age: ${ageDays} days
- Top Tokens: ${topTokens.join(", ")}

The quote should match the personality type. Be creative, slightly mysterious, and crypto-native in tone.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { maxOutputTokens: 80, temperature: 0.9 },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^["']|["']$/g, "");
    return text.slice(0, 130);
  } catch {
    // Fallback quotes per personality
    const fallbacks = {
      "Diamond Hodler": "Patience is not a virtue — it's a strategy.",
      "Degen Trader": "Every candle tells a story; I write mine in leveraged ink.",
      "Whale Hunter": "The market moves. I move first.",
      "Silent Accumulator": "The quietest wallets make the loudest gains.",
      "Bot Suspect": "Efficiency is just automation wearing a human mask.",
      "Cautious Investor": "Risk is the tax you pay for growth. I keep my tax bill low.",
    };
    return fallbacks[personalityTitle] || "In the blockchain we trust.";
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post(
  "/wallet-personality",
  [
    body("address")
      .trim()
      .notEmpty()
      .withMessage("address is required")
      .matches(/^[a-zA-Z0-9]{20,90}$/)
      .withMessage("Invalid wallet address"),
    body("balance")
      .optional()
      .isString(),
    body("chainId")
      .optional()
      .isNumeric(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { address, balance = "0", chainId = 1 } = req.body;
      const etherscanKey = process.env.ETHERSCAN_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      // ── Fetch on-chain data in parallel ───────────────────────────────────
      const [{ ageDays, firstTxDate }, { total, failed, highValueTxs }, topTokens] =
        await Promise.all([
          fetchWalletAge(address, etherscanKey),
          fetchTxStats(address, etherscanKey),
          fetchTopTokens(address, etherscanKey),
        ]);

      // ── Compute stats ─────────────────────────────────────────────────────
      const stats = computeStats({ total, failed, highValueTxs, ageDays, balance });
      const grade = computeGrade(stats);
      const personalityTitle = computePersonality({ ...stats, ageDays });

      // ── Generate AI quote ─────────────────────────────────────────────────
      const hasGemini = geminiKey && geminiKey !== "your_gemini_api_key_here";
      const aiQuote = await generateAIQuote({
        address,
        personalityTitle,
        grade,
        ...stats,
        ageDays,
        topTokens,
        apiKey: hasGemini ? geminiKey : null,
      });

      // ── Respond ───────────────────────────────────────────────────────────
      res.json({
        success: true,
        data: {
          address,
          shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
          personalityTitle,
          grade,
          stats: {
            holdStrength: stats.holdStrength,
            tradeFrequency: stats.tradeFrequency,
            riskAppetite: stats.riskAppetite,
            suspicionLevel: stats.suspicionLevel,
          },
          walletAge: { ageDays, firstTxDate },
          topTokens,
          aiQuote,
          chainId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
