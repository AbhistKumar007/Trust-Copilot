"use client";

/**
 * WalletPersonalityCard
 * ─────────────────────
 * Generates and displays a premium NFT-style personality card for the
 * connected wallet. Supports PNG export (html2canvas) and Twitter/X sharing.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, RefreshCw, Loader2, Sparkles,
  ShieldCheck, Zap, Clock, Coins, AlertTriangle,
  CreditCard, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalityData {
  address: string;
  shortAddress: string;
  personalityTitle: string;
  grade: "S" | "A" | "B" | "C" | "D";
  stats: {
    holdStrength: number;
    tradeFrequency: number;
    riskAppetite: number;
    suspicionLevel: number;
  };
  walletAge: { ageDays: number; firstTxDate: string };
  topTokens: string[];
  aiQuote: string;
  chainId: number;
  generatedAt: string;
}

interface WalletPersonalityCardProps {
  address: string;
  balance: string | null;
  chainId: number | null;
  onClose?: () => void;
  /** If true, renders as inline section instead of modal overlay */
  inline?: boolean;
}

// ─── Grade config ─────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  S: {
    label: "S",
    name: "Legendary",
    color: "#FFD700",
    glow: "rgba(255, 215, 0, 0.5)",
    border: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
    bg: "rgba(255, 215, 0, 0.06)",
    textClass: "text-yellow-400",
  },
  A: {
    label: "A",
    name: "Elite",
    color: "#00BFFF",
    glow: "rgba(0, 191, 255, 0.5)",
    border: "linear-gradient(135deg, #00BFFF, #0080FF, #00BFFF)",
    bg: "rgba(0, 191, 255, 0.06)",
    textClass: "text-sky-400",
  },
  B: {
    label: "B",
    name: "Solid",
    color: "#00C896",
    glow: "rgba(0, 200, 150, 0.5)",
    border: "linear-gradient(135deg, #00C896, #00A87A, #00C896)",
    bg: "rgba(0, 200, 150, 0.06)",
    textClass: "text-emerald-400",
  },
  C: {
    label: "C",
    name: "Average",
    color: "#FF8C00",
    glow: "rgba(255, 140, 0, 0.5)",
    border: "linear-gradient(135deg, #FF8C00, #FF6400, #FF8C00)",
    bg: "rgba(255, 140, 0, 0.06)",
    textClass: "text-orange-400",
  },
  D: {
    label: "D",
    name: "Risky",
    color: "#DC143C",
    glow: "rgba(220, 20, 60, 0.5)",
    border: "linear-gradient(135deg, #DC143C, #A00020, #DC143C)",
    bg: "rgba(220, 20, 60, 0.06)",
    textClass: "text-rose-400",
  },
} as const;

// ─── Personality icons / emojis ───────────────────────────────────────────────

const PERSONALITY_EMOJI: Record<string, string> = {
  "Diamond Hodler":    "💎",
  "Degen Trader":      "🎰",
  "Whale Hunter":      "🐋",
  "Silent Accumulator":"🕵️",
  "Bot Suspect":       "🤖",
  "Cautious Investor": "🛡️",
};

// ─── Stat Bar ─────────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  color: string;
  delay?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="text-[11px] font-black font-mono" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── The Card itself (also the PNG capture target) ────────────────────────────

const CardDisplay = React.forwardRef<HTMLDivElement, {
  data: PersonalityData;
  gradeConfig: (typeof GRADE_CONFIG)[keyof typeof GRADE_CONFIG];
}>(({ data, gradeConfig }, ref) => {
  const { stats } = data;

  return (
    <div
      ref={ref}
      className="relative w-[320px] flex-shrink-0"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Gradient border wrapper */}
      <div
        className="rounded-3xl p-[2px]"
        style={{
          background: gradeConfig.border,
          boxShadow: `0 0 40px ${gradeConfig.glow}, 0 0 80px ${gradeConfig.glow.replace("0.5", "0.15")}`,
        }}
      >
        {/* Card inner */}
        <div
          className="relative rounded-[22px] overflow-hidden"
          style={{ background: "linear-gradient(145deg, #0d1117 0%, #0a0d14 50%, #070a10 100%)" }}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="personality-card-shimmer absolute top-0 bottom-0 w-16 opacity-[0.07]"
              style={{
                background: `linear-gradient(90deg, transparent, ${gradeConfig.color}, transparent)`,
                left: 0,
              }}
            />
          </div>

          {/* Background orbs */}
          <div
            className="personality-orb-1 absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${gradeConfig.glow.replace("0.5", "0.3")} 0%, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />
          <div
            className="personality-orb-2 absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${gradeConfig.glow.replace("0.5", "0.2")} 0%, transparent 70%)`,
              filter: "blur(16px)",
            }}
          />

          {/* Subtle background tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: gradeConfig.bg, opacity: 0.6 }}
          />

          <div className="relative z-10 p-6 flex flex-col gap-4">
            {/* ── Header row ──────────────────────────────────────── */}
            <div className="flex items-start justify-between">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))`,
                    border: "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-[11px] font-black text-white tracking-tight">
                  Trust<span className="text-violet-400">Copilot</span>
                </span>
              </div>

              {/* Grade badge */}
              <div
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl"
                style={{
                  background: `linear-gradient(145deg, ${gradeConfig.bg.replace("0.06", "0.2")}, ${gradeConfig.bg})`,
                  border: `2px solid ${gradeConfig.color}`,
                  boxShadow: `0 0 16px ${gradeConfig.glow.replace("0.5", "0.6")}`,
                }}
              >
                <span
                  className="text-2xl font-black leading-none"
                  style={{ color: gradeConfig.color, textShadow: `0 0 12px ${gradeConfig.glow}` }}
                >
                  {data.grade}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: gradeConfig.color, opacity: 0.7 }}>
                  GRADE
                </span>
              </div>
            </div>

            {/* ── Wallet address ─────────────────────────────────── */}
            <div>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">
                Wallet Identity
              </p>
              <p className="text-xs font-mono font-bold text-white/80 tracking-wide">
                {data.shortAddress}
              </p>
            </div>

            {/* ── Personality ────────────────────────────────────── */}
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: `linear-gradient(135deg, ${gradeConfig.bg.replace("0.06", "0.12")}, rgba(255,255,255,0.02))`,
                border: `1px solid ${gradeConfig.color}22`,
              }}
            >
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">
                Personality
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">
                  {PERSONALITY_EMOJI[data.personalityTitle] ?? "🔮"}
                </span>
                <div>
                  <p
                    className="text-sm font-black tracking-tight leading-none"
                    style={{ color: gradeConfig.color }}
                  >
                    {data.personalityTitle}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    {gradeConfig.name} Tier
                  </p>
                </div>
              </div>
            </div>

            {/* ── AI Quote ──────────────────────────────────────── */}
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: gradeConfig.color }} />
              <p className="text-[11px] text-gray-400 italic leading-relaxed font-medium">
                &ldquo;{data.aiQuote}&rdquo;
              </p>
            </div>

            {/* ── Stats ─────────────────────────────────────────── */}
            <div className="space-y-2">
              <StatBar label="Hold Strength"   value={stats.holdStrength}   color={gradeConfig.color} delay={0.1} />
              <StatBar label="Trade Frequency" value={stats.tradeFrequency} color="#818cf8"            delay={0.2} />
              <StatBar label="Risk Appetite"   value={stats.riskAppetite}   color="#f97316"            delay={0.3} />
              <StatBar label="Suspicion Level" value={stats.suspicionLevel} color="#f43f5e"            delay={0.4} />
            </div>

            {/* ── Footer info ────────────────────────────────────── */}
            <div
              className="rounded-xl px-3 py-2.5 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Wallet age */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-gray-600" />
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">Age</p>
                  <p className="text-[11px] font-bold text-white">
                    {data.walletAge.ageDays > 0 ? `${data.walletAge.ageDays}d` : "New"}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-white/[0.06]" />

              {/* Top tokens */}
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-gray-600" />
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">Top Tokens</p>
                  <p className="text-[11px] font-bold text-white">
                    {data.topTokens.slice(0, 3).join(" · ")}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Bottom watermark ──────────────────────────────── */}
            <div className="flex items-center justify-center gap-1.5 opacity-40">
              <div className="w-px flex-1 h-px bg-white/10" />
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                trustcopilot.ai
              </span>
              <div className="w-px flex-1 h-px bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
CardDisplay.displayName = "CardDisplay";

// ─── Main Component ───────────────────────────────────────────────────────────

export function WalletPersonalityCard({
  address,
  balance,
  chainId,
  onClose,
  inline = false,
}: WalletPersonalityCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<PersonalityData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    if (!address) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/wallet-personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          balance: balance ?? "0",
          chainId: chainId ?? 1,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate personality card");
      }
      setData(json.data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [address, balance, chainId]);

  // Auto-generate on mount
  useEffect(() => {
    generate();
  }, [generate]);

  const handleDownloadPNG = async () => {
    if (!cardRef.current || !data) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(cardRef.current, {
        background: "#0a0d14",
        scale: 2,
        useCORS: true,
        logging: false,
      } as any);
      const link = document.createElement("a");
      link.download = `trustcopilot-${data.grade}-${data.personalityTitle.replace(/\s/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback — do nothing
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareTwitter = () => {
    if (!data) return;
    const tweet = `My wallet is a ${data.personalityTitle} with Trust Grade ${data.grade} 🔰\n\nAnalyzed by TrustCopilot ✨\n#CryptoSecurity #TrustCopilot #Web3`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const gradeConfig = data ? GRADE_CONFIG[data.grade] : null;

  // ── Loading skeleton ─────────────────────────────────────────────────────

  const LoadingSkeleton = () => (
    <div className="w-[320px]">
      <div
        className="rounded-3xl p-[2px]"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.2), rgba(139,92,246,0.4))" }}
      >
        <div
          className="rounded-[22px] p-6 space-y-4"
          style={{ background: "linear-gradient(145deg, #0d1117, #070a10)" }}
        >
          <div className="flex justify-between items-start">
            <div className="h-6 w-28 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-4 w-36 rounded-lg bg-white/[0.04] animate-pulse" />
          <div className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />
          <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-1.5 rounded-full bg-white/[0.04] animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Analyzing your wallet…</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Content layout ───────────────────────────────────────────────────────

  const content = (
    <div className={`flex flex-col items-center gap-6 ${inline ? "" : "py-2"}`}>
      {/* Header text */}
      {inline && (
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Wallet Identity Card</p>
              <p className="text-[11px] text-gray-600">Your on-chain personality</p>
            </div>
          </div>
          {status === "ready" && (
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>
      )}

      {/* Card area */}
      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <LoadingSkeleton />
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-[320px] bg-[#0d1117] border border-rose-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">Generation Failed</p>
              <p className="text-xs text-gray-500 leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </motion.div>
        )}

        {status === "ready" && data && gradeConfig && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="personality-card-float"
          >
            <CardDisplay ref={cardRef} data={data} gradeConfig={gradeConfig} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {status === "ready" && data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-90 group-hover:opacity-100 transition-opacity rounded-xl" />
            <span className="relative z-10 flex items-center gap-2">
              {isExporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
              ) : (
                <><Download className="w-4 h-4" /> Save PNG</>
              )}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShareTwitter}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm relative overflow-hidden group"
          >
            <div
              className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity rounded-xl"
              style={{ background: "linear-gradient(135deg, #1DA1F2, #0d8ee0)" }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {/* X (Twitter) logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );

  // ── Inline mode ──────────────────────────────────────────────────────────

  if (inline) {
    return (
      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-6">
        {content}
      </div>
    );
  }

  // ── Modal overlay mode ───────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-[#0d1117] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Trigger Button (small "View Card" shortcut) ──────────────────────────────

export function PersonalityCardTrigger({
  address,
  balance,
  chainId,
}: {
  address: string;
  balance: string | null;
  chainId: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        id="personality-card-trigger-btn"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold relative overflow-hidden group"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-500/20 border border-violet-500/30 group-hover:from-violet-600/30 group-hover:to-indigo-500/30 transition-all" />
        <span className="relative z-10 flex items-center gap-1.5 text-violet-300">
          <Zap className="w-3.5 h-3.5" />
          My Card
        </span>
      </motion.button>

      {open && (
        <WalletPersonalityCard
          address={address}
          balance={balance}
          chainId={chainId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
