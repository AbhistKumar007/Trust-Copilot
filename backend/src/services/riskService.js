/**
 * Risk Scoring Engine for TrustCopilot.
 * Generates a composite risk score (0-100) from wallet behavior data.
 *
 * Score Factors:
 *  1. Flagged contract interactions (weight: 35%)
 *  2. Transaction frequency anomalies (weight: 20%)
 *  3. Token dump patterns (weight: 20%)
 *  4. Wallet age (weight: 15%)
 *  5. Failed transaction ratio (weight: 10%)
 */

// ─── Scoring Thresholds ───────────────────────────────────────────────────────

const THRESHOLDS = {
  // Flagged contract score
  flaggedContracts: {
    none: 0,      // 0 flagged interactions → 0 points
    low: 30,      // 1-2 → 30 points
    medium: 60,   // 3-5 → 60 points
    high: 100,    // 6+  → 100 points
  },
  // Wallet age score (newer = higher risk)
  walletAge: {
    veryNew: 100,     // < 7 days
    new: 70,          // 7-30 days
    moderate: 40,     // 30-180 days
    established: 10,  // 180-365 days
    veteran: 0,       // > 365 days
  },
  // Transaction frequency per day (abnormally high = suspicious)
  txFrequency: {
    veryHigh: 100,  // > 50 tx/day
    high: 70,       // 20-50 tx/day
    medium: 40,     // 5-20 tx/day
    normal: 10,     // 1-5 tx/day
    low: 0,         // < 1 tx/day
  },
};

// ─── Factor Weights ───────────────────────────────────────────────────────────

const WEIGHTS = {
  flaggedContracts: 0.35,
  tokenDump: 0.20,
  txFrequency: 0.20,
  walletAge: 0.15,
  failedTxRatio: 0.10,
};

/**
 * Calculate a composite risk score (0-100) from wallet data.
 *
 * @param {Object} walletData - Parsed wallet data from walletService
 * @returns {Object} Structured risk assessment
 */
const calculateRiskScore = (walletData) => {
  const { summary } = walletData;

  // ── Factor 1: Flagged Contract Interactions ───────────────────────────────
  const flaggedScore = scoreFlaggedContracts(summary.flaggedContractCount);

  // ── Factor 2: Transaction Frequency ───────────────────────────────────────
  const frequencyScore = scoreTxFrequency(summary.txFrequencyPerDay);

  // ── Factor 3: Token Dump Pattern ──────────────────────────────────────────
  const dumpScore = summary.tokenDumpScore; // Already 0-100

  // ── Factor 4: Wallet Age ──────────────────────────────────────────────────
  const ageScore = scoreWalletAge(summary.walletAgeDays);

  // ── Factor 5: Failed Transaction Ratio ───────────────────────────────────
  const failedRatio =
    summary.totalTransactions > 0
      ? summary.failedTransactionCount / summary.totalTransactions
      : 0;
  const failedScore = Math.min(100, Math.round(failedRatio * 200)); // 50% failures → 100

  // ── Composite Score ───────────────────────────────────────────────────────
  const rawScore =
    flaggedScore * WEIGHTS.flaggedContracts +
    dumpScore * WEIGHTS.tokenDump +
    frequencyScore * WEIGHTS.txFrequency +
    ageScore * WEIGHTS.walletAge +
    failedScore * WEIGHTS.failedTxRatio;

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // ── Risk Level Classification ─────────────────────────────────────────────
  const riskLevel = classifyRiskLevel(finalScore);

  // ── Recommendation ────────────────────────────────────────────────────────
  const recommendation = getRecommendation(finalScore, summary);

  return {
    score: finalScore,
    riskLevel,
    recommendation,
    breakdown: {
      flaggedContractScore: Math.round(flaggedScore),
      txFrequencyScore: Math.round(frequencyScore),
      tokenDumpScore: Math.round(dumpScore),
      walletAgeScore: Math.round(ageScore),
      failedTxScore: Math.round(failedScore),
    },
    factors: buildFactorsList(summary, finalScore),
    calculatedAt: new Date().toISOString(),
  };
};

// ─── Helper Scorers ───────────────────────────────────────────────────────────

const scoreFlaggedContracts = (count) => {
  if (count === 0) return THRESHOLDS.flaggedContracts.none;
  if (count <= 2) return THRESHOLDS.flaggedContracts.low;
  if (count <= 5) return THRESHOLDS.flaggedContracts.medium;
  return THRESHOLDS.flaggedContracts.high;
};

const scoreWalletAge = (days) => {
  if (days < 7) return THRESHOLDS.walletAge.veryNew;
  if (days < 30) return THRESHOLDS.walletAge.new;
  if (days < 180) return THRESHOLDS.walletAge.moderate;
  if (days < 365) return THRESHOLDS.walletAge.established;
  return THRESHOLDS.walletAge.veteran;
};

const scoreTxFrequency = (txPerDay) => {
  if (txPerDay > 50) return THRESHOLDS.txFrequency.veryHigh;
  if (txPerDay > 20) return THRESHOLDS.txFrequency.high;
  if (txPerDay > 5) return THRESHOLDS.txFrequency.medium;
  if (txPerDay > 1) return THRESHOLDS.txFrequency.normal;
  return THRESHOLDS.txFrequency.low;
};

// ─── Classification & Recommendations ────────────────────────────────────────

const classifyRiskLevel = (score) => {
  if (score <= 20) return "SAFE";
  if (score <= 40) return "LOW_RISK";
  if (score <= 60) return "MEDIUM_RISK";
  if (score <= 80) return "HIGH_RISK";
  return "CRITICAL_RISK";
};

const getRecommendation = (score, summary) => {
  if (score <= 20) {
    return {
      verdict: "SAFE",
      action: "This wallet appears trustworthy. Safe to transact.",
      emoji: "✅",
      color: "#22c55e",
    };
  }
  if (score <= 40) {
    return {
      verdict: "PROCEED WITH CAUTION",
      action: "Low risk signals detected. Verify identity before large transactions.",
      emoji: "🟡",
      color: "#eab308",
    };
  }
  if (score <= 60) {
    return {
      verdict: "RISKY",
      action: "Moderate risk detected. Exercise caution and limit exposure.",
      emoji: "⚠️",
      color: "#f97316",
    };
  }
  if (score <= 80) {
    return {
      verdict: "HIGH RISK — AVOID",
      action: "High-risk patterns detected. Strongly recommend avoiding transactions.",
      emoji: "🔴",
      color: "#ef4444",
    };
  }
  return {
    verdict: "CRITICAL — DO NOT INTERACT",
    action: "Critical risk level. This wallet shows scam/fraud characteristics. Do not send funds.",
    emoji: "🚨",
    color: "#dc2626",
  };
};

/**
 * Build a human-readable list of risk factors for the UI.
 */
const buildFactorsList = (summary, score) => {
  const factors = [];

  if (summary.flaggedContractCount > 0) {
    factors.push({
      label: "Flagged Contract Interactions",
      value: summary.flaggedContractCount,
      severity: summary.flaggedContractCount > 3 ? "high" : "medium",
      description: `Interacted with ${summary.flaggedContractCount} known suspicious contract(s)`,
    });
  }

  if (summary.walletAgeDays < 30) {
    factors.push({
      label: "New Wallet",
      value: `${summary.walletAgeDays} days old`,
      severity: summary.walletAgeDays < 7 ? "high" : "medium",
      description: "Recently created wallets are associated with higher scam risk",
    });
  }

  if (summary.txFrequencyPerDay > 10) {
    factors.push({
      label: "Abnormal Transaction Frequency",
      value: `${summary.txFrequencyPerDay} tx/day`,
      severity: summary.txFrequencyPerDay > 30 ? "high" : "medium",
      description: "Unusually high transaction rate suggests automated or bot-like behavior",
    });
  }

  if (summary.tokenDumpScore > 40) {
    factors.push({
      label: "Token Dump Pattern",
      value: `${summary.tokenDumpScore}/100`,
      severity: summary.tokenDumpScore > 70 ? "high" : "medium",
      description: "Pattern of buying and rapidly selling tokens within 24 hours",
    });
  }

  if (summary.failedTransactionCount > 10) {
    factors.push({
      label: "High Failed Transactions",
      value: summary.failedTransactionCount,
      severity: "low",
      description: "Many failed transactions may indicate front-running or bot activity",
    });
  }

  if (factors.length === 0) {
    factors.push({
      label: "No Significant Risk Factors",
      value: "Clean",
      severity: "none",
      description: "No suspicious patterns detected in transaction history",
    });
  }

  return factors;
};

module.exports = { calculateRiskScore, classifyRiskLevel };
