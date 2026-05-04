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
  X,
  Mail,
  KeyRound,
  User,
  LogIn,
  UserPlus,
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
/* ─────────────────────────────────────────────────────────────────────────────
   Auth Modal Component
───────────────────────────────────────────────────────────────────────────── */
function AuthModal({
  open,
  onClose,
  defaultTab = "login",
}: {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setEmail("");
      setPassword("");
      setName("");
      setDone(false);
    }
  }, [open, defaultTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1400);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={onClose}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Modal card */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring */}
            <div
              className="absolute -inset-px rounded-3xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.2) 50%, rgba(14,165,233,0.3) 100%)",
              }}
            />

            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(15,12,30,0.98) 0%, rgba(10,10,20,0.98) 100%)",
                border: "1px solid rgba(139,92,246,0.25)",
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.8), 0 0 60px -20px rgba(139,92,246,0.25)",
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.12] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-xl tracking-tight text-white">
                    Trust<span className="text-gradient">Copilot</span>
                  </span>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.07] rounded-2xl mb-2">
                  <button
                    onClick={() => { setTab("login"); setDone(false); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                      tab === "login"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <LogIn className="w-3.5 h-3.5" /> Log In
                  </button>
                  <button
                    onClick={() => { setTab("signup"); setDone(false); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                      tab === "signup"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Sign Up
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-8 pb-8">
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-8 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-xl font-black text-white">
                        {tab === "login" ? "Welcome back!" : "Account created!"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {tab === "login"
                          ? "You're now signed in to TrustCopilot."
                          : "Your account is ready. Redirecting you to the app…"}
                      </p>
                      <Link href="/app" className="w-full">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative w-full py-3 rounded-2xl font-black text-sm overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-2xl" />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                          </span>
                        </motion.button>
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.form
                      key={tab}
                      initial={{ opacity: 0, x: tab === "login" ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: tab === "login" ? 20 : -20 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <p className="text-2xl font-black text-white mb-1">
                          {tab === "login" ? "Welcome back" : "Create account"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {tab === "login"
                            ? "Sign in to access your TrustCopilot dashboard."
                            : "Start protecting your on-chain assets today."}
                        </p>
                      </div>

                      {/* Social auth */}
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {[
                          {
                            label: "Google",
                            icon: (
                              <svg viewBox="0 0 24 24" className="w-4 h-4">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                            ),
                          },
                          {
                            label: "GitHub",
                            icon: (
                              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-white">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                            ),
                          },
                        ].map((provider) => (
                          <button
                            key={provider.label}
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-gray-300 font-semibold hover:bg-white/[0.10] hover:text-white transition-all duration-200"
                          >
                            {provider.icon}
                            {provider.label}
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.07]" />
                        <span className="text-xs text-gray-600 font-medium">or continue with email</span>
                        <div className="flex-1 h-px bg-white/[0.07]" />
                      </div>

                      {/* Name (sign up only) */}
                      {tab === "signup" && (
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors duration-200">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all duration-200"
                          />
                        </div>
                      )}

                      {/* Email */}
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors duration-200">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all duration-200"
                        />
                      </div>

                      {/* Password */}
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors duration-200">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          placeholder={tab === "login" ? "Password" : "Create password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.09] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all duration-200"
                        />
                      </div>

                      {/* Forgot password */}
                      {tab === "login" && (
                        <div className="flex justify-end -mt-1">
                          <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-200 font-medium">
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={loading}
                        className="relative w-full py-3.5 rounded-2xl font-black text-sm overflow-hidden mt-1 disabled:opacity-70"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 bg-[length:200%_auto] animate-gradient-x rounded-2xl" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : tab === "login" ? (
                            <><LogIn className="w-4 h-4" /> Sign In</>
                          ) : (
                            <><UserPlus className="w-4 h-4" /> Create Account</>
                          )}
                        </span>
                      </motion.button>

                      {/* Switch tab hint */}
                      <p className="text-center text-xs text-gray-600">
                        {tab === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                          type="button"
                          onClick={() => { setTab(tab === "login" ? "signup" : "login"); setDone(false); }}
                          className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-200"
                        >
                          {tab === "login" ? "Sign up free" : "Log in"}
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

  // Auth modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight">
                Trust<span className="text-gradient">Copilot</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
              <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
              <a href="#tech" className="hover:text-white transition-colors duration-200">Tech Stack</a>
            </div>
            <div className="flex items-center gap-2">
              {/* Log In button */}
              <motion.button
                id="nav-login-btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={openLogin}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.09] hover:text-white transition-all duration-200"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In
              </motion.button>

              {/* Sign Up button */}
              <motion.button
                id="nav-signup-btn"
                whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(139,92,246,0.4)" }}
                whileTap={{ scale: 0.97 }}
                onClick={openSignup}
                className="relative px-5 py-2 rounded-xl text-sm font-bold overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </span>
              </motion.button>
            </div>
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
      <footer className="relative z-10 border-t border-white/[0.06] px-6 pt-20 pb-10 overflow-hidden">
        {/* Footer background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)", filter: "blur(60px)" }}
          />
        </div>

        {/* Top separator line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Main grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16"
          >
            {/* Brand column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.5)]">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <span className="font-black text-3xl tracking-tight text-white">
                  Trust<span className="text-gradient">Copilot</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                The AI-powered on-chain trust engine that analyzes wallet risk, intercepts dangerous transactions, and keeps your assets safe — in milliseconds.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 mt-1">
                {[
                  {
                    label: "GitHub",
                    href: "https://github.com",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Twitter / X",
                    href: "https://twitter.com",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Discord",
                    href: "https://discord.com",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    ),
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-violet-500/20 hover:border-violet-500/40 transition-all duration-300"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product column */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Product</h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "Wallet Analyzer", href: "/app" },
                  { label: "Auto-Protect Mode", href: "#features" },
                  { label: "Decision Copilot", href: "#features" },
                  { label: "On-Chain Reputation", href: "#features" },
                  { label: "Multi-Chain Coverage", href: "#features" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-violet-500/0 group-hover:bg-violet-400 transition-all duration-300" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>


            {/* Company column */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Company</h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "About", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Privacy Policy", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-violet-500/0 group-hover:bg-violet-400 transition-all duration-300" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Built on badge strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 mb-12"
          >
            {[
              { label: "Powered by OpenAI", color: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
              { label: "Secured by Polygon", color: "from-violet-500/20 to-purple-500/10", border: "border-violet-500/20", dot: "bg-violet-400" },
              { label: "Open Source", color: "from-sky-500/20 to-blue-500/10", border: "border-sky-500/20", dot: "bg-sky-400" },
            ].map((b) => (
              <div
                key={b.label}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r text-xs font-semibold text-gray-300 border",
                  b.color,
                  b.border
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", b.dot)} />
                {b.label}
              </div>
            ))}
          </motion.div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} TrustCopilot. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a key={item} href="#" className="hover:text-gray-400 transition-colors duration-200">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </div>
  );
}
