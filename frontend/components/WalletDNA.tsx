"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna, Search, Loader2, Zap, AlertTriangle, ShieldAlert,
  TrendingUp, Clock, Globe, BarChart3, Activity, Bot,
  Wallet, ArrowRight, RefreshCw, GitCompareArrows, X,
  ChevronRight, Cpu, Flame, Layers,
} from "lucide-react";
import {
  getWalletDNA, compareWalletDNA,
  type WalletDNAProfile,
} from "@/lib/api";

/* ─────────────────────────────── helpers ─────────────────────────────────── */
function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
const truncate = (s: string, start = 8, end = 6) =>
  s ? `${s.slice(0, start)}...${s.slice(-end)}` : "";

/* ─────────────────────────────── type map ────────────────────────────────── */
const TYPE_META: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; glow: string; accent: string }> = {
  "Trader": {
    color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/25",
    icon: TrendingUp, glow: "rgba(14,165,233,0.4)", accent: "#38bdf8",
  },
  "Long-term Holder": {
    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25",
    icon: Clock, glow: "rgba(16,185,129,0.4)", accent: "#34d399",
  },
  "Bot-like Behavior": {
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25",
    icon: Bot, glow: "rgba(245,158,11,0.4)", accent: "#fbbf24",
  },
  "High-risk / Scam-like": {
    color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/25",
    icon: Flame, glow: "rgba(239,68,68,0.4)", accent: "#f87171",
  },
};

const RISK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Low:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  Medium:   { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25"   },
  High:     { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/25"  },
  Critical: { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/25"    },
};

const RADAR_LABELS: Record<string, string> = {
  txFrequency: "TX Freq",
  holdingDuration: "Holding",
  interactionDiversity: "Diversity",
  volatility: "Volatility",
  riskExposure: "Risk Exp.",
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   RADAR CHART (pure canvas, no extra deps)                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
function RadarChart({
  data,
  color = "#8b5cf6",
  compareData,
  compareColor = "#38bdf8",
  size = 260,
}: {
  data: Record<string, number>;
  color?: string;
  compareData?: Record<string, number>;
  compareColor?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = Object.keys(data);
  const N = keys.length;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = (Math.min(W, H) / 2) - 36;
    const levels = 5;

    ctx.clearRect(0, 0, W, H);

    // ── Background rings ──────────────────────────────────────────────────
    for (let l = 1; l <= levels; l++) {
      const r = (R * l) / levels;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (l === levels) {
        ctx.fillStyle = "rgba(255,255,255,0.015)";
        ctx.fill();
      }
    }

    // ── Axis lines ────────────────────────────────────────────────────────
    for (let i = 0; i < N; i++) {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Helper: draw a data polygon ───────────────────────────────────────
    const drawPolygon = (vals: Record<string, number>, fill: string, stroke: string, glow: string) => {
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      keys.forEach((k, i) => {
        const v = Math.min(100, Math.max(0, vals[k] ?? 0)) / 100;
        const angle = (2 * Math.PI * i) / N - Math.PI / 2;
        const x = cx + R * v * Math.cos(angle);
        const y = cy + R * v * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // ── Dot markers ──
      keys.forEach((k, i) => {
        const v = Math.min(100, Math.max(0, vals[k] ?? 0)) / 100;
        const angle = (2 * Math.PI * i) / N - Math.PI / 2;
        const x = cx + R * v * Math.cos(angle);
        const y = cy + R * v * Math.sin(angle);
        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = stroke;
        ctx.fill();
        ctx.restore();
      });
    };

    // Compare polygon (behind)
    if (compareData) {
      drawPolygon(compareData, `${compareColor}22`, compareColor, compareColor);
    }

    // Primary polygon
    drawPolygon(data, `${color}33`, color, color);

    // ── Labels ────────────────────────────────────────────────────────────
    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    keys.forEach((k, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      const labelR = R + 22;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillStyle = "rgba(156,163,175,0.9)";
      ctx.fillText(RADAR_LABELS[k] ?? k, x, y);
    });
  }, [data, compareData, color, compareColor, keys, N]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   DNA HELIX (CSS animation, decorative)                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function DNAHelix({ color = "#8b5cf6" }: { color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {Array.from({ length: 10 }).map((_, i) => {
        const phase = (i / 10) * Math.PI * 2;
        const leftX  = 50 + Math.sin(phase) * 28;
        const rightX = 50 - Math.sin(phase) * 28;
        return (
          <div key={i} className="relative w-16 h-3 flex items-center">
            {/* Left bead */}
            <motion.div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${leftX}%`,
                transform: "translateX(-50%)",
                background: color,
                boxShadow: `0 0 6px ${color}`,
                opacity: 0.7 + 0.3 * Math.abs(Math.sin(phase)),
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            />
            {/* Connecting bar */}
            <div
              className="absolute h-px rounded"
              style={{
                left: `${Math.min(leftX, rightX)}%`,
                width: `${Math.abs(leftX - rightX)}%`,
                background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)`,
              }}
            />
            {/* Right bead */}
            <motion.div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${rightX}%`,
                transform: "translateX(-50%)",
                background: "#38bdf8",
                boxShadow: "0 0 6px #38bdf8",
                opacity: 0.7 + 0.3 * Math.abs(Math.cos(phase)),
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 + 0.5 }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   ACTIVITY TIMELINE BAR CHART                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function TimelineChart({
  timeline,
  color = "#8b5cf6",
  compareTimeline,
  compareColor = "#38bdf8",
}: {
  timeline: WalletDNAProfile["timeline"];
  color?: string;
  compareTimeline?: WalletDNAProfile["timeline"];
  compareColor?: string;
}) {
  const allCounts = [
    ...timeline.map((t) => t.txCount),
    ...(compareTimeline?.map((t) => t.txCount) ?? []),
  ];
  const max = Math.max(...allCounts, 1);

  return (
    <div className="flex items-end gap-2 h-24 w-full">
      {timeline.map((t, i) => {
        const primary = (t.txCount / max) * 100;
        const compare = compareTimeline ? ((compareTimeline[i]?.txCount ?? 0) / max) * 100 : null;
        return (
          <div key={t.month} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-[#0d1117] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl">
                {t.txCount} tx
                {compare !== null && ` / ${compareTimeline![i]?.txCount ?? 0}`}
              </div>
              <div className="w-2 h-2 bg-[#0d1117] border-b border-r border-white/10 rotate-45 -mt-1" />
            </div>
            {/* Bars */}
            <div className="flex items-end gap-0.5 h-16 w-full">
              {/* Primary bar */}
              <motion.div
                className="flex-1 rounded-t-sm"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                style={{
                  height: `${Math.max(primary, 4)}%`,
                  background: `linear-gradient(to top, ${color}88, ${color})`,
                  transformOrigin: "bottom",
                  boxShadow: `0 0 8px ${color}55`,
                }}
              />
              {/* Compare bar */}
              {compare !== null && (
                <motion.div
                  className="flex-1 rounded-t-sm"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
                  style={{
                    height: `${Math.max(compare, 4)}%`,
                    background: `linear-gradient(to top, ${compareColor}88, ${compareColor})`,
                    transformOrigin: "bottom",
                    boxShadow: `0 0 8px ${compareColor}55`,
                  }}
                />
              )}
            </div>
            <span className="text-[9px] text-gray-600 font-medium">{t.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   PROFILE CARD                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ProfileCard({ profile, label }: { profile: WalletDNAProfile; label?: string }) {
  const meta = TYPE_META[profile.type] ?? TYPE_META["Trader"];
  const TypeIcon = meta.icon;
  const risk = RISK_COLORS[profile.risk_level] ?? RISK_COLORS.Low;

  return (
    <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 space-y-4 relative overflow-hidden">
      {label && (
        <div className="absolute top-3 right-3 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-500">
          {label}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0", meta.bg, meta.border)}>
          <TypeIcon className={cn("w-5 h-5", meta.color)} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-base font-black leading-tight", meta.color)}>{profile.type}</p>
          <p className="text-[11px] text-gray-600 font-mono truncate mt-0.5">{truncate(profile.address, 10, 8)}</p>
        </div>
      </div>

      {/* Risk + Score pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-xs font-black px-2.5 py-1 rounded-full border", risk.text, risk.bg, risk.border)}>
          {profile.risk_level} Risk
        </span>
        <span className="text-xs font-black px-2.5 py-1 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-400">
          Activity {profile.activity_score}/100
        </span>
        <span className="text-[10px] font-medium text-gray-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full capitalize">
          {profile.dataSource}
        </span>
      </div>

      {/* Behavior tags */}
      <div className="flex flex-wrap gap-1.5">
        {profile.behavior_tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "TX/Day",      value: `${profile.metrics.tx_frequency_per_day}` },
          { label: "Age",         value: `${profile.metrics.holding_duration_days}d` },
          { label: "Contracts",   value: profile.metrics.unique_contracts },
          { label: "Fail Rate",   value: `${profile.metrics.failed_tx_rate}%` },
          { label: "Dump Score",  value: profile.metrics.token_dump_score },
          { label: "Flagged",     value: profile.metrics.flagged_contract_count },
        ].map(({ label: l, value }) => (
          <div key={l} className="bg-white/[0.025] border border-white/[0.05] rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">{l}</p>
            <p className="text-sm font-black text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   DELTA ROW (compare mode)                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
function DeltaRow({ label, delta }: { label: string; delta: number }) {
  const abs = Math.abs(delta);
  const pct = `${Math.round(abs)}%`;
  const up  = delta > 0;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={cn("text-xs font-black", abs === 0 ? "text-gray-600" : up ? "text-sky-400" : "text-rose-400")}>
        {abs === 0 ? "Equal" : `${up ? "A +": "B +"}${pct}`}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*   MAIN WALLET DNA COMPONENT                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
export function WalletDNA() {
  const [mode, setMode] = useState<"single" | "compare">("single");

  // Single mode
  const [address, setAddress]       = useState("");
  const [isLoading, setLoading]     = useState(false);
  const [profile, setProfile]       = useState<WalletDNAProfile | null>(null);
  const [error, setError]           = useState("");

  // Compare mode
  const [addrA, setAddrA]           = useState("");
  const [addrB, setAddrB]           = useState("");
  const [isCmpLoading, setCmpLoad]  = useState(false);
  const [cmpResult, setCmpResult]   = useState<{ a: WalletDNAProfile; b: WalletDNAProfile; delta: Record<string, number> } | null>(null);
  const [cmpError, setCmpError]     = useState("");

  /* ── Single analysis ───────────────────────────────────────────────────── */
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[a-zA-Z0-9]{20,90}$/.test(address.trim())) {
      setError("Invalid wallet address format.");
      return;
    }
    try {
      setLoading(true);
      setProfile(null);
      const res = await getWalletDNA(address.trim());
      if (res.success) setProfile(res.data);
    } catch {
      setError("Failed to generate Wallet DNA. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Compare ───────────────────────────────────────────────────────────── */
  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmpError("");
    if (!/^[a-zA-Z0-9]{20,90}$/.test(addrA.trim()) || !/^[a-zA-Z0-9]{20,90}$/.test(addrB.trim())) {
      setCmpError("Both wallet addresses must be valid.");
      return;
    }
    if (addrA.trim().toLowerCase() === addrB.trim().toLowerCase()) {
      setCmpError("Please enter two different wallet addresses.");
      return;
    }
    try {
      setCmpLoad(true);
      setCmpResult(null);
      const res = await compareWalletDNA(addrA.trim(), addrB.trim());
      if (res.success) setCmpResult(res.data);
    } catch {
      setCmpError("Comparison failed. Check backend connection.");
    } finally {
      setCmpLoad(false);
    }
  };

  const metaA = cmpResult ? (TYPE_META[cmpResult.a.type] ?? TYPE_META["Trader"]) : null;
  const metaB = cmpResult ? (TYPE_META[cmpResult.b.type] ?? TYPE_META["Trader"]) : null;
  const activeMeta = profile ? (TYPE_META[profile.type] ?? TYPE_META["Trader"]) : null;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Mode tabs ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          id="dna-single-tab"
          onClick={() => setMode("single")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border",
            mode === "single"
              ? "bg-violet-500/10 border-violet-500/25 text-violet-300"
              : "border-white/[0.07] text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
          )}
        >
          <Dna className="w-4 h-4" /> DNA Analysis
        </button>
        <button
          id="dna-compare-tab"
          onClick={() => setMode("compare")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border",
            mode === "compare"
              ? "bg-sky-500/10 border-sky-500/25 text-sky-300"
              : "border-white/[0.07] text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
          )}
        >
          <GitCompareArrows className="w-4 h-4" /> Compare Wallets
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  SINGLE MODE                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "single" && (
          <motion.div key="single" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Search bar */}
            <form onSubmit={handleAnalyze} className="flex gap-3">
              <div className="flex-1 relative group">
                <Dna className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-400 transition-colors" />
                <input
                  id="dna-address-input"
                  type="text"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setError(""); }}
                  placeholder="Paste a wallet address to decode its behavioral DNA…"
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all font-mono"
                  disabled={isLoading}
                />
              </div>
              <motion.button
                id="dna-decode-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isLoading || !address}
                className="relative px-6 py-3.5 rounded-2xl font-bold text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2 text-white">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Decoding…</> : <><Zap className="w-4 h-4" /> Decode DNA</>}
                </span>
              </motion.button>
            </form>

            {/* Quick-fill addresses */}
            {!profile && !isLoading && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Try:</span>
                {["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "0xdead000000000000000042069420694206942069"].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAddress(a)}
                    className="text-[11px] font-mono text-gray-600 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1 hover:text-violet-400 hover:border-violet-500/20 transition-all"
                  >
                    {truncate(a, 10, 8)}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {error}
              </motion.p>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-72" />
                <div className="col-span-12 lg:col-span-7 space-y-4">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-40" />
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-28" />
                </div>
              </div>
            )}

            {/* ── Result ─────────────────────────────────────────────────── */}
            <AnimatePresence>
              {profile && !isLoading && activeMeta && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Top classification banner */}
                  <div className={cn("rounded-2xl border p-5 flex items-center justify-between relative overflow-hidden", activeMeta.bg, activeMeta.border)}
                    style={{ boxShadow: `0 0 30px -8px ${activeMeta.glow}` }}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", activeMeta.bg, activeMeta.border)}>
                        <activeMeta.icon className={cn("w-6 h-6", activeMeta.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Wallet Classification</p>
                        <p className={cn("text-xl font-black", activeMeta.color)}>{profile.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DNAHelix color={activeMeta.accent} />
                    </div>
                  </div>

                  {/* Main 2-col layout */}
                  <div className="grid grid-cols-12 gap-5">

                    {/* Left: Radar + metrics */}
                    <div className="col-span-12 lg:col-span-5 space-y-5">
                      {/* Radar card */}
                      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-4">Behavioral Radar</p>
                        <div className="flex justify-center">
                          <RadarChart data={profile.radar} color={activeMeta.accent} size={260} />
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-2 mt-3 justify-center">
                          {Object.entries(RADAR_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: activeMeta.accent }} />
                              <span className="text-[10px] text-gray-500">{label}: <span className="text-white font-bold">{profile.radar[key as keyof typeof profile.radar]}</span></span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Profile card */}
                      <ProfileCard profile={profile} />
                    </div>

                    {/* Right: Timeline + tags detail */}
                    <div className="col-span-12 lg:col-span-7 space-y-5">

                      {/* Activity evolution */}
                      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="w-4 h-4 text-violet-400" />
                          <p className="text-sm font-bold text-white">Activity Evolution</p>
                          <span className="ml-auto text-[10px] text-gray-600">Last 6 months</span>
                        </div>
                        <TimelineChart timeline={profile.timeline} color={activeMeta.accent} />
                      </div>

                      {/* Behavior tags expanded */}
                      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Layers className="w-4 h-4 text-fuchsia-400" />
                          <p className="text-sm font-bold text-white">Behavior Tags</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.behavior_tags.map((tag) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 cursor-default"
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeMeta.accent }} />
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {/* JSON profile card */}
                      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Cpu className="w-4 h-4 text-sky-400" />
                          <p className="text-sm font-bold text-white">Structured Profile</p>
                        </div>
                        <pre className="text-[11px] font-mono text-gray-400 leading-relaxed overflow-x-auto bg-black/20 rounded-xl p-4 border border-white/[0.05]">
{`{
  "type":           "${profile.type}",
  "risk_level":     "${profile.risk_level}",
  "activity_score": ${profile.activity_score},
  "behavior_tags":  ${JSON.stringify(profile.behavior_tags)}
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  COMPARE MODE                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Two address inputs */}
            <form onSubmit={handleCompare} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wallet A */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Wallet A</label>
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      id="dna-compare-a"
                      type="text"
                      value={addrA}
                      onChange={(e) => { setAddrA(e.target.value); setCmpError(""); }}
                      placeholder="0x… first wallet"
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-all font-mono"
                      disabled={isCmpLoading}
                    />
                  </div>
                </div>
                {/* Wallet B */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Wallet B</label>
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-sky-400 transition-colors" />
                    <input
                      id="dna-compare-b"
                      type="text"
                      value={addrB}
                      onChange={(e) => { setAddrB(e.target.value); setCmpError(""); }}
                      placeholder="0x… second wallet"
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500/50 transition-all font-mono"
                      disabled={isCmpLoading}
                    />
                  </div>
                </div>
              </div>

              <motion.button
                id="dna-compare-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isCmpLoading || !addrA || !addrB}
                className="relative w-full py-3.5 rounded-2xl font-bold text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  {isCmpLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparing DNA…</> : <><GitCompareArrows className="w-4 h-4" /> Compare Wallet DNA</>}
                </span>
              </motion.button>
            </form>

            {/* Quick-fill pairs */}
            {!cmpResult && !isCmpLoading && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Quick pair:</span>
                <button
                  onClick={() => { setAddrA("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"); setAddrB("0xdead000000000000000042069420694206942069"); }}
                  className="text-[11px] font-mono text-gray-600 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1 hover:text-violet-400 hover:border-violet-500/20 transition-all flex items-center gap-1.5"
                >
                  Vitalik <ArrowRight className="w-3 h-3" /> Flagged
                </button>
              </div>
            )}

            {cmpError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {cmpError}
              </motion.p>
            )}

            {/* Loading */}
            {isCmpLoading && (
              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-64" />
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse h-64" />
              </div>
            )}

            {/* ── Compare result ─────────────────────────────────────────── */}
            <AnimatePresence>
              {cmpResult && !isCmpLoading && metaA && metaB && (
                <motion.div
                  key="cmp-result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Side-by-side profiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileCard profile={cmpResult.a} label="Wallet A" />
                    <ProfileCard profile={cmpResult.b} label="Wallet B" />
                  </div>

                  {/* Overlaid radar */}
                  <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-4 h-4 text-fuchsia-400" />
                      <p className="text-sm font-bold text-white">Radar Overlay</p>
                      <div className="ml-auto flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: metaA.accent }} />Wallet A</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: metaB.accent }} />Wallet B</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <RadarChart
                        data={cmpResult.a.radar}
                        color={metaA.accent}
                        compareData={cmpResult.b.radar}
                        compareColor={metaB.accent}
                        size={300}
                      />
                    </div>
                  </div>

                  {/* Activity timeline overlay */}
                  <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-bold text-white">Activity Comparison</p>
                      <span className="ml-auto text-[10px] text-gray-600">Last 6 months</span>
                    </div>
                    <TimelineChart
                      timeline={cmpResult.a.timeline}
                      color={metaA.accent}
                      compareTimeline={cmpResult.b.timeline}
                      compareColor={metaB.accent}
                    />
                    <div className="flex items-center gap-4 mt-3 text-[11px]">
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: metaA.accent }} />Wallet A</span>
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: metaB.accent }} />Wallet B</span>
                    </div>
                  </div>

                  {/* Delta table */}
                  <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <GitCompareArrows className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-bold text-white">Metric Delta</p>
                    </div>
                    <div className="space-y-0.5">
                      {Object.entries(cmpResult.delta).map(([key, delta]) => (
                        <DeltaRow key={key} label={RADAR_LABELS[key] ?? key} delta={delta} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
