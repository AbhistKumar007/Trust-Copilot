const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { fetchTransactions } = require("../services/walletService");
const { calculateRiskScore } = require("../services/riskService");
const { generateExplanation, getDecision } = require("../services/aiService");
const { generateWalletDNA, compareWallets } = require("../services/walletDnaService");
const { validate, isValidCryptoAddress } = require("../middleware/validator");
const { analyzeRateLimiter } = require("../middleware/rateLimiter");

// ─── Validation Rules ─────────────────────────────────────────────────────────

const walletAddressValidation = [
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Wallet address is required")
    .custom(isValidCryptoAddress)
    .withMessage("Invalid crypto address format. Must be alphanumeric."),
  body("chainId")
    .optional()
    .isIn(["1", "137", "80001", "56"])
    .withMessage("Unsupported chain ID. Supported: 1 (ETH), 137 (Polygon), 80001 (Mumbai), 56 (BSC)"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/analyze-wallet
 * Full analysis pipeline: fetch → score → AI explanation → decision
 *
 * Body: { address: string, chainId?: string }
 * Returns: Complete wallet analysis report
 */
router.post(
  "/analyze-wallet",
  analyzeRateLimiter,
  walletAddressValidation,
  validate,
  async (req, res, next) => {
    const startTime = Date.now();

    try {
      const { address, chainId = "1" } = req.body;
      const normalizedAddress = address.toLowerCase();

      console.log(`🔍 Analyzing wallet: ${normalizedAddress} (chain: ${chainId})`);

      // Step 1: Fetch wallet transaction data
      const walletData = await fetchTransactions(normalizedAddress, chainId);

      // Step 2: Calculate risk score
      const riskResult = calculateRiskScore(walletData);

      // Step 3: Generate AI explanation (runs concurrently with decision)
      const [aiResult, decision] = await Promise.all([
        generateExplanation(walletData, riskResult),
        Promise.resolve(getDecision(riskResult)),
      ]);

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          wallet: {
            address: normalizedAddress,
            chainId,
            analysisTimestamp: new Date().toISOString(),
            processingTimeMs: processingTime,
          },
          summary: walletData.summary,
          risk: riskResult,
          ai: aiResult,
          decision,
          suspiciousTransactions: walletData.suspiciousTransactions,
          dataSource: walletData.source,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/risk-score
 * Returns only the risk score and breakdown (no AI explanation).
 * Faster and cheaper than full analysis.
 *
 * Body: { address: string, chainId?: string }
 */
router.post(
  "/risk-score",
  walletAddressValidation,
  validate,
  async (req, res, next) => {
    try {
      const { address, chainId = "1" } = req.body;

      const walletData = await fetchTransactions(address.toLowerCase(), chainId);
      const riskResult = calculateRiskScore(walletData);

      res.json({
        success: true,
        data: {
          address: address.toLowerCase(),
          ...riskResult,
          walletSummary: walletData.summary,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/ai-explanation
 * Generate AI explanation for a pre-computed risk score.
 * Useful when re-analyzing without re-fetching transaction data.
 *
 * Body: { address: string, score: number, walletData?: object }
 */
router.post(
  "/ai-explanation",
  [
    body("address")
      .trim()
      .notEmpty()
      .custom(isValidCryptoAddress)
      .withMessage("Invalid wallet address"),
    body("score")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Score must be a number between 0 and 100"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { address, score, walletData: providedWalletData } = req.body;

      // Use provided data or fetch fresh
      const walletData =
        providedWalletData || (await fetchTransactions(address.toLowerCase()));
      const riskResult = calculateRiskScore(walletData);

      // Override score if explicitly provided
      riskResult.score = Math.round(score);

      const aiResult = await generateExplanation(walletData, riskResult);

      res.json({
        success: true,
        data: {
          address: address.toLowerCase(),
          aiExplanation: aiResult,
          decision: getDecision(riskResult),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/wallet-info/:address
 * Quick lookup — returns wallet summary without scoring (no API key needed).
 */
router.get(
  "/wallet-info/:address",
  async (req, res, next) => {
    try {
      const { address } = req.params;

      if (!isValidCryptoAddress(address)) {
        return res.status(422).json({
          success: false,
          error: "Invalid crypto address format",
        });
      }

      const walletData = await fetchTransactions(address.toLowerCase());

      res.json({
        success: true,
        data: {
          address: address.toLowerCase(),
          summary: walletData.summary,
          suspiciousTransactions: walletData.suspiciousTransactions,
          dataSource: walletData.source,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/pre-transaction-check
 * Optimized for intercepting outgoing transactions before execution.
 * Fast check returning risk score and short AI explanation warning.
 *
 * Body: { address: string, chainId?: string }
 */
router.post(
  "/pre-transaction-check",
  walletAddressValidation,
  validate,
  async (req, res, next) => {
    try {
      const { address, chainId = "1" } = req.body;
      const normalizedAddress = address.toLowerCase();

      // Quick fetch & score
      const walletData = await fetchTransactions(normalizedAddress, chainId);
      const riskResult = calculateRiskScore(walletData);

      // Generate context-aware AI warning (we can reuse the same AI service or generate faster)
      const aiResult = await generateExplanation(walletData, riskResult);
      const decision = getDecision(riskResult);

      res.json({
        success: true,
        data: {
          address: normalizedAddress,
          risk: riskResult,
          decision,
          ai: aiResult,
          // Threshold of 70 dictates auto-blocking
          isBlocked: riskResult.score >= 70,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/ai-decision
 * Decision Copilot — "What Should I Do?"
 * Accepts wallet analysis data + risk score and returns a structured AI decision.
 *
 * Body: { address, riskScore, riskLevel, summary, suspiciousTransactions?, factors? }
 * Returns: { riskLevel, recommendation, alternative, confidenceScore, whyExplanation }
 */
router.post(
  "/ai-decision",
  [
    body("address")
      .trim()
      .notEmpty()
      .custom(isValidCryptoAddress)
      .withMessage("Invalid wallet address"),
    body("riskScore")
      .isFloat({ min: 0, max: 100 })
      .withMessage("riskScore must be 0–100"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        address,
        riskScore,
        riskLevel,
        summary = {},
        suspiciousTransactions = [],
        factors = [],
      } = req.body;

      const { generateAIDecision } = require("../services/aiService");

      const decisionResult = await generateAIDecision({
        address,
        riskScore,
        riskLevel,
        summary,
        suspiciousTransactions,
        factors,
      });

      res.json({ success: true, data: decisionResult });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/wallet-dna
 * Generate behavioral fingerprint for a wallet.
 *
 * Body: { address: string, chainId?: string }
 * Returns: WalletDNA profile with type, risk_level, activity_score, behavior_tags, metrics, radar, timeline
 */
router.post(
  "/wallet-dna",
  analyzeRateLimiter,
  walletAddressValidation,
  validate,
  async (req, res, next) => {
    try {
      const { address, chainId = "1" } = req.body;
      console.log(`🧬 Generating Wallet DNA for: ${address}`);

      const dna = await generateWalletDNA(address.toLowerCase(), chainId);

      res.json({ success: true, data: dna });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/wallet-dna/compare
 * Compare behavioral fingerprints of two wallets.
 *
 * Body: { addressA: string, addressB: string, chainId?: string }
 * Returns: { a: WalletDNA, b: WalletDNA, delta: Object }
 */
router.post(
  "/wallet-dna/compare",
  analyzeRateLimiter,
  [
    body("addressA")
      .trim()
      .notEmpty()
      .custom(isValidCryptoAddress)
      .withMessage("Invalid addressA"),
    body("addressB")
      .trim()
      .notEmpty()
      .custom(isValidCryptoAddress)
      .withMessage("Invalid addressB"),
    body("chainId")
      .optional()
      .isIn(["1", "137", "80001", "56"])
      .withMessage("Unsupported chain ID"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { addressA, addressB, chainId = "1" } = req.body;
      console.log(`🧬 Comparing DNA: ${addressA} vs ${addressB}`);

      const result = await compareWallets(
        addressA.toLowerCase(),
        addressB.toLowerCase(),
        chainId
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/transaction-status
 * Check on-chain confirmation of a submitted transaction.
 * Frontend polls this after sending to get confirmed block/gas info.
 *
 * Body: { txHash: string, chainId?: string }
 * Returns: { confirmed: bool, blockNumber?, gasUsed?, status? }
 */
router.post(
  "/transaction-status",
  [
    body("txHash")
      .trim()
      .notEmpty()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("Invalid transaction hash format"),
    body("chainId")
      .optional()
      .isIn(["1", "137", "80001", "80002", "11155111", "56"])
      .withMessage("Unsupported chain ID"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { txHash, chainId = "1" } = req.body;

      // Map chainId to public RPC endpoint
      const RPC_MAP = {
        "1":        "https://ethereum.publicnode.com",
        "11155111": "https://sepolia.publicnode.com",
        "137":      "https://polygon.publicnode.com",
        "80001":    "https://polygon-mumbai.publicnode.com",
        "80002":    "https://polygon-amoy.publicnode.com",
        "56":       "https://bsc.publicnode.com",
      };

      const rpcUrl = RPC_MAP[chainId] || RPC_MAP["1"];

      // Use JSON-RPC to fetch receipt
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [txHash],
          id: 1,
        }),
      });

      const rpcData = await rpcResponse.json();
      const receipt = rpcData.result;

      if (!receipt) {
        return res.json({
          success: true,
          data: {
            txHash,
            confirmed: false,
            message: "Transaction is still pending or not found",
          },
        });
      }

      res.json({
        success: true,
        data: {
          txHash,
          confirmed: true,
          blockNumber: parseInt(receipt.blockNumber, 16),
          gasUsed: parseInt(receipt.gasUsed, 16),
          status: receipt.status === "0x1" ? "success" : "failed",
          from: receipt.from,
          to: receipt.to,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

