"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Brain,
  Eye,
  Lock,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  Globe,
  Code2,
  Cpu,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Tiny utility – only what we need
───────────────────────────────────────────────────────────────────────────── */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─────────────────────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────────────────────── */
const STATS = [
  { label: "Wallets Analyzed", value: "2.4M+", icon: Eye },
  { label: "Threats Blocked", value: "189K+", icon: ShieldCheck },
  { label: "AI Accuracy", value: "99.1%", icon: Brain },
  { label: "Avg Response", value: "<200ms", icon: Zap },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Risk Intelligence",
    description:
      "Our LLM-powered engine analyzes behavioral graphs, token flows, and historical patterns to detect even the most sophisticated scam wallets.",
    gradient: "from-violet-600/20 to-purple-600/5",
    border: "border-violet-500/20",
    glow: "rgba(139,92,246,0.15)",
    accent: "text-violet-400",
  },
  {
    icon: ShieldCheck,
    title: "Auto-Protect Mode",
    description:
      "Enable real-time transaction interception. TrustCopilot silently monitors every outbound transaction and raises an alert before it executes.",
    gradient: "from-emerald-600/20 to-teal-600/5",
    border: "border-emerald-500/20",
    glow: "rgba(16,185,129,0.15)",
    accent: "text-emerald-400",
  },
  {
    icon: Activity,
    title: "On-Chain Reputation",
    description:
      "Trust scores are stored immutably on Polygon via a Solidity smart contract — providing a decentralized, tamper-proof safety layer.",
    gradient: "from-sky-600/20 to-blue-600/5",
    border: "border-sky-500/20",
    glow: "rgba(14,165,233,0.15)",
    accent: "text-sky-400",
  },
  {
    icon: TrendingUp,
    title: "Decision Copilot",
    description:
      "Beyond numbers — TrustCopilot gives plain-English verdicts: Safe, Risky, or Avoid, with actionable intelligence behind every call.",
    gradient: "from-amber-600/20 to-orange-600/5",
    border: "border-amber-500/20",
    glow: "rgba(245,158,11,0.15)",
    accent: "text-amber-400",
  },
  {
    icon: Lock,
    title: "Zero-Trust Security",
    description:
      "TrustCopilot never stores private keys or seeds. Analysis is read-only and fully non-custodial — your assets stay yours.",
    gradient: "from-rose-600/20 to-pink-600/5",
    border: "border-rose-500/20",
    glow: "rgba(239,68,68,0.15)",
    accent: "text-rose-400",
  },
  {
    icon: Globe,
    title: "Multi-Chain Coverage",
    description:
      "Supports EVM-compatible chains including Ethereum, Polygon, BNB Chain and Base — with Solana support coming soon.",
    gradient: "from-indigo-600/20 to-blue-600/5",
    border: "border-indigo-500/20",
    glow: "rgba(99,102,241,0.15)",
    accent: "text-indigo-400",
  },
];

const VERDICTS = [
  {
    wallet: "0xd8dA6B...5c3a9f",
    score: 12,
    verdict: "SAFE",
    tag: "Low Activity",
    color: "emerald",
  },
  {
    wallet: "0x3f5CE5...871E2",
    score: 78,
    verdict: "RISKY",
    tag: "Rug Pattern",
    color: "amber",
  },
  {
    wallet: "0x742d35...99c0A",
    score: 95,
    verdict: "AVOID",
    tag: "Known Scammer",
    color: "rose",
  },
];

const TECH_STACK = [
  { name: "Next.js 16", icon: Code2 },
  { name: "OpenAI", icon: Brain },
  { name: "Polygon", icon: Activity },
  { name: "Etherscan", icon: Eye },
  { name: "Hardhat", icon: Cpu },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

/** Animated gradient orb */
function Orb({
  className,
  color,
  size = 600,
}: {
  className?: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
  );
}

/** A single stat card */
function StatCard({
  stat,
  index,
}: {
  stat: (typeof STATS)[0];
  index: number;
}) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="glass-card p-6 flex flex-col items-center text-center group cursor-default"
    >
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-violet-400" />
      </div>
      <p className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
        {stat.value}
      </p>
      <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">
        {stat.label}
      </p>
    </motion.div>
  );
}

/** Feature card */
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border p-6 overflow-hidden group cursor-default transition-all duration-500",
        `bg-gradient-to-br ${feature.gradient}`,
        feature.border
      )}
      style={{
        boxShadow: `0 4px 20px -4px ${feature.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
      whileHover={{
        y: -6,
        boxShadow: `0 12px 40px -8px ${feature.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Corner shine */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/[0.04] transition-colors duration-500" />

      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-black/30 border border-white/5")}>
        <Icon className={cn("w-5 h-5", feature.accent)} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

/** Live verdict ticker card */
function VerdictCard({
  verdict,
  index,
}: {
  verdict: (typeof VERDICTS)[0];
  index: number;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/20",
      icon: <XCircle className="w-4 h-4 text-rose-400" />,
    },
  };
  const c = colorMap[verdict.color];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="flex items-center gap-4 glass-card p-4 group hover:border-white/10 transition-all duration-300"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
          c.bg,
          c.border
        )}
      >
        {c.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-mono truncate">{verdict.wallet}</p>
        <p className="text-gray-500 text-xs mt-0.5">{verdict.tag}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={cn("text-xs font-black tracking-widest uppercase", c.text)}>
          {verdict.verdict}
        </span>
        <span className="text-gray-600 text-xs font-bold">{verdict.score}/100</span>
      </div>
    </motion.div>
  );
}

/** Scrolling tech badge row */
function TechBadge({ name, icon: Icon }: { name: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-gray-400 text-sm font-medium whitespace-nowrap hover:bg-white/[0.07] hover:text-white transition-colors duration-300 cursor-default">
      <Icon className="w-4 h-4" />
      {name}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Typewriter for the hero badge
  const words = ["Safer.", "Smarter.", "Trustless."];
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#06080c] text-white overflow-x-hidden selection:bg-violet-500/30">
      {/* ── Persistent Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Orb className="top-[-15%] left-[-10%]" color="rgba(139,92,246,0.12)" size={800} />
        <Orb className="bottom-[-20%] right-[-10%]" color="rgba(14,165,233,0.10)" size={700} />
        <Orb className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" color="rgba(16,185,129,0.04)" size={500} />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between glass-panel px-6 py-3 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">
                Trust<span className="text-gradient">Copilot</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
              <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
              <a href="#tech" className="hover:text-white transition-colors duration-200">Tech Stack</a>
            </div>
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative px-5 py-2 rounded-xl text-sm font-bold overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-1.5">
                  Launch App <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-6 z-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-8 bg-violet-500/10 border border-violet-500/20 px-5 py-2 rounded-full backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm font-semibold text-violet-300 tracking-wide">
              AI-Powered On-Chain Security Engine
            </span>
            <Star className="w-4 h-4 text-violet-400 ml-1" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
            className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
              Transact with{" "}
            </span>
            <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-gradient"
              >
                {words[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
          >
            TrustCopilot analyzes any wallet in milliseconds — scoring risk, detecting scam patterns, and issuing{" "}
            <span className="text-violet-300 font-semibold">AI-driven safety verdicts</span> before
            you commit a single on-chain transaction.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="relative px-8 py-4 rounded-2xl font-bold text-base overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 rounded-2xl bg-[length:200%_auto] animate-gradient-x" />
                <span className="relative z-10 flex items-center gap-2">
                  Analyze a Wallet Now <ArrowRight className="w-4 h-4" />
                </span>
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-2xl font-bold text-base text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:text-white transition-all duration-300 flex items-center gap-2"
              >
                See Features <ChevronDown className="w-4 h-4" />
              </motion.button>
            </a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20 flex flex-col items-center gap-2 text-gray-600"
          >
            <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hero floating wallet cards */}
        <div className="absolute right-[4%] top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-20">
          {VERDICTS.map((v, i) => (
            <motion.div
              key={v.wallet}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
            >
              <VerdictCard verdict={v} index={0} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-sm text-sky-400 font-semibold mb-4"
            >
              <Zap className="w-3.5 h-3.5" /> Core Capabilities
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4"
            >
              Everything you need to stay{" "}
              <span className="text-gradient">on-chain safe</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-xl mx-auto text-lg"
            >
              Purpose-built security primitives that work silently in the background — or right in your face when you need them most.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full text-sm text-violet-400 font-semibold mb-4"
            >
              <Activity className="w-3.5 h-3.5" /> How It Works
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4"
            >
              Three steps to <span className="text-gradient">absolute clarity</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="flex flex-col gap-6">
              {[
                {
                  step: "01",
                  title: "Paste Any Wallet Address",
                  desc: "Enter any EVM-compatible wallet address in the search bar. TrustCopilot fetches live on-chain data via Etherscan & Covalent APIs instantly.",
                  color: "violet",
                },
                {
                  step: "02",
                  title: "AI Engine Runs Analysis",
                  desc: "Our multi-model AI stack analyzes transaction history, token interactions, contract associations and behavioral patterns — all in under 200ms.",
                  color: "sky",
                },
                {
                  step: "03",
                  title: "Receive Your Verdict",
                  desc: "Get a 0–100 risk score, a human-readable AI explanation, key findings, and a decisive recommendation: Safe, Risky, or Avoid.",
                  color: "emerald",
                },
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="flex gap-5 glass-card p-5 group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg",
                      step.color === "violet" && "bg-violet-500/10 text-violet-400 border border-violet-500/20",
                      step.color === "sky" && "bg-sky-500/10 text-sky-400 border border-sky-500/20",
                      step.color === "emerald" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mock terminal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="glass-panel overflow-hidden rounded-2xl"
            >
              {/* Terminal header bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/05 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="text-xs text-gray-500 font-mono ml-2">TrustCopilot Analysis Engine</span>
              </div>
              {/* Terminal body */}
              <div className="p-6 font-mono text-sm space-y-2">
                <p className="text-gray-500">$ analyzing wallet…</p>
                <p className="text-violet-400">→ fetching 847 transactions</p>
                <p className="text-violet-400">→ scanning 23 token contracts</p>
                <p className="text-sky-400">→ running behavioral graph analysis</p>
                <p className="text-sky-400">→ querying scam database</p>
                <p className="text-amber-400">⚠  pattern match: rug_pull_signature_3</p>
                <p className="text-amber-400">⚠  high velocity token dump detected</p>
                <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-rose-400 font-bold">RISK SCORE: 78/100</p>
                  <p className="text-rose-300 text-xs mt-1">VERDICT: RISKY — Proceed with extreme caution</p>
                </div>
                <p className="text-gray-600 text-xs mt-2">Analysis completed in 187ms ✓</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Verdicts Section ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4"
            >
              Real wallets.<br />
              <span className="text-gradient">Real verdicts.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-gray-400 text-lg max-w-lg mx-auto"
            >
              Every wallet tells a story. TrustCopilot reads it.
            </motion.p>
          </div>
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {VERDICTS.map((v, i) => (
              <VerdictCard key={v.wallet} verdict={v} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech" className="relative z-10 py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6"
          >
            Powered by
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {TECH_STACK.map((t) => (
              <TechBadge key={t.name} name={t.name} icon={t.icon} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden glass-panel p-12 md:p-16 text-center"
          >
            {/* CTA internal gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-sky-600/10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 px-4 py-1.5 rounded-full text-sm text-violet-300 font-semibold mb-6">
                <ShieldCheck className="w-4 h-4" /> Free to use · No wallet sign-in required
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-5">
                Start protecting your{" "}
                <span className="text-gradient">on-chain assets</span>
                <br />
                today.
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-lg mb-10">
                Paste an address. Get the truth. No gas, no sign-up, no BS.
              </p>
              <Link href="/app">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(139,92,246,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="relative px-10 py-4 rounded-2xl font-black text-base overflow-hidden group inline-flex"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 bg-[length:200%_auto] animate-gradient-x" />
                  <span className="relative z-10 flex items-center gap-2">
                    Launch TrustCopilot <ArrowRight className="w-5 h-5" />
                  </span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 border-t border-white/[0.05] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-400">TrustCopilot</span>
            <span className="opacity-40">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-gray-600 text-xs">
            Built for the Solana Hackathon · AI-Powered Wallet Security
          </p>
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <Link href="/app" className="hover:text-white transition-colors">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
