"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  Brain,
  Sparkles,
  ChevronDown,
  Lightbulb,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { AIDecisionResponse } from "@/lib/api";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ─── types ────────────────────────────────────────────────────────────────── */
type DecisionData = AIDecisionResponse["data"];
type RiskLevel = "Safe" | "Risky" | "Avoid";

/* ─── Config per risk level ─────────────────────────────────────────────────── */
const RISK_CONFIG: Record<
  RiskLevel,
  {
    icon: React.ElementType;
    emoji: string;
    label: string;
    gradient: string;
    border: string;
    glow: string;
    badge: string;
    badgeBg: string;
    textClass: string;
    bgTint: string;
  }
> = {
  Safe: {
    icon: CheckCircle2,
    emoji: "✅",
    label: "SAFE",
    gradient: "from-emerald-500 to-teal-500",
    border: "border-emerald-500/25",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.12)]",
    badge: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-400",
    bgTint: "bg-emerald-500/5",
  },
  Risky: {
    icon: AlertTriangle,
    emoji: "⚠️",
    label: "RISKY",
    gradient: "from-amber-500 to-orange-500",
    border: "border-amber-500/25",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.12)]",
    badge: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-400",
    bgTint: "bg-amber-500/5",
  },
  Avoid: {
    icon: XOctagon,
    emoji: "❌",
    label: "AVOID",
    gradient: "from-rose-600 to-red-600",
    border: "border-rose-500/25",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.12)]",
    badge: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/20",
    textClass: "text-rose-400",
    bgTint: "bg-rose-500/5",
  },
};

/* ─── Confidence bar ────────────────────────────────────────────────────────── */
function ConfidenceBar({
  score,
  textClass,
  gradient,
}: {
  score: number;
  textClass: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
        AI Confidence
      </span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
      </div>
      <span className={cn("text-xs font-black tabular-nums", textClass)}>
        {score}%
      </span>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
interface DecisionCopilotProps {
  decision: DecisionData | null;
  isLoading: boolean;
  onRequest: () => void;
  hasResult: boolean;
}

export function DecisionCopilot({
  decision,
  isLoading,
  onRequest,
  hasResult,
}: DecisionCopilotProps) {
  const [showWhy, setShowWhy] = useState(false);

  if (!hasResult) return null;

  const cfg = decision
    ? RISK_CONFIG[decision.riskLevel] ?? RISK_CONFIG["Risky"]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="col-span-12"
    >
      {/* ── Trigger Button (shown when no decision yet) ── */}
      {!decision && !isLoading && (
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.975 }}
          onClick={onRequest}
          className="w-full relative group overflow-hidden rounded-2xl border border-violet-500/20 bg-[#0d1117] px-6 py-5 flex items-center gap-4 hover:border-violet-500/40 transition-all duration-300"
          id="decision-copilot-btn"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-fuchsia-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Pulsing orb */}
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-violet-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-fuchsia-500 border-2 border-[#0d1117] animate-pulse" />
          </div>

          <div className="flex-1 text-left relative z-10">
            <p className="font-black text-white text-base">What Should I Do?</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Get an AI-powered decision recommendation based on this wallet's risk profile
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-shadow">
            <Sparkles className="w-4 h-4" />
            Analyze
          </div>
        </motion.button>
      )}

      {/* ── Loading state ── */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full rounded-2xl border border-violet-500/20 bg-[#0d1117] px-6 py-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold text-white text-sm">Decision Copilot thinking…</p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-violet-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {["Analyzing wallet behavior patterns…", "Generating personalized recommendation…"].map(
                (t, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="text-xs text-gray-600 flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3 text-violet-500/60" />
                    {t}
                  </motion.p>
                )
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Result Card ── */}
      <AnimatePresence>
        {decision && !isLoading && cfg && (
          <motion.div
            key="decision-card"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "rounded-2xl border bg-[#0d1117] overflow-hidden relative",
              cfg.border,
              cfg.glow
            )}
          >
            {/* Top gradient stripe */}
            <div
              className={`h-1 bg-gradient-to-r ${cfg.gradient} w-full`}
              aria-hidden
            />

            <div className="p-6 space-y-5">
              {/* Header row */}
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border",
                    cfg.bgTint,
                    cfg.border
                  )}
                >
                  <cfg.icon className={cn("w-7 h-7", cfg.textClass)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xl font-black text-white">Decision Copilot</span>
                    {/* Risk badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full border",
                        cfg.badge,
                        cfg.badgeBg
                      )}
                    >
                      <span>{cfg.emoji}</span>
                      {cfg.label}
                    </span>
                    {/* Source badge */}
                    <span className="text-[9px] font-bold text-gray-600 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {decision.source === "openai" ? `AI · ${decision.model}` : "Rule-based"}
                    </span>
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-3">
                    <ConfidenceBar
                      score={decision.confidenceScore}
                      textClass={cfg.textClass}
                      gradient={cfg.gradient}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div
                className={cn(
                  "rounded-xl border p-4 relative overflow-hidden",
                  cfg.bgTint,
                  cfg.border
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(circle, var(--tw-gradient-stops))` }}
                />
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", cfg.textClass)}>
                  <ShieldCheck className="inline w-3 h-3 mr-1" />
                  AI Recommendation
                </p>
                <p className="text-gray-100 text-sm leading-relaxed font-medium">
                  {decision.recommendation}
                </p>
              </div>

              {/* Alternative suggestion */}
              {decision.alternative && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                    <Lightbulb className="inline w-3 h-3 mr-1" />
                    Safer Alternative
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {decision.alternative}
                  </p>
                </motion.div>
              )}

              {/* Explain Why accordion */}
              <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowWhy((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all"
                  id="explain-why-toggle"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    Explain Why
                  </span>
                  <motion.div
                    animate={{ rotate: showWhy ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {showWhy && (
                    <motion.div
                      key="why-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1">
                        <div className="h-px bg-white/[0.06] mb-3" />
                        <p className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-wrap">
                          {decision.whyExplanation}
                        </p>
                        {decision.tokensUsed > 0 && (
                          <p className="text-[10px] text-gray-700 mt-3">
                            AI tokens used: {decision.tokensUsed}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Re-run button */}
              <button
                onClick={onRequest}
                className="text-[11px] text-gray-600 hover:text-violet-400 flex items-center gap-1.5 transition-colors"
                id="re-run-decision-btn"
              >
                <Sparkles className="w-3 h-3" />
                Re-run Decision Copilot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
