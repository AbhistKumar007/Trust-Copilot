"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, RefreshCw, ChevronDown, LogOut, Copy,
  CheckCircle2, AlertTriangle, Loader2, ExternalLink,
} from "lucide-react";
import { NetworkBadge } from "./NetworkBadge";
import type { UseWalletReturn } from "@/hooks/useWallet";

// ─── Helper ────────────────────────────────────────────────────────────────────

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WalletConnectProps {
  wallet: UseWalletReturn;
}

export function WalletConnect({ wallet }: WalletConnectProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ── Not Connected ─────────────────────────────────────────────────────────────

  if (!wallet.address) {
    return (
      <div className="flex items-center gap-2">
        {wallet.error && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl max-w-[220px] truncate">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{wallet.error}</span>
          </div>
        )}
        <motion.button
          id="wallet-connect-btn"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={wallet.connectWallet}
          disabled={wallet.isConnecting}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl" />
          <span className="relative z-10 flex items-center gap-2">
            {wallet.isConnecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
            ) : (
              <><Wallet className="w-4 h-4" /> Connect Wallet</>
            )}
          </span>
        </motion.button>
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────────

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-2">
      {/* Balance pill */}
      <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
        {wallet.isRefreshingBalance ? (
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Fetching…
          </span>
        ) : (
          <span className="text-xs font-mono font-bold text-emerald-400">
            {wallet.balance ?? "—"} ETH
          </span>
        )}
        <button
          id="wallet-refresh-balance-btn"
          onClick={wallet.refreshBalance}
          disabled={wallet.isRefreshingBalance}
          className="text-gray-600 hover:text-white transition-colors disabled:opacity-40 ml-0.5"
          title="Refresh balance"
        >
          <RefreshCw className={`w-3 h-3 ${wallet.isRefreshingBalance ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Network badge */}
      <NetworkBadge chainName={wallet.chainName} isTestnet={wallet.isTestnet} />

      {/* Address button / dropdown trigger */}
      <motion.button
        id="wallet-address-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setDropdownOpen(o => !o)}
        className="flex items-center gap-2 bg-white/[0.04] border border-white/10 hover:border-violet-500/30 rounded-xl px-3 py-2 transition-all"
      >
        {/* Avatar */}
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0" />
        <span className="text-xs font-mono font-bold text-white">
          {truncateAddress(wallet.address)}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 z-50 bg-[#0d1117] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Wallet header */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Connected Wallet</p>
              <p className="text-sm font-mono text-white break-all leading-relaxed">{wallet.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <NetworkBadge chainName={wallet.chainName} isTestnet={wallet.isTestnet} size="md" />
                {wallet.isTestnet && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    ⚠ Testnet
                  </span>
                )}
              </div>
            </div>

            {/* Balance row */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Balance</p>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {wallet.isRefreshingBalance ? "…" : (wallet.balance ?? "—")} ETH
                </p>
              </div>
              <button
                onClick={wallet.refreshBalance}
                disabled={wallet.isRefreshingBalance}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${wallet.isRefreshingBalance ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Actions */}
            <div className="px-3 py-2 space-y-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </button>

              {wallet.chainId && (
                <a
                  href={`${getExplorerBase(wallet.chainId)}/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
                  onClick={() => setDropdownOpen(false)}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </a>
              )}

              <div className="border-t border-white/[0.05] mt-1 pt-1">
                <button
                  id="wallet-disconnect-btn"
                  onClick={() => { wallet.disconnectWallet(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.07] transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.01]">
              <p className="text-[10px] text-gray-700 leading-relaxed">
                This app does not control your funds. All transactions require your explicit MetaMask approval.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── internal helper ──────────────────────────────────────────────────────────

function getExplorerBase(chainId: number): string {
  const map: Record<number, string> = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
    80002: "https://amoy.polygonscan.com",
    56: "https://bscscan.com",
  };
  return map[chainId] ?? "https://etherscan.io";
}
