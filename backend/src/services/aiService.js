const OpenAI = require("openai");

// Lazy-initialize OpenAI client only if API key is available
let openaiClient = null;
const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/**
 * Generate a human-readable AI explanation for a wallet's risk assessment.
 *
 * @param {Object} walletData  - Parsed wallet profile from walletService
 * @param {Object} riskResult  - Risk assessment from riskService
 * @returns {Promise<Object>}  - AI-generated explanation and decision
 */
const generateExplanation = async (walletData, riskResult) => {
  const client = getOpenAIClient();

  // If no OpenAI key, generate a rule-based fallback explanation
  if (!client) {
    console.warn("⚠️  No OpenAI API key. Using rule-based explanation.");
    return generateFallbackExplanation(walletData, riskResult);
  }

  const systemPrompt = `You are TrustCopilot, an expert blockchain security analyst specializing in 
Ethereum wallet risk assessment. Your role is to analyze wallet behavior data and provide clear, 
actionable security assessments for everyday crypto users.

Your analysis must be:
- Written in plain English (avoid excessive technical jargon)
- Factual and based only on the provided data
- Balanced (acknowledge both risk factors and positive signals)
- Actionable (tell users exactly what to do)
- Concise (3-4 paragraphs maximum)

Response format: Return valid JSON with keys: summary, explanation, keyFindings, recommendation`;

  const userPrompt = `Analyze this Ethereum wallet and provide a security assessment:

WALLET ADDRESS: ${walletData.address}
RISK SCORE: ${riskResult.score}/100 (${riskResult.riskLevel})
RECOMMENDATION: ${riskResult.recommendation.verdict}

WALLET STATISTICS:
- Wallet Age: ${walletData.summary.walletAgeDays} days
- Total Transactions: ${walletData.summary.totalTransactions}
- Unique Contracts Interacted: ${walletData.summary.uniqueContractsInteracted}
- Flagged Contract Interactions: ${walletData.summary.flaggedContractCount}
- Failed Transactions: ${walletData.summary.failedTransactionCount}
- Transaction Frequency: ${walletData.summary.txFrequencyPerDay} tx/day (last 30 days)
- Token Dump Score: ${walletData.summary.tokenDumpScore}/100
- Total ETH Sent: ${walletData.summary.totalValueSent} ETH
- Total ETH Received: ${walletData.summary.totalValueReceived} ETH

RISK BREAKDOWN:
${riskResult.factors.map((f) => `- ${f.label}: ${f.value} (${f.severity}) — ${f.description}`).join("\n")}

SUSPICIOUS TRANSACTIONS: ${walletData.suspiciousTransactions.length} flagged

Provide your analysis as JSON:
{
  "summary": "One sentence summary of the wallet's trustworthiness",
  "explanation": "2-3 paragraph detailed explanation of the risk assessment",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendation": "Clear action recommendation for someone considering transacting with this wallet"
}`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model for production
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,     // Low temperature for consistent, factual outputs
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    return {
      source: "openai",
      model: completion.model,
      summary: parsed.summary || "",
      explanation: parsed.explanation || "",
      keyFindings: parsed.keyFindings || [],
      recommendation: parsed.recommendation || riskResult.recommendation.action,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (err) {
    console.error("OpenAI API error:", err.message);
    // Graceful fallback on API error
    return generateFallbackExplanation(walletData, riskResult);
  }
};

/**
 * Rule-based fallback when OpenAI is unavailable.
 * Generates a coherent explanation from the structured risk data.
 */
const generateFallbackExplanation = (walletData, riskResult) => {
  const { summary } = walletData;
  const { score, riskLevel, factors, recommendation } = riskResult;

  const ageText =
    summary.walletAgeDays < 30
      ? `This is a relatively new wallet, only ${summary.walletAgeDays} days old, which adds to its risk profile.`
      : `The wallet has been active for ${summary.walletAgeDays} days, indicating some historical presence on-chain.`;

  const flaggedText =
    summary.flaggedContractCount > 0
      ? `Notably, this wallet has interacted with ${summary.flaggedContractCount} known suspicious contract(s), which is a significant red flag.`
      : `The wallet has not interacted with any known flagged contracts, which is a positive signal.`;

  const frequencyText =
    summary.txFrequencyPerDay > 10
      ? `The abnormally high transaction frequency of ${summary.txFrequencyPerDay} transactions per day suggests automated or bot-like behavior.`
      : `Transaction frequency appears normal at ${summary.txFrequencyPerDay} transactions per day.`;

  const explanation = `${ageText} ${flaggedText} ${frequencyText}

Out of ${summary.totalTransactions} total transactions analyzed, ${summary.failedTransactionCount} failed, and the wallet has interacted with ${summary.uniqueContractsInteracted} unique contracts. ${summary.tokenDumpScore > 40 ? `Token dump patterns were detected with a dump score of ${summary.tokenDumpScore}/100, indicating rapid buy-and-sell behavior.` : "No significant token dump patterns were identified."}

Based on our composite risk analysis across 5 behavioral factors, this wallet receives a risk score of ${score}/100, placing it in the ${riskLevel.replace("_", " ")} category.`;

  return {
    source: "fallback",
    model: "rule-based",
    summary: `This wallet has a ${riskLevel.replace("_", " ").toLowerCase()} profile with a score of ${score}/100.`,
    explanation,
    keyFindings: factors.map((f) => `${f.label}: ${f.description}`),
    recommendation: recommendation.action,
    tokensUsed: 0,
  };
};

/**
 * Quick decision endpoint: "Is this wallet safe?"
 * Returns a simplified verdict for direct user queries.
 */
const getDecision = (riskResult) => {
  const { score, riskLevel, recommendation } = riskResult;

  return {
    score,
    riskLevel,
    verdict: recommendation.verdict,
    action: recommendation.action,
    emoji: recommendation.emoji,
    color: recommendation.color,
    shouldTransact: score <= 40,
    confidenceLevel: score >= 80 || score <= 20 ? "HIGH" : score >= 60 || score <= 30 ? "MEDIUM" : "MODERATE",
  };
};

/**
 * Decision Copilot — generate a structured "What Should I Do?" answer.
 *
 * @param {Object} params
 * @param {string} params.address
 * @param {number} params.riskScore        0-100
 * @param {string} params.riskLevel        e.g. "HIGH_RISK"
 * @param {Object} params.summary          wallet summary stats
 * @param {Array}  params.suspiciousTransactions
 * @param {Array}  params.factors          risk factor objects
 * @returns {Promise<Object>}              Decision Copilot result
 */
const generateAIDecision = async ({
  address,
  riskScore,
  riskLevel,
  summary = {},
  suspiciousTransactions = [],
  factors = [],
}) => {
  const client = getOpenAIClient();

  if (!client) {
    console.warn("⚠️  No OpenAI key. Using rule-based AI decision.");
    return generateFallbackDecision({ riskScore, riskLevel, summary, suspiciousTransactions, factors });
  }

  const systemPrompt = `You are TrustCopilot's Decision Copilot — an expert blockchain security advisor.
Your job is to analyze wallet risk data and give the user a single clear, actionable recommendation.
Be empathetic, human, and direct. Avoid excessive jargon. Always answer as if talking to a non-technical user.
Return ONLY valid JSON — no extra text, no markdown.`;

  const walletContext = `
WALLET: ${address}
RISK SCORE: ${riskScore}/100
RISK LEVEL: ${riskLevel || "UNKNOWN"}

WALLET STATS:
- Age: ${summary.walletAgeDays ?? "?"} days
- Total Transactions: ${summary.totalTransactions ?? "?"}
- Failed Transactions: ${summary.failedTransactionCount ?? "?"}
- Flagged Contract Interactions: ${summary.flaggedContractCount ?? "?"}
- TX Frequency: ${summary.txFrequencyPerDay ?? "?"} per day
- Token Dump Score: ${summary.tokenDumpScore ?? "?"}/100
- Unique Contracts: ${summary.uniqueContractsInteracted ?? "?"}
- Total ETH Sent: ${summary.totalValueSent ?? "?"} ETH
- Total ETH Received: ${summary.totalValueReceived ?? "?"} ETH

SUSPICIOUS TRANSACTIONS: ${suspiciousTransactions.length} flagged

RISK FACTORS:
${factors.length > 0 ? factors.map(f => `- ${f.label}: ${f.value} (${f.severity}) — ${f.description}`).join("\n") : "- No significant risk factors"}
`;

  const userPrompt = `Analyze this wallet data and suggest the safest action for the user. If risky, recommend alternatives.

${walletContext}

Respond with this exact JSON structure:
{
  "riskLevel": "Safe" | "Risky" | "Avoid",
  "recommendation": "A clear, 1-2 sentence actionable recommendation written for a non-technical user.",
  "alternative": "If risky or avoid: suggest a concrete safer alternative the user can take. If safe, write null.",
  "confidenceScore": <integer 0-100 reflecting how confident you are in this assessment>,
  "whyExplanation": "A 2-3 sentence explanation of WHY you made this recommendation, citing the most important risk signals from the data."
}`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    return {
      source: "openai",
      model: completion.model,
      riskLevel: parsed.riskLevel || deriveRiskLabel(riskScore),
      recommendation: parsed.recommendation || "",
      alternative: parsed.alternative || null,
      confidenceScore: typeof parsed.confidenceScore === "number"
        ? Math.min(100, Math.max(0, parsed.confidenceScore))
        : deriveConfidence(riskScore),
      whyExplanation: parsed.whyExplanation || "",
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (err) {
    console.error("OpenAI AI-decision error:", err.message);
    return generateFallbackDecision({ riskScore, riskLevel, summary, suspiciousTransactions, factors });
  }
};

/** Rule-based fallback for the Decision Copilot when OpenAI is unavailable. */
const generateFallbackDecision = ({ riskScore, riskLevel, summary, suspiciousTransactions, factors }) => {
  const label = deriveRiskLabel(riskScore);
  const confidence = deriveConfidence(riskScore);

  let recommendation, alternative, whyExplanation;

  if (riskScore <= 30) {
    recommendation = "This wallet looks clean and trustworthy. You can proceed with your transaction, but always double-check the address before confirming.";
    alternative = null;
    whyExplanation = `The wallet has a low risk score of ${riskScore}/100 with no significant red flags detected. ${summary.walletAgeDays > 180 ? "It has been active for over 6 months, which is a positive sign." : ""} ${summary.flaggedContractCount === 0 ? "No interactions with known malicious contracts were found." : ""}`;
  } else if (riskScore <= 60) {
    recommendation = "Proceed with caution. Some risk signals were detected. Avoid sending large amounts and verify the recipient's identity through a trusted channel.";
    alternative = "Consider sending a small test transaction first (e.g. $1 worth), then verify it arrived before sending the full amount.";
    const topFactor = factors.find(f => f.severity === "high" || f.severity === "medium");
    whyExplanation = `Risk score is ${riskScore}/100 — in the moderate range. ${topFactor ? `The most notable concern is: ${topFactor.description}.` : `Several moderate risk signals were detected.`} ${suspiciousTransactions.length > 0 ? `${suspiciousTransactions.length} suspicious transaction(s) were flagged.` : ""}`;
  } else if (riskScore <= 80) {
    recommendation = "We strongly advise against transacting with this wallet. High-risk patterns have been detected that are commonly associated with scams and fraud.";
    alternative = "If you must send funds, use a reputable escrow service or a third-party smart contract with dispute resolution. Alternatively, request the counterparty verify their identity on a known platform.";
    whyExplanation = `Risk score is ${riskScore}/100 — high risk. ${suspiciousTransactions.length > 0 ? `${suspiciousTransactions.length} suspicious transaction(s) were flagged.` : ""} ${summary.flaggedContractCount > 0 ? `This wallet interacted with ${summary.flaggedContractCount} known malicious contract(s).` : ""} The behavioral patterns match known scam wallets.`;
  } else {
    recommendation = "DO NOT SEND ANY FUNDS to this wallet. Critical risk level — this wallet exhibits characteristics strongly associated with scams, rug pulls, or phishing attacks.";
    alternative = "Report this address to your wallet provider and relevant blockchain analytics platforms (e.g. Etherscan, Chainalysis). Do not interact under any circumstances.";
    whyExplanation = `Risk score is ${riskScore}/100 — critical. This is among the most dangerous wallet profiles our system has encountered. ${suspiciousTransactions.length > 0 ? `${suspiciousTransactions.length} transaction(s) have been flagged as suspicious.` : ""} ${summary.flaggedContractCount > 0 ? `${summary.flaggedContractCount} flagged contract interaction(s) were detected.` : ""} Immediate avoidance is recommended.`;
  }

  return {
    source: "fallback",
    model: "rule-based",
    riskLevel: label,
    recommendation,
    alternative,
    confidenceScore: confidence,
    whyExplanation,
    tokensUsed: 0,
  };
};

/** Map numeric score to label expected by frontend */
const deriveRiskLabel = (score) => {
  if (score <= 30) return "Safe";
  if (score <= 65) return "Risky";
  return "Avoid";
};

/** Confidence: edges of the scale are more certain */
const deriveConfidence = (score) => {
  const distance = Math.abs(score - 50);   // 0 at center, 50 at extremes
  return Math.round(55 + distance * 0.9);  // range 55–99
};

module.exports = { generateExplanation, getDecision, generateAIDecision };
