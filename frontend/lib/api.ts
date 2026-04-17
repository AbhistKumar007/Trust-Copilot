import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

/* ─── Wallet Analysis ───────────────────────────────────────────────────────── */

export interface AnalysisResponse {
  success: boolean;
  data: {
    wallet: {
      address: string;
      chainId: string;
    };
    summary: {
      totalTransactions: number;
      walletAgeDays: number;
      firstSeen: string;
      uniqueContractsInteracted: number;
      flaggedContractCount: number;
      failedTransactionCount: number;
      txFrequencyPerDay: number;
      tokenDumpScore: number;
      totalValueSent: number;
      totalValueReceived: number;
    };
    risk: {
      score: number;
      riskLevel: string;
      recommendation: {
        verdict: string;
        action: string;
        emoji: string;
        color: string;
      };
      breakdown: {
        flaggedContractScore: number;
        txFrequencyScore: number;
        tokenDumpScore: number;
        walletAgeScore: number;
        failedTxScore: number;
      };
      factors: Array<{
        label: string;
        value: string | number;
        severity: "high" | "medium" | "low" | "none";
        description: string;
      }>;
    };
    ai: {
      summary: string;
      explanation: string;
      keyFindings: string[];
      recommendation: string;
      source: string;
    };
    decision: {
      score: number;
      verdict: string;
      action: string;
      emoji: string;
      color: string;
      shouldTransact: boolean;
    };
    suspiciousTransactions: Array<{
      hash: string;
      type: string;
      timestamp: number;
      to: string;
      severity: string;
    }>;
  };
}

export const analyzeWallet = async (address: string, chainId: string = "1") => {
  const response = await apiClient.post<AnalysisResponse>("/analyze-wallet", {
    address,
    chainId,
  });
  return response.data;
};

export const getRiskScore = async (address: string, chainId: string = "1") => {
  const response = await apiClient.post("/risk-score", {
    address,
    chainId,
  });
  return response.data;
};

/* ─── Pre-Transaction Check ─────────────────────────────────────────────────── */

export interface PreTransactionCheckResponse {
  success: boolean;
  data: {
    address: string;
    risk: AnalysisResponse["data"]["risk"];
    decision: AnalysisResponse["data"]["decision"];
    ai: AnalysisResponse["data"]["ai"];
    isBlocked: boolean;
  };
}

export const preTransactionCheck = async (address: string, chainId: string = "1") => {
  const response = await apiClient.post<PreTransactionCheckResponse>("/pre-transaction-check", {
    address,
    chainId,
  });
  return response.data;
};

/* ─── Decision Copilot ─────────────────────────────────────────────────────── */

export interface AIDecisionResponse {
  success: boolean;
  data: {
    source: string;
    model: string;
    riskLevel: "Safe" | "Risky" | "Avoid";
    recommendation: string;
    alternative: string | null;
    confidenceScore: number;
    whyExplanation: string;
    tokensUsed: number;
  };
}

export const getAIDecision = async (
  address: string,
  riskScore: number,
  riskLevel: string,
  summary: AnalysisResponse["data"]["summary"],
  suspiciousTransactions: AnalysisResponse["data"]["suspiciousTransactions"],
  factors: AnalysisResponse["data"]["risk"]["factors"]
) => {
  const response = await apiClient.post<AIDecisionResponse>("/ai-decision", {
    address,
    riskScore,
    riskLevel,
    summary,
    suspiciousTransactions,
    factors,
  });
  return response.data;
};

/* ─── Wallet DNA ────────────────────────────────────────────────────────────── */

export interface WalletDNAProfile {
  address: string;
  type: "Trader" | "Long-term Holder" | "Bot-like Behavior" | "High-risk / Scam-like";
  risk_level: "Low" | "Medium" | "High" | "Critical";
  activity_score: number;
  behavior_tags: string[];
  metrics: {
    tx_frequency_per_day: number;
    holding_duration_days: number;
    unique_contracts: number;
    interaction_diversity: number;
    volatility_score: number;
    failed_tx_rate: number;
    token_dump_score: number;
    flagged_contract_count: number;
    total_transactions: number;
  };
  radar: {
    txFrequency: number;
    holdingDuration: number;
    interactionDiversity: number;
    volatility: number;
    riskExposure: number;
  };
  timeline: Array<{ month: string; txCount: number }>;
  dataSource: string;
}

export interface WalletDNAResponse {
  success: boolean;
  data: WalletDNAProfile;
}

export interface WalletDNACompareResponse {
  success: boolean;
  data: {
    a: WalletDNAProfile;
    b: WalletDNAProfile;
    delta: Record<string, number>;
  };
}

export const getWalletDNA = async (address: string, chainId: string = "1") => {
  const response = await apiClient.post<WalletDNAResponse>("/wallet-dna", {
    address,
    chainId,
  });
  return response.data;
};

export const compareWalletDNA = async (
  addressA: string,
  addressB: string,
  chainId: string = "1"
) => {
  const response = await apiClient.post<WalletDNACompareResponse>("/wallet-dna/compare", {
    addressA,
    addressB,
    chainId,
  });
  return response.data;
};
