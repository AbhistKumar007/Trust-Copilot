"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Search, Loader2, ShieldAlert,
  Bot, Sparkles, Lightbulb, History, AlertCircle,
  ArrowRight, Send, Info, Zap, LayoutDashboard,
  Activity, Settings, Bell, ChevronRight, Shield,
  AlertTriangle, XOctagon, TrendingUp, Clock,
  Globe, Cpu, ExternalLink, Copy, CheckCircle2,
  Home, ArrowLeft, Dna, Wallet, CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeWallet, preTransactionCheck, getAIDecision, type AnalysisResponse, type PreTransactionCheckResponse, type AIDecisionResponse } from "@/lib/api";
import { InterceptorModal } from "@/components/InterceptorModal";
import { DecisionCopilot } from "@/components/DecisionCopilot";
import { WalletDNA } from "@/components/WalletDNA";
import { WalletConnect } from "@/components/WalletConnect";
import { SendTransaction } from "@/components/SendTransaction";
import { AICopilotChat } from "@/components/AICopilotChat";
import { WalletPersonalityCard } from "@/components/WalletPersonalityCard";
import { useWallet } from "@/hooks/useWallet";

/* ─────────────────────────────── helpers ─────────────────────────────────── */
function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const truncate = (s: string, start = 8, end = 6) =>
  s ? `${s.slice(0, start)}...${s.slice(-end)}` : "";

/* ─────────────────────────────── types ──────────────────────────────────── */
type AnalysisData = AnalysisResponse["data"];
type ActiveView = "analyzer" | "sandbox" | "history" | "wallet-dna" | "wallet";

/* ─────────────────────────────── Sidebar ────────────────────────────────── */
const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "analyzer", label: "Wallet Analyzer", icon: Search },
  { id: "wallet-dna", label: "Wallet DNA", icon: Dna, badge: "New" },
  { id: "wallet", label: "My Wallet", icon: Wallet, badge: "Live" },
  { id: "sandbox", label: "TX Sandbox", icon: Send },
  { id: "history", label: "History", icon: History },
];

function Sidebar({ active, setActive }: { active: ActiveView; setActive: (v: ActiveView) => void }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] flex flex-col z-40 border-r border-white/[0.06] bg-[#070a10]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/landing" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_24px_rgba(139,92,246,0.7)] transition-shadow">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-[15px] tracking-tight leading-none text-white">
              Trust<span className="text-violet-400">Copilot</span>
            </p>
            <p className="text-[10px] text-gray-600 font-medium tracking-wider">AI ENGINE v1.0</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-2 mb-3">Tools</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-violet-500/10 border border-violet-500/20"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                />
              )}
              <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-violet-400" : "text-gray-600 group-hover:text-gray-400")} />
              <span className="relative z-10">{label}</span>
              {badge && (
                <span className="ml-auto relative z-10 text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/[0.05]">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-2 mb-3">App</p>
          <Link href="/landing">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] transition-all duration-200 group">
              <Home className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
              Landing Page
            </button>
          </Link>
        </div>
      </nav>

      {/* Bottom version tag */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-600">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────── Top Bar ────────────────────────────────── */
function TopBar({
  isAutoProtect,
  setAutoProtect,
  activeView,
  wallet,
}: {
  isAutoProtect: boolean;
  setAutoProtect: (v: boolean) => void;
  activeView: ActiveView;
  wallet: ReturnType<typeof useWallet>;
}) {
  const titles: Record<ActiveView, { title: string; sub: string }> = {
    analyzer: { title: "Wallet Analyzer", sub: "Paste any address and run a full AI risk scan" },
    "wallet-dna": { title: "Wallet DNA", sub: "Generate a behavioral fingerprint and personality profile for any wallet" },
    wallet: { title: "My Wallet", sub: "Connect MetaMask, view balance, and send transactions securely" },
    sandbox: { title: "Transaction Sandbox", sub: "Simulate and test the Auto-Protect interceptor" },
    history: { title: "Scan History", sub: "Previous wallet analyses and risk events" },
  };
  const { title, sub } = titles[activeView];

  return (
    <header className="fixed top-0 left-[220px] right-0 z-30 border-b border-white/[0.06] bg-[#070a10]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-white font-bold text-lg leading-none">{title}</h1>
          <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-Protect Toggle */}
          <button
            onClick={() => setAutoProtect(!isAutoProtect)}
            className={cn(
              "relative flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300",
              isAutoProtect
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:border-emerald-500/50"
                : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isAutoProtect ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse" : "bg-gray-600"
            )} />
            <Shield className="w-3.5 h-3.5" />
            Auto-Protect {isAutoProtect ? "ON" : "OFF"}
          </button>

          {/* Wallet Connect widget */}
          <WalletConnect wallet={wallet} />

          {/* Notification bell placeholder */}
          <button className="relative w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────── Risk Gauge ─────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  const colors =
    score > 80 ? { from: "#be123c", to: "#9f1239", glow: "rgba(190,18,60,0.5)", label: "CRITICAL", textClass: "text-rose-400" }
      : score > 60 ? { from: "#ef4444", to: "#dc2626", glow: "rgba(239,68,68,0.4)", label: "HIGH RISK", textClass: "text-red-400" }
        : score > 40 ? { from: "#f97316", to: "#ea580c", glow: "rgba(249,115,22,0.4)", label: "MEDIUM", textClass: "text-orange-400" }
          : score > 20 ? { from: "#eab308", to: "#ca8a04", glow: "rgba(234,179,8,0.4)", label: "LOW RISK", textClass: "text-yellow-400" }
            : { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.4)", label: "SAFE", textClass: "text-emerald-400" };

  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width="140" height="140" className="-rotate-90">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70" cy="70" r={r}
          stroke="url(#gauge-grad)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-black text-white"
        >
          {score}
        </motion.span>
        <span className="text-xs text-gray-500 font-semibold">/100</span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={cn("text-xs font-black tracking-[0.2em] uppercase mt-2", colors.textClass)}
      >
        {colors.label}
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────── Stat Pill ──────────────────────────────── */
function StatPill({ label, value, color = "violet" }: { label: string; value: string | number; color?: string }) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };
  return (
    <div className={cn("flex flex-col gap-0.5 px-3 py-2 rounded-xl border", colorMap[color] ?? colorMap.violet)}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <span className={cn("text-sm font-black", colorMap[color]?.split(" ")[0])}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────── Analyzer View ──────────────────────────── */
function AnalyzerView() {
  const [address, setAddress] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  // Decision Copilot state
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decision, setDecision] = useState<AIDecisionResponse["data"] | null>(null);
  const [decisionError, setDecisionError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[a-zA-Z0-9]{20,90}$/.test(address.trim())) {
      setError("Invalid wallet address format.");
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      setDecision(null);
      setDecisionError("");
      const res = await analyzeWallet(address.trim());
      if (res.success) setResult(res.data);
    } catch {
      setError("Analysis failed. Check backend connection or API limits.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!result) return;
    setDecisionError("");
    setDecisionLoading(true);
    try {
      const res = await getAIDecision(
        result.wallet.address,
        result.risk.score,
        result.risk.riskLevel,
        result.summary,
        result.suspiciousTransactions,
        result.risk.factors
      );
      if (res.success) setDecision(res.data);
    } catch {
      setDecisionError("Decision Copilot failed. Please try again.");
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.wallet?.address) {
      navigator.clipboard.writeText(result.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const score = result?.risk?.score ?? 0;
  const isSafe = score <= 40;
  const isCritical = score >= 80;
  const verdictColor = isCritical ? "rose" : isSafe ? "emerald" : "amber";
  const verdictColorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: { bg: "bg-emerald-500/5", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-[0_0_30px_rgba(16,185,129,0.1)]" },
    amber: { bg: "bg-amber-500/5", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]" },
    rose: { bg: "bg-rose-500/5", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]" },
  };
  const vc = verdictColorMap[verdictColor];

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <motion.form
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAnalyze}
        className="flex gap-3"
      >
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-400 transition-colors" />
          <input
            type="text"
            value={address}
            onChange={e => { setAddress(e.target.value); setError(""); }}
            placeholder="Paste any wallet address…   e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            className="w-full bg-[#0d1117] border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all font-mono"
            disabled={isLoading}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isLoading || !address}
          className="relative px-6 py-3.5 rounded-2xl font-bold text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> : <><Zap className="w-4 h-4" /> Analyze</>}
          </span>
        </motion.button>
      </motion.form>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> {error}
        </motion.p>
      )}

      {/* Empty state */}
      {!isLoading && !result && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-5">
            <Search className="w-8 h-8 text-violet-500/40" />
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">No wallet analyzed yet</p>
          <p className="text-gray-700 text-xs">Paste any EVM-compatible address above to begin</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "0xdead000000000000000042069420694206942069"].map(addr => (
              <button
                key={addr}
                onClick={() => setAddress(addr)}
                className="text-[11px] font-mono text-gray-600 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1 hover:text-violet-400 hover:border-violet-500/20 transition-all"
              >
                {truncate(addr, 10, 8)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-12 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={cn("rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse", i === 0 ? "col-span-3 h-64" : i === 1 ? "col-span-5 h-64" : "col-span-4 h-64")} />
          ))}
          <div className="col-span-12 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-48" />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Wallet address header bar */}
            <div className="flex items-center justify-between bg-[#0d1117] border border-white/[0.07] rounded-2xl px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Analyzed Wallet</p>
                  <p className="text-sm font-mono text-white">{result.wallet.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <a href={`https://etherscan.io/address/${result.wallet.address}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                </a>
              </div>
            </div>

            {/* Main 3-col grid */}
            <div className="grid grid-cols-12 gap-5">
              {/* Col 1: Risk Gauge + Verdict */}
              <div className="col-span-12 md:col-span-3 flex flex-col gap-5">
                {/* Gauge card */}
                <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider self-start">Risk Score</p>
                  <RiskGauge score={score} />
                </div>

                {/* Verdict card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn("bg-[#0d1117] border rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden", vc.border, vc.glow)}
                >
                  <div className={cn("absolute inset-0 opacity-[0.03]", isCritical ? "bg-rose-500" : isSafe ? "bg-emerald-500" : "bg-amber-500")} />
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 relative z-10", isCritical ? "bg-rose-500/10 text-rose-400" : isSafe ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
                    {isCritical ? <XOctagon size={24} /> : isSafe ? <Shield size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <p className={cn("text-xl font-black tracking-tight relative z-10", vc.text)}>{result.decision.verdict}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed relative z-10">{result.decision.action}</p>
                </motion.div>

                {/* Quick stats */}
                <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-3">Quick Stats</p>
                  <StatPill label="Total TXs" value={result.summary.totalTransactions} color="violet" />
                  <StatPill label="Wallet Age" value={`${result.summary.walletAgeDays}d`} color="sky" />
                  <StatPill label="Failed TXs" value={result.summary.failedTransactionCount} color={result.summary.failedTransactionCount > 5 ? "rose" : "emerald"} />
                  <StatPill label="TX Freq/Day" value={result.summary.txFrequencyPerDay} color={result.summary.txFrequencyPerDay > 10 ? "amber" : "emerald"} />
                </div>
              </div>

              {/* Col 2-3: AI Explanation */}
              <div className="col-span-12 md:col-span-9 flex flex-col gap-5">
                {/* AI block */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-6 relative overflow-hidden flex-1"
                >
                  <div className="absolute top-0 right-0 w-56 h-56 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <Bot size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">TrustCopilot AI Analysis</p>
                      <p className="text-[11px] text-gray-600">Rule-based + GPT-4 fallback</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Complete
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        <Sparkles size={12} className="text-violet-400" /> Executive Summary
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{result.ai.summary}</p>
                    </div>

                    <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Detailed Explanation</p>
                      <p className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-wrap">{result.ai.explanation}</p>
                    </div>

                    {result.ai.keyFindings?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <Lightbulb size={12} className="text-yellow-400" /> Key Findings
                        </div>
                        <div className="space-y-2">
                          {result.ai.keyFindings.map((f, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * i }}
                              className="flex items-start gap-2.5 bg-white/[0.025] border border-white/[0.05] rounded-xl p-3"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                              <p className="text-gray-300 text-[13px] leading-relaxed">{f}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Transaction log */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <AlertCircle className="w-4 h-4 text-rose-400" /> Suspicious Activity Log
                    </div>
                    {result.suspiciousTransactions.length > 0 ? (
                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-full uppercase tracking-wide">
                        {result.suspiciousTransactions.length} flags
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-wide">
                        Clean
                      </span>
                    )}
                  </div>

                  {result.suspiciousTransactions.length === 0 ? (
                    <div className="flex items-center gap-3 py-6 justify-center text-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">No suspicious transactions</p>
                        <p className="text-xs text-gray-600">Clean transaction history detected</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {result.suspiciousTransactions.map((tx, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-xs",
                            tx.severity === "high"
                              ? "bg-rose-500/5 border-rose-500/15"
                              : "bg-amber-500/5 border-amber-500/15"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                            tx.severity === "high" ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400")}>
                            <AlertTriangle size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-bold", tx.severity === "high" ? "text-rose-400" : "text-amber-400")}>{tx.type}</p>
                            <p className="text-gray-600 font-mono truncate mt-0.5">→ {tx.to}</p>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 flex-shrink-0">
                            <Clock size={10} />
                            <span>{new Date(tx.timestamp * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Decision Copilot row */}
            <div className="grid grid-cols-12 gap-5">
              <DecisionCopilot
                decision={decision}
                isLoading={decisionLoading}
                onRequest={handleDecision}
                hasResult={!!result}
              />
            </div>
            {decisionError && (
              <p className="text-rose-400 text-sm flex items-center gap-2 -mt-2">
                <ShieldAlert className="w-4 h-4" /> {decisionError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────── Sandbox View ───────────────────────────── */
function SandboxView({ isAutoProtect }: { isAutoProtect: boolean }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [interceptData, setInterceptData] = useState<PreTransactionCheckResponse["data"] | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setTxSuccess(false);
    if (isAutoProtect) {
      setProcessing(true);
      try {
        const result = await preTransactionCheck(recipient);
        if (result.success && result.data.isBlocked) {
          setInterceptData(result.data);
          setShowModal(true);
          setProcessing(false);
          return;
        }
      } catch { }
    }
    execTx();
  };

  const execTx = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setTxSuccess(true);
      setRecipient("");
      setAmount("");
      setTimeout(() => setTxSuccess(false), 3000);
    }, 1500);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium",
          isAutoProtect
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/5 border-amber-500/20 text-amber-300"
        )}>
          <Shield className="w-4 h-4" />
          {isAutoProtect
            ? "Auto-Protect is ACTIVE — high-risk transactions will be intercepted before execution."
            : "Auto-Protect is OFF — transactions will proceed without risk checking."}
        </div>

        {/* Panel */}
        <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl overflow-hidden relative">
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Send size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Web3 Transaction Simulator</p>
              <p className="text-[11px] text-gray-600">Simulate sending tokens to any address</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#070a10] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-sky-500/40 font-mono transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.000"
                  className="w-full bg-[#070a10] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-sky-500/40 transition-all"
                  required
                />
              </div>

              {/* Quick fill risky addresses */}
              <div className="flex flex-wrap gap-2">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider w-full">Quick-fill risky addresses:</p>
                {["0xdead000000000000000042069420694206942069", "0x00000000219ab540356cbb839cbe05303d7705fa"].map(a => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setRecipient(a)}
                    className="text-[10px] font-mono text-rose-500/70 bg-rose-500/5 border border-rose-500/15 rounded-lg px-2.5 py-1 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                  >
                    {truncate(a, 8, 6)}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={processing}
                className="w-full relative py-3.5 rounded-xl font-bold text-sm overflow-hidden group disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Send className="w-4 h-4" /> Confirm Transaction</>}
                </span>
              </motion.button>
            </form>

            {/* Success overlay */}
            <AnimatePresence>
              {txSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#070a10]/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="font-black text-lg text-emerald-400">Transaction Sent!</p>
                  <p className="text-gray-600 text-sm mt-1">Simulated successfully</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info footer */}
          <div className="px-6 py-4 border-t border-white/[0.05] flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Toggle <span className="text-sky-400 font-semibold">Auto-Protect</span> in the top bar to see how risky addresses are intercepted before execution.
            </p>
          </div>
        </div>
      </div>

      <InterceptorModal
        isOpen={showModal}
        score={interceptData?.risk?.score ?? 0}
        explanation={interceptData?.ai?.summary ?? "This address has been flagged."}
        targetAddress={recipient}
        onProceed={() => { setShowModal(false); execTx(); }}
        onCancel={() => { setShowModal(false); setProcessing(false); }}
      />
    </>
  );
}

/* ─────────────────────────────── History View ───────────────────────────── */
function HistoryView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-5">
        <History className="w-8 h-8 text-gray-700" />
      </div>
      <p className="text-gray-500 text-sm font-medium mb-1">Scan history is empty</p>
      <p className="text-gray-700 text-xs">Previous wallet scans will appear here (coming soon)</p>
    </div>
  );
}

/* ─────────────────────────────── Wallet View ────────────────────────────── */
function WalletView({ wallet, isAutoProtect }: { wallet: ReturnType<typeof useWallet>; isAutoProtect: boolean }) {
  return (
    <div className="space-y-6">
      {/* Connected wallet info card — shown when connected */}
      {wallet.address && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Address card */}
          <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Connected Address</p>
            <p className="text-sm font-mono text-white break-all leading-relaxed">{wallet.address}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-semibold">Connected</span>
            </div>
          </div>

          {/* Balance card */}
          <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Wallet Balance</p>
            <p className="text-3xl font-black font-mono text-emerald-400">
              {wallet.isRefreshingBalance ? (
                <span className="text-xl text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Fetching…
                </span>
              ) : (
                <>{wallet.balance ?? "—"} <span className="text-lg text-emerald-600">ETH</span></>
              )}
            </p>
            <button
              onClick={wallet.refreshBalance}
              disabled={wallet.isRefreshingBalance}
              className="mt-auto self-start flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            >
              <RefreshCwIcon className="w-3 h-3" />
              Refresh Balance
            </button>
          </div>

          {/* Network card */}
          <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Network</p>
            <p className="text-lg font-bold text-white">{wallet.chainName ?? "Unknown"}</p>
            <div className="flex items-center gap-2 mt-1">
              {wallet.isTestnet ? (
                <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
                  ⚠ Testnet — safe for testing
                </span>
              ) : (
                <span className="text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
                  🔵 Mainnet — real funds
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet Personality Card */}
      {wallet.address && (
        <WalletPersonalityCard
          address={wallet.address}
          balance={wallet.balance}
          chainId={wallet.chainId}
          inline
        />
      )}

      {/* Send Transaction panel */}
      <SendTransaction wallet={wallet} isAutoProtect={isAutoProtect} />
    </div>
  );
}

// small inline helper to avoid import conflict with lucide RefreshCw
function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/* ─────────────────────────────── Main Page ──────────────────────────────── */
export default function AppDashboard() {
  const [activeView, setActiveView] = useState<ActiveView>("analyzer");
  const [isAutoProtect, setAutoProtect] = useState(true);
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <Sidebar active={activeView} setActive={setActiveView} />
      <TopBar
        isAutoProtect={isAutoProtect}
        setAutoProtect={setAutoProtect}
        activeView={activeView}
        wallet={wallet}
      />

      {/* Main content area */}
      <main className="pl-[220px] pt-[73px] relative z-10">
        <div className="px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeView === "analyzer" && <AnalyzerView />}
              {activeView === "wallet-dna" && <WalletDNA />}
              {activeView === "wallet" && <WalletView wallet={wallet} isAutoProtect={isAutoProtect} />}
              {activeView === "sandbox" && <SandboxView isAutoProtect={isAutoProtect} />}
              {activeView === "history" && <HistoryView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* AI Copilot Chat — floating bubble + slide-up panel */}
      <AICopilotChat />
    </div>
  );
}
