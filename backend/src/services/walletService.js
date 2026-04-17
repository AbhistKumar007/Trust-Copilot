const axios = require("axios");

// ─── Known Flagged Contract List ──────────────────────────────────────────────
// In production, this would be fetched from a database or threat intelligence API
const KNOWN_SCAM_CONTRACTS = new Set([
  "0x00000000219ab540356cbb839cbe05303d7705fa", // Example placeholder
  "0xdead000000000000000042069420694206942069",
]);

/**
 * Fetch transaction history for a wallet using Etherscan API.
 * Falls back to Covalent API if Etherscan fails.
 *
 * @param {string} address - Ethereum wallet address
 * @param {string} chainId - Chain identifier (default: 1 for Ethereum mainnet)
 * @returns {Promise<Object>} Parsed wallet data
 */
const fetchTransactions = async (address, chainId = "1") => {
  // Try Etherscan first
  if (process.env.ETHERSCAN_API_KEY) {
    try {
      return await fetchFromEtherscan(address);
    } catch (err) {
      console.warn("⚠️  Etherscan failed, falling back to Covalent:", err.message);
    }
  }

  // Fallback to Covalent
  if (process.env.COVALENT_API_KEY) {
    return await fetchFromCovalent(address, chainId);
  }

  // Demo mode: return synthetic data if no API keys configured
  console.warn("⚠️  No API keys configured. Using demo wallet data.");
  return getDemoWalletData(address);
};

/**
 * Fetch from Etherscan API.
 */
const fetchFromEtherscan = async (address) => {
  const baseUrl = "https://api.etherscan.io/api";
  const apiKey = process.env.ETHERSCAN_API_KEY;

  const [txResponse, tokenResponse, internalResponse] = await Promise.allSettled([
    // Normal transactions
    axios.get(baseUrl, {
      params: {
        module: "account",
        action: "txlist",
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 200, // Last 200 transactions
        sort: "desc",
        apikey: apiKey,
      },
      timeout: 10000,
    }),
    // ERC-20 token transfers
    axios.get(baseUrl, {
      params: {
        module: "account",
        action: "tokentx",
        address,
        page: 1,
        offset: 100,
        sort: "desc",
        apikey: apiKey,
      },
      timeout: 10000,
    }),
    // Internal transactions
    axios.get(baseUrl, {
      params: {
        module: "account",
        action: "txlistinternal",
        address,
        page: 1,
        offset: 100,
        sort: "desc",
        apikey: apiKey,
      },
      timeout: 10000,
    }),
  ]);

  const transactions =
    txResponse.status === "fulfilled" && txResponse.value.data.status === "1"
      ? txResponse.value.data.result
      : [];

  const tokenTransfers =
    tokenResponse.status === "fulfilled" && tokenResponse.value.data.status === "1"
      ? tokenResponse.value.data.result
      : [];

  const internalTxs =
    internalResponse.status === "fulfilled" && internalResponse.value.data.status === "1"
      ? internalResponse.value.data.result
      : [];

  return parseWalletData(address, transactions, tokenTransfers, internalTxs, "etherscan");
};

/**
 * Fetch from Covalent API (supports multiple chains).
 */
const fetchFromCovalent = async (address, chainId) => {
  const apiKey = process.env.COVALENT_API_KEY;
  const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/transactions_v3/`;

  const response = await axios.get(url, {
    auth: { username: apiKey, password: "" },
    params: { "page-size": 200 },
    timeout: 15000,
  });

  const rawTxs = response.data?.data?.items || [];

  // Normalize Covalent format to match our internal format
  const transactions = rawTxs.map((tx) => ({
    hash: tx.tx_hash,
    from: tx.from_address,
    to: tx.to_address,
    value: tx.value,
    timeStamp: new Date(tx.block_signed_at).getTime() / 1000,
    isError: tx.successful ? "0" : "1",
    gasUsed: tx.gas_spent,
    gasPrice: tx.gas_price,
    blockNumber: tx.block_height,
  }));

  return parseWalletData(address, transactions, [], [], "covalent");
};

/**
 * Parse raw transaction data into a structured wallet profile.
 */
const parseWalletData = (address, transactions, tokenTransfers, internalTxs, source) => {
  const now = Math.floor(Date.now() / 1000);

  // Wallet age (days since first transaction)
  const timestamps = transactions.map((tx) => parseInt(tx.timeStamp)).filter(Boolean);
  const firstTxTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : now;
  const walletAgeDays = Math.floor((now - firstTxTimestamp) / 86400);

  // Failed transactions
  const failedTxCount = transactions.filter((tx) => tx.isError === "1").length;

  // Unique contracts interacted with
  const contractsInteracted = new Set(
    transactions
      .filter((tx) => tx.to && tx.to !== address.toLowerCase())
      .map((tx) => tx.to?.toLowerCase())
  );

  // Flagged contract interactions
  const flaggedInteractions = transactions.filter((tx) =>
    KNOWN_SCAM_CONTRACTS.has(tx.to?.toLowerCase())
  );

  // Transaction frequency (per day over last 30 days)
  const thirtyDaysAgo = now - 30 * 86400;
  const recentTxs = transactions.filter(
    (tx) => parseInt(tx.timeStamp) > thirtyDaysAgo
  );
  const txFrequencyPerDay = walletAgeDays > 0 ? recentTxs.length / 30 : 0;

  // Token dump pattern detection
  // A dump pattern: many outgoing token transfers in a short window
  const outgoingTokenTx = tokenTransfers.filter(
    (tx) => tx.from?.toLowerCase() === address.toLowerCase()
  );
  const incomingTokenTx = tokenTransfers.filter(
    (tx) => tx.to?.toLowerCase() === address.toLowerCase()
  );

  // Check for rapid buy-then-sell within 24 hours (token dump signal)
  const tokenDumpScore = detectTokenDumpPattern(outgoingTokenTx, incomingTokenTx);

  // Value analysis
  const totalValueSent = transactions
    .filter((tx) => tx.from?.toLowerCase() === address.toLowerCase())
    .reduce((sum, tx) => sum + parseFloat(tx.value || 0) / 1e18, 0);

  const totalValueReceived = transactions
    .filter((tx) => tx.to?.toLowerCase() === address.toLowerCase())
    .reduce((sum, tx) => sum + parseFloat(tx.value || 0) / 1e18, 0);

  // Recent suspicious transactions for display
  const suspiciousTransactions = [
    ...flaggedInteractions.map((tx) => ({
      hash: tx.hash,
      type: "Flagged Contract Interaction",
      timestamp: parseInt(tx.timeStamp),
      to: tx.to,
      severity: "high",
    })),
    ...transactions
      .filter((tx) => tx.isError === "1")
      .slice(0, 5)
      .map((tx) => ({
        hash: tx.hash,
        type: "Failed Transaction",
        timestamp: parseInt(tx.timeStamp),
        to: tx.to,
        severity: "medium",
      })),
  ].slice(0, 10);

  return {
    address: address.toLowerCase(),
    source,
    summary: {
      totalTransactions: transactions.length,
      walletAgeDays,
      firstSeen: new Date(firstTxTimestamp * 1000).toISOString(),
      uniqueContractsInteracted: contractsInteracted.size,
      flaggedContractCount: flaggedInteractions.length,
      failedTransactionCount: failedTxCount,
      txFrequencyPerDay: parseFloat(txFrequencyPerDay.toFixed(2)),
      tokenDumpScore,
      totalValueSent: parseFloat(totalValueSent.toFixed(6)),
      totalValueReceived: parseFloat(totalValueReceived.toFixed(6)),
      recentTxCount: recentTxs.length,
    },
    suspiciousTransactions,
    rawTransactionCount: transactions.length,
  };
};

/**
 * Detect token dump patterns: quick sell after buy within 24h.
 * Returns a score 0-100 indicating dump likelihood.
 */
const detectTokenDumpPattern = (outgoing, incoming) => {
  if (incoming.length === 0 || outgoing.length === 0) return 0;

  let dumpSignals = 0;
  const oneDaySeconds = 86400;

  for (const inTx of incoming) {
    const buyTime = parseInt(inTx.timeStamp);
    const tokenSymbol = inTx.tokenSymbol;

    // Check if same token was sold within 24 hours
    const quickSell = outgoing.find(
      (outTx) =>
        outTx.tokenSymbol === tokenSymbol &&
        parseInt(outTx.timeStamp) - buyTime < oneDaySeconds &&
        parseInt(outTx.timeStamp) > buyTime
    );

    if (quickSell) dumpSignals++;
  }

  return Math.min(100, Math.round((dumpSignals / Math.max(incoming.length, 1)) * 100));
};

/**
 * Generate demo wallet data when no API keys are configured.
 * Used for local development and testing only.
 */
const getDemoWalletData = (address) => {
  const isHighRisk = address.toLowerCase().includes("dead") || address.slice(-4) < "5000";

  return {
    address: address.toLowerCase(),
    source: "demo",
    summary: {
      totalTransactions: isHighRisk ? 847 : 142,
      walletAgeDays: isHighRisk ? 12 : 380,
      firstSeen: new Date(Date.now() - (isHighRisk ? 12 : 380) * 86400000).toISOString(),
      uniqueContractsInteracted: isHighRisk ? 89 : 23,
      flaggedContractCount: isHighRisk ? 7 : 0,
      failedTransactionCount: isHighRisk ? 34 : 3,
      txFrequencyPerDay: isHighRisk ? 28.5 : 1.2,
      tokenDumpScore: isHighRisk ? 78 : 5,
      totalValueSent: isHighRisk ? 45.23 : 2.8,
      totalValueReceived: isHighRisk ? 46.11 : 3.1,
      recentTxCount: isHighRisk ? 245 : 18,
    },
    suspiciousTransactions: isHighRisk
      ? [
          {
            hash: "0xdemo...abc1",
            type: "Flagged Contract Interaction",
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            to: "0xknown_scam_contract",
            severity: "high",
          },
          {
            hash: "0xdemo...abc2",
            type: "Token Dump Pattern",
            timestamp: Math.floor(Date.now() / 1000) - 7200,
            to: "0xuniswap_router",
            severity: "high",
          },
        ]
      : [],
    rawTransactionCount: isHighRisk ? 847 : 142,
  };
};

module.exports = { fetchTransactions };
