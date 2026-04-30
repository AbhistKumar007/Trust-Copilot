"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, RefreshCw, Shield, Info, ShieldAlert,
  ArrowRight, Wallet, Copy, CheckCheck,
} from "lucide-react";
import { ethers } from "ethers";
import { preTransactionCheck } from "@/lib/api";
import { InterceptorModal } from "./InterceptorModal";
import type { UseWalletReturn } from "@/hooks/useWallet";
import type { PreTransactionCheckResponse } from "@/lib/api";

// ─── Helper ────────────────────────────────────────────────────────────────────

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SendTransactionProps {
  wallet: UseWalletReturn;
  isAutoProtect: boolean;
}

export function SendTransaction({ wallet, isAutoProtect }: SendTransactionProps) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [interceptData, setInterceptData] = useState<PreTransactionCheckResponse["data"] | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────────

  const validateInputs = (): boolean => {
    let valid = true;
    if (!ethers.isAddress(to)) {
      setAddressError("Invalid EVM address (must be 0x…, 42 chars)");
      valid = false;
    } else {
      setAddressError("");
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError("Amount must be > 0");
      valid = false;
    } else if (wallet.balance && parsed > parseFloat(wallet.balance)) {
      setAmountError("Insufficient balance");
      valid = false;
    } else {
      setAmountError("");
    }
    return valid;
  };

  // ── Pre-check + send flow ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    wallet.clearTxState();

    if (isAutoProtect) {
      setIsChecking(true);
      try {
        const result = await preTransactionCheck(to);
        if (result.success && result.data.isBlocked) {
          setInterceptData(result.data);
          setShowModal(true);
          setIsChecking(false);
          return;
        }
      } catch {
        // If check fails, allow transaction to continue
      } finally {
        setIsChecking(false);
      }
    }

    await wallet.sendTransaction(to, amount);
  };

  const handleProceed = async () => {
    setShowModal(false);
    await wallet.sendTransaction(to, amount);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleCopyHash = () => {
    if (wallet.txResult?.hash) {
      navigator.clipboard.writeText(wallet.txResult.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1500);
    }
  };

  const handleMaxAmount = () => {
    if (wallet.balance) {
      // Leave a small buffer for gas
      const max = Math.max(0, parseFloat(wallet.balance) - 0.001);
      setAmount(max.toFixed(6));
    }
  };

  // ── Not connected state ───────────────────────────────────────────────────────

  if (!wallet.address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-5">
          <Wallet className="w-8 h-8 text-violet-500/40" />
        </div>
        <p className="text-gray-400 text-sm font-semibold mb-1">Wallet not connected</p>
        <p className="text-gray-600 text-xs">
          Connect your MetaMask wallet using the button in the top-right corner to send transactions.
        </p>
      </motion.div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Auto-Protect status banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium",
            isAutoProtect
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
              : "bg-amber-500/5 border-amber-500/20 text-amber-300"
          )}
        >
          <Shield className="w-4 h-4 flex-shrink-0" />
          {isAutoProtect
            ? "Auto-Protect ACTIVE — addresses will be risk-checked before any transaction is sent."
            : "Auto-Protect OFF — transactions will be sent without risk checking."}
        </motion.div>

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0d1117] border border-white/[0.07] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Send size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Send Transaction</p>
                <p className="text-[11px] text-gray-600">Real transaction via MetaMask — no simulations</p>
              </div>
            </div>
            {/* Balance display */}
            <div className="text-right">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Balance</p>
              <p className="text-sm font-black font-mono text-emerald-400">
                {wallet.isRefreshingBalance ? "…" : (wallet.balance ?? "—")} ETH
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Recipient Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Recipient Address
                </label>
                <div className="relative">
                  <input
                    id="send-tx-to-address"
                    type="text"
                    value={to}
                    onChange={e => { setTo(e.target.value); setAddressError(""); wallet.clearTxState(); }}
                    placeholder="0x..."
                    className={cn(
                      "w-full bg-[#070a10] border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none font-mono transition-all",
                      addressError
                        ? "border-rose-500/50 focus:border-rose-500/70"
                        : "border-white/[0.08] focus:border-sky-500/40"
                    )}
                    disabled={wallet.txStatus === "pending" || isChecking}
                  />
                </div>
                {addressError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                    <XCircle className="w-3.5 h-3.5" /> {addressError}
                  </p>
                )}
                {/* Valid indicator */}
                {to && !addressError && ethers.isAddress(to) && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid EVM address
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Amount (ETH)
                </label>
                <div className="relative">
                  <input
                    id="send-tx-amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setAmountError(""); wallet.clearTxState(); }}
                    placeholder="0.000000"
                    className={cn(
                      "w-full bg-[#070a10] border rounded-xl px-4 py-3 pr-20 text-sm text-white placeholder-gray-700 outline-none transition-all",
                      amountError
                        ? "border-rose-500/50 focus:border-rose-500/70"
                        : "border-white/[0.08] focus:border-sky-500/40"
                    )}
                    disabled={wallet.txStatus === "pending" || isChecking}
                  />
                  {wallet.balance && (
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 px-2 py-1 rounded-lg transition-all"
                    >
                      MAX
                    </button>
                  )}
                </div>
                {amountError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                    <XCircle className="w-3.5 h-3.5" /> {amountError}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                id="send-tx-submit-btn"
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={wallet.txStatus === "pending" || isChecking || !to || !amount}
                className="w-full relative py-3.5 rounded-xl font-bold text-sm overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl opacity-90 group-hover:opacity-100 group-disabled:opacity-50 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isChecking ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Running risk check…</>
                  ) : wallet.txStatus === "pending" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for MetaMask…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Transaction <ArrowRight className="w-4 h-4" /></>
                  )}
                </span>
              </motion.button>
            </form>

            {/* ── Status displays ─────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">

              {/* Pending */}
              {wallet.txStatus === "pending" && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20"
                >
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-sky-300">Transaction Pending</p>
                    <p className="text-xs text-gray-500 mt-0.5">Please confirm in MetaMask…</p>
                  </div>
                </motion.div>
              )}

              {/* Success */}
              {wallet.txStatus === "success" && wallet.txResult && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-300">Transaction Sent!</p>
                      <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{wallet.txResult.hash}</p>
                    </div>
                    <button
                      onClick={handleCopyHash}
                      className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                      title="Copy hash"
                    >
                      {copiedHash ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <a
                      href={wallet.txResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View on Explorer
                    </a>
                    <button
                      onClick={() => { wallet.clearTxState(); setTo(""); setAmount(""); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> New Transaction
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {wallet.txStatus === "error" && wallet.txError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20"
                >
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-300">Transaction Failed</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{wallet.txError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer info */}
          <div className="px-6 py-4 border-t border-white/[0.05] flex items-start gap-3 bg-white/[0.01]">
            <Info className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="text-gray-400 font-semibold">Disclaimer:</span>{" "}
              This app does not control your funds. All transactions are user-approved via MetaMask and executed at your own risk. Always verify the recipient address.
            </p>
          </div>
        </motion.div>

        {/* Quick-fill risky test addresses */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-bold text-gray-400">Test Auto-Protect with risky addresses</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { addr: "0xdead000000000000000042069420694206942069", label: "Burn Address" },
              { addr: "0x00000000219ab540356cbb839cbe05303d7705fa", label: "ETH2 Deposit" },
            ].map(({ addr, label }) => (
              <button
                key={addr}
                type="button"
                onClick={() => { setTo(addr); setAddressError(""); wallet.clearTxState(); }}
                className="flex items-center gap-2 text-[11px] font-mono text-rose-400/70 bg-rose-500/5 border border-rose-500/15 rounded-lg px-3 py-1.5 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
              >
                <span className="text-[9px] font-bold text-rose-500/60 uppercase">{label}</span>
                {addr.slice(0, 8)}…{addr.slice(-6)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk interception modal */}
      <InterceptorModal
        isOpen={showModal}
        score={interceptData?.risk?.score ?? 0}
        explanation={interceptData?.ai?.summary ?? "This address has been flagged as high risk."}
        targetAddress={to}
        onProceed={handleProceed}
        onCancel={handleCancel}
      />
    </>
  );
}
