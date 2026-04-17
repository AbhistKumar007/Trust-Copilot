/**
 * Wallet DNA Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a behavioral fingerprint for any wallet address.
 * Classifies wallets as: Trader | Long-term Holder | Bot-like | High-risk/Scam
 * Returns structured profile with radar-chart-ready metrics.
 */

const { fetchTransactions } = require("./walletService");

// ─── Type definitions ────────────────────────────────────────────────────────

/**
 * @typedef {Object} WalletDNA
 * @property {string}   type          - Primary classification
 * @property {string}   risk_level    - "Low" | "Medium" | "High" | "Critical"
 * @property {number}   activity_score - 0–100 composite score
 * @property {string[]} behavior_tags
 * @property {Object}   metrics        - Raw metric values
 * @property {Object}   radar          - Normalised 0–100 values for radar chart
 * @property {Object[]} timeline       - Activity bucketed by month (last 6m)
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const BOT_TX_THRESHOLD        = 20;   // txns / day suggesting bot
const TRADER_TX_THRESHOLD     = 5;    // txns / day suggesting active trader
const HOLDER_MAX_FREQ         = 0.5;  // txns / day for holder
const HIGH_RISK_DUMP_SCORE    = 60;
const HIGH_RISK_FLAGGED       = 3;
const HIGH_RISK_FAIL_RATE     = 0.2;  // 20% failed tx rate
const DEX_CONTRACTS = new Set([
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap v2 router
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap v3 router
  "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // SushiSwap
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff", // 0x Exchange Proxy
]);

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * Generate behavioral fingerprint for a wallet.
 *
 * @param {string} address
 * @param {string} [chainId="1"]
 * @returns {Promise<WalletDNA>}
 */
const generateWalletDNA = async (address, chainId = "1") => {
  const walletData = await fetchTransactions(address.toLowerCase(), chainId);
  return buildDNA(walletData);
};

/**
 * Compare two wallets and return their DNA profiles side-by-side.
 *
 * @param {string} addressA
 * @param {string} addressB
 * @param {string} [chainId="1"]
 * @returns {Promise<{a: WalletDNA, b: WalletDNA, delta: Object}>}
 */
const compareWallets = async (addressA, addressB, chainId = "1") => {
  const [dataA, dataB] = await Promise.all([
    fetchTransactions(addressA.toLowerCase(), chainId),
    fetchTransactions(addressB.toLowerCase(), chainId),
  ]);

  const dnaA = buildDNA(dataA);
  const dnaB = buildDNA(dataB);

  // Compute per-metric delta (positive = A is higher)
  const delta = {};
  for (const key of Object.keys(dnaA.radar)) {
    delta[key] = dnaA.radar[key] - dnaB.radar[key];
  }

  return { a: dnaA, b: dnaB, delta };
};

// ─── Core builder ────────────────────────────────────────────────────────────

const buildDNA = (walletData) => {
  const { summary, suspiciousTransactions = [] } = walletData;

  // ── Raw metrics ──────────────────────────────────────────────────────────
  const txFrequency       = summary.txFrequencyPerDay ?? 0;
  const holdingDuration   = summary.walletAgeDays ?? 0;
  const uniqueContracts   = summary.uniqueContractsInteracted ?? 0;
  const failedTxCount     = summary.failedTransactionCount ?? 0;
  const totalTx           = summary.totalTransactions ?? 0;
  const dumpScore         = summary.tokenDumpScore ?? 0;
  const flaggedContracts  = summary.flaggedContractCount ?? 0;
  const failRate          = totalTx > 0 ? failedTxCount / totalTx : 0;
  const recentTx          = summary.recentTxCount ?? 0;

  // ── Interaction diversity (0–100) ──────────────────────────────────────
  // Based on unique contracts relative to total transactions
  const interactionDiversity = totalTx > 0
    ? Math.min(100, Math.round((uniqueContracts / Math.max(totalTx, 1)) * 200))
    : 0;

  // ── Volatility pattern (0–100) ────────────────────────────────────────
  // Combination of dump score + failed tx rate + frequency spikes
  const volatilityScore = Math.min(
    100,
    Math.round(
      dumpScore * 0.5 +
      failRate * 100 * 0.3 +
      Math.min(txFrequency / BOT_TX_THRESHOLD, 1) * 100 * 0.2
    )
  );

  // ── Normalised radar values (all 0–100) ──────────────────────────────
  const radar = {
    txFrequency:          Math.min(100, Math.round((txFrequency / BOT_TX_THRESHOLD) * 100)),
    holdingDuration:      Math.min(100, Math.round((holdingDuration / 730) * 100)),   // 2 yrs = 100
    interactionDiversity,
    volatility:           volatilityScore,
    riskExposure:         Math.min(100, Math.round(flaggedContracts * 15 + dumpScore * 0.3)),
  };

  // ── Behavior tags ────────────────────────────────────────────────────
  const behavior_tags = deriveTags({
    txFrequency, holdingDuration, interactionDiversity,
    volatilityScore, flaggedContracts, failRate, dumpScore,
    uniqueContracts, totalTx, recentTx,
  });

  // ── Classification ───────────────────────────────────────────────────
  const type = classifyWallet({
    txFrequency, holdingDuration, dumpScore,
    flaggedContracts, failRate, recentTx, uniqueContracts, totalTx,
  });

  // ── Risk level ───────────────────────────────────────────────────────
  const risk_level = deriveRiskLevel({
    flaggedContracts, dumpScore, failRate, txFrequency, type,
  });

  // ── Composite activity score (0–100) ──────────────────────────────
  const activity_score = computeActivityScore({
    txFrequency, uniqueContracts, interactionDiversity,
    holdingDuration, failRate, totalTx,
  });

  // ── Timeline (last 6 months, synthetic from summary) ─────────────
  const timeline = buildTimeline(summary);

  return {
    address: walletData.address,
    type,
    risk_level,
    activity_score,
    behavior_tags,
    metrics: {
      tx_frequency_per_day:       parseFloat(txFrequency.toFixed(2)),
      holding_duration_days:      holdingDuration,
      unique_contracts:           uniqueContracts,
      interaction_diversity:      interactionDiversity,
      volatility_score:           volatilityScore,
      failed_tx_rate:             parseFloat((failRate * 100).toFixed(1)),
      token_dump_score:           dumpScore,
      flagged_contract_count:     flaggedContracts,
      total_transactions:         totalTx,
    },
    radar,
    timeline,
    dataSource: walletData.source,
  };
};

// ─── Classification helpers ──────────────────────────────────────────────────

const classifyWallet = ({ txFrequency, holdingDuration, dumpScore, flaggedContracts, failRate, recentTx, uniqueContracts, totalTx }) => {
  // High-risk / scam patterns take priority
  if (flaggedContracts >= HIGH_RISK_FLAGGED || dumpScore >= HIGH_RISK_DUMP_SCORE) {
    return "High-risk / Scam-like";
  }

  // Bot-like: very high frequency + low contract diversity
  const diversityRatio = totalTx > 0 ? uniqueContracts / totalTx : 0;
  if (txFrequency >= BOT_TX_THRESHOLD && diversityRatio < 0.05) {
    return "Bot-like Behavior";
  }
  if (txFrequency >= BOT_TX_THRESHOLD * 0.7 && failRate >= HIGH_RISK_FAIL_RATE) {
    return "Bot-like Behavior";
  }

  // Active trader: moderate-high frequency + DEX interactions
  if (txFrequency >= TRADER_TX_THRESHOLD && dumpScore >= 20) {
    return "Trader";
  }
  if (txFrequency >= TRADER_TX_THRESHOLD && uniqueContracts >= 10) {
    return "Trader";
  }

  // Long-term holder: old wallet, low activity
  if (holdingDuration >= 180 && txFrequency <= HOLDER_MAX_FREQ) {
    return "Long-term Holder";
  }
  if (holdingDuration >= 90 && recentTx <= 5) {
    return "Long-term Holder";
  }

  // Default: if moderate activity
  if (txFrequency >= TRADER_TX_THRESHOLD) return "Trader";
  if (txFrequency < 1) return "Long-term Holder";
  return "Trader";
};

const deriveTags = ({ txFrequency, holdingDuration, interactionDiversity, volatilityScore, flaggedContracts, failRate, dumpScore, uniqueContracts, totalTx, recentTx }) => {
  const tags = [];

  if (txFrequency >= BOT_TX_THRESHOLD)        tags.push("High frequency");
  else if (txFrequency >= TRADER_TX_THRESHOLD) tags.push("Moderate frequency");
  else                                          tags.push("Low frequency");

  if (holdingDuration >= 365)                  tags.push("Diamond hands");
  else if (holdingDuration >= 90)              tags.push("Medium holder");
  else                                          tags.push("New wallet");

  if (uniqueContracts >= 20)                   tags.push("DEX interaction");
  if (uniqueContracts >= 50)                   tags.push("Power user");

  if (dumpScore >= 60)                         tags.push("Token dump pattern");
  else if (dumpScore >= 30)                    tags.push("Occasional flip");

  if (flaggedContracts > 0)                    tags.push("Flagged contract hit");
  if (failRate >= HIGH_RISK_FAIL_RATE)         tags.push("High fail rate");

  if (volatilityScore >= 70)                   tags.push("High volatility");
  else if (volatilityScore >= 40)              tags.push("Moderate volatility");

  if (interactionDiversity >= 60)              tags.push("Diverse interactions");

  if (recentTx === 0)                          tags.push("Dormant");
  else if (recentTx >= 50)                     tags.push("Recently very active");

  return tags.slice(0, 6); // cap at 6 tags
};

const deriveRiskLevel = ({ flaggedContracts, dumpScore, failRate, txFrequency, type }) => {
  if (flaggedContracts >= 5 || dumpScore >= 80) return "Critical";
  if (flaggedContracts >= HIGH_RISK_FLAGGED || dumpScore >= HIGH_RISK_DUMP_SCORE || failRate >= 0.3) return "High";
  if (type === "Bot-like Behavior" || txFrequency >= TRADER_TX_THRESHOLD * 2 || dumpScore >= 30) return "Medium";
  return "Low";
};

const computeActivityScore = ({ txFrequency, uniqueContracts, interactionDiversity, holdingDuration, failRate, totalTx }) => {
  const freqScore       = Math.min(40, Math.round((txFrequency / 10) * 40));
  const diversityScore  = Math.min(30, Math.round((interactionDiversity / 100) * 30));
  const ageBonus        = Math.min(20, Math.round((holdingDuration / 365) * 20));
  const penaltyFail     = Math.round(failRate * 100 * 0.1);
  return Math.max(0, Math.min(100, freqScore + diversityScore + ageBonus - penaltyFail + 10));
};

// ─── Timeline builder (synthetic for demo / real when available) ─────────────

const buildTimeline = (summary) => {
  const months = 6;
  const result = [];
  const now    = Date.now();
  const totalTx = summary.totalTransactions ?? 0;
  const recentTx = summary.recentTxCount ?? 0;

  // Distribute recent txs across last 2 months with some variance, older months quieter
  const weights = [0.05, 0.08, 0.10, 0.12, 0.25, 0.40]; // oldest → newest

  for (let i = 0; i < months; i++) {
    const d = new Date(now - (months - i) * 30 * 86400000);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const baseCount = Math.round(recentTx > 0 ? recentTx * 2 * weights[i] : totalTx * weights[i]);
    const jitter = Math.round((Math.random() - 0.5) * baseCount * 0.4);
    result.push({ month: label, txCount: Math.max(0, baseCount + jitter) });
  }

  return result;
};

module.exports = { generateWalletDNA, compareWallets };
