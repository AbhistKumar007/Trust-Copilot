"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";

// ─── EIP-1193 global type augmentation ────────────────────────────────────────
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      [key: string]: unknown;
    };
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TxStatus = "idle" | "checking" | "pending" | "success" | "error";

export interface TxResult {
  hash: string;
  explorerUrl: string;
}

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  chainName: string | null;
  isTestnet: boolean;
  isConnecting: boolean;
  isRefreshingBalance: boolean;
  error: string | null;
  txStatus: TxStatus;
  txResult: TxResult | null;
  txError: string | null;
}

export interface UseWalletReturn extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  sendTransaction: (to: string, amountEth: string) => Promise<void>;
  clearTxState: () => void;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

// ─── Network Map ───────────────────────────────────────────────────────────────

const NETWORK_MAP: Record<number, { name: string; symbol: string; explorer: string; testnet: boolean }> = {
  1:     { name: "Ethereum Mainnet", symbol: "ETH",   explorer: "https://etherscan.io",          testnet: false },
  11155111: { name: "Sepolia Testnet", symbol: "ETH",  explorer: "https://sepolia.etherscan.io",  testnet: true },
  137:   { name: "Polygon",          symbol: "MATIC", explorer: "https://polygonscan.com",        testnet: false },
  80001: { name: "Mumbai Testnet",   symbol: "MATIC", explorer: "https://mumbai.polygonscan.com", testnet: true },
  80002: { name: "Amoy Testnet",     symbol: "POL",   explorer: "https://amoy.polygonscan.com",  testnet: true },
  56:    { name: "BSC",              symbol: "BNB",   explorer: "https://bscscan.com",            testnet: false },
};

function getNetworkInfo(chainId: number) {
  return NETWORK_MAP[chainId] ?? {
    name: `Chain ${chainId}`,
    symbol: "ETH",
    explorer: "https://etherscan.io",
    testnet: false,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    chainName: null,
    isTestnet: false,
    isConnecting: false,
    isRefreshingBalance: false,
    error: null,
    txStatus: "idle",
    txResult: null,
    txError: null,
  });

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const fetchAndSetBalance = useCallback(
    async (prov: BrowserProvider, addr: string) => {
      try {
        const raw = await prov.getBalance(addr);
        const formatted = parseFloat(ethers.formatEther(raw)).toFixed(4);
        setState(s => ({ ...s, balance: formatted, isRefreshingBalance: false }));
      } catch {
        setState(s => ({ ...s, balance: "—", isRefreshingBalance: false }));
      }
    },
    []
  );

  // ── connect ───────────────────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState(s => ({ ...s, error: "MetaMask is not installed. Please install it at metamask.io" }));
      return;
    }
    setState(s => ({ ...s, isConnecting: true, error: null }));
    try {
      const prov = new BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();
      const network = await prov.getNetwork();
      const chainId = Number(network.chainId);
      const netInfo = getNetworkInfo(chainId);

      setProvider(prov);
      setSigner(sign);
      setState(s => ({
        ...s,
        address: addr,
        chainId,
        chainName: netInfo.name,
        isTestnet: netInfo.testnet,
        isConnecting: false,
        error: null,
        balance: null,
      }));

      await fetchAndSetBalance(prov, addr);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setState(s => ({
        ...s,
        isConnecting: false,
        error: msg.includes("user rejected") ? "Connection rejected by user." : msg,
      }));
    }
  }, [fetchAndSetBalance]);

  // ── disconnect ────────────────────────────────────────────────────────────────

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setState({
      address: null,
      balance: null,
      chainId: null,
      chainName: null,
      isTestnet: false,
      isConnecting: false,
      isRefreshingBalance: false,
      error: null,
      txStatus: "idle",
      txResult: null,
      txError: null,
    });
  }, []);

  // ── refresh balance ────────────────────────────────────────────────────────────

  const refreshBalance = useCallback(async () => {
    if (!provider || !state.address) return;
    setState(s => ({ ...s, isRefreshingBalance: true }));
    await fetchAndSetBalance(provider, state.address);
  }, [provider, state.address, fetchAndSetBalance]);

  // ── send transaction ──────────────────────────────────────────────────────────

  const sendTransaction = useCallback(
    async (to: string, amountEth: string) => {
      if (!signer || !provider || !state.address || !state.chainId) {
        setState(s => ({ ...s, txError: "Wallet not connected.", txStatus: "error" }));
        return;
      }
      if (!ethers.isAddress(to)) {
        setState(s => ({ ...s, txError: "Invalid recipient address.", txStatus: "error" }));
        return;
      }
      let value: bigint;
      try {
        value = ethers.parseEther(amountEth);
      } catch {
        setState(s => ({ ...s, txError: "Invalid amount.", txStatus: "error" }));
        return;
      }
      if (value <= 0n) {
        setState(s => ({ ...s, txError: "Amount must be greater than zero.", txStatus: "error" }));
        return;
      }

      setState(s => ({ ...s, txStatus: "pending", txError: null, txResult: null }));
      try {
        const tx = await signer.sendTransaction({ to, value });
        const netInfo = getNetworkInfo(state.chainId);
        const explorerUrl = `${netInfo.explorer}/tx/${tx.hash}`;
        setState(s => ({ ...s, txStatus: "success", txResult: { hash: tx.hash, explorerUrl } }));
        // Refresh balance after success (tx lands in mempool; real balance update may take a block)
        await fetchAndSetBalance(provider, state.address!);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setState(s => ({
          ...s,
          txStatus: "error",
          txError: msg.includes("user rejected") ? "Transaction rejected by user." : msg.slice(0, 120),
        }));
      }
    },
    [signer, provider, state.address, state.chainId, fetchAndSetBalance]
  );

  // ── clear tx state ────────────────────────────────────────────────────────────

  const clearTxState = useCallback(() => {
    setState(s => ({ ...s, txStatus: "idle", txResult: null, txError: null }));
  }, []);

  // ── MetaMask event listeners ───────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const ethereum = window.ethereum;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs.length) {
        disconnectWallet();
      } else if (provider) {
        const newAddr = accs[0];
        setSigner(null);
        provider.getSigner().then(sign => {
          setSigner(sign);
          setState(s => ({ ...s, address: newAddr }));
          fetchAndSetBalance(provider, newAddr);
        });
      }
    };

    const handleChainChanged = () => {
      // Reload is the recommended approach per MetaMask docs
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, disconnectWallet, fetchAndSetBalance]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    clearTxState,
    provider,
    signer,
  };
}
