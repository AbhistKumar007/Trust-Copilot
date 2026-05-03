"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Copy,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Sparkles,
  ChevronDown,
  Wifi,
  WifiOff,
  RotateCcw,
  Zap,
} from "lucide-react";
import { copilotChat, type CopilotMessage, type OnChainContext } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  onChainContexts?: OnChainContext[] | null;
  addressesAnalyzed?: string[];
  isError?: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function genId() {
  return Math.random().toString(36).slice(2, 11);
}

/** Detect EVM addresses in text for highlighting */
function highlightAddresses(text: string): React.ReactNode[] {
  const evmRegex = /(0x[a-fA-F0-9]{40})/g;
  const parts = text.split(evmRegex);
  return parts.map((part, i) =>
    evmRegex.test(part) ? (
      <span
        key={i}
        className="font-mono text-violet-400 bg-violet-500/10 px-1 rounded text-[11px] break-all"
      >
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

/** Format AI markdown-ish text: bold, emoji-lines, newlines */
function formatMessage(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j} className="font-bold text-white">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={j}>{highlightAddresses(p)}</React.Fragment>
      )
    );
    return (
      <React.Fragment key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/* ─── Risk Badge from on-chain context ───────────────────────────────────────── */

function OnChainBadge({ ctx }: { ctx: OnChainContext }) {
  const isAvoid = ctx.isKnownScam || ctx.verdict === "Avoid";
  const isRisky = ctx.verdict === "Risky" || (ctx.riskScore !== null && ctx.riskScore > 40);
  const isSafe = ctx.verdict === "Safe" || (ctx.riskScore !== null && ctx.riskScore <= 40);

  const color = isAvoid
    ? { bg: "bg-rose-500/10", border: "border-rose-500/25", text: "text-rose-400", Icon: XOctagon }
    : isRisky
    ? { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400", Icon: AlertTriangle }
    : { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", Icon: ShieldCheck };

  const { Icon } = color;

  const truncAddr = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 text-xs mt-2",
        color.bg,
        color.border
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5 shrink-0", color.text)} />
        <span className="font-mono text-gray-400 text-[11px] truncate">{truncAddr(ctx.address)}</span>
        <span className={cn("ml-auto font-black uppercase tracking-wider text-[10px]", color.text)}>
          {ctx.verdict}
        </span>
      </div>
      {ctx.riskScore !== null && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 text-[10px] font-medium">
          <span>Risk: <span className={cn("font-bold", color.text)}>{ctx.riskScore}/100</span></span>
          {ctx.totalTransactions !== undefined && (
            <span>TXs: <span className="text-gray-300">{ctx.totalTransactions}</span></span>
          )}
          {ctx.walletAgeDays !== undefined && (
            <span>Age: <span className="text-gray-300">{ctx.walletAgeDays}d</span></span>
          )}
          {ctx.flaggedContractCount !== undefined && ctx.flaggedContractCount > 0 && (
            <span className="text-rose-400">⚠ {ctx.flaggedContractCount} flagged contracts</span>
          )}
          {ctx.isKnownScam && (
            <span className="text-rose-400 font-bold">⛔ Known Scam Address</span>
          )}
        </div>
      )}
      {ctx.error && (
        <span className="text-gray-600 text-[10px] italic">{ctx.error}</span>
      )}
    </div>
  );
}

/* ─── Typing Indicator ────────────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-400"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Suggested Prompts ───────────────────────────────────────────────────────── */

const SUGGESTED_PROMPTS = [
  "Is 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 safe?",
  "What does a high risk score mean?",
  "Should I approve a contract with 85/100 risk?",
  "What are signs of a scam wallet?",
  "Explain token dump score to me",
];

/* ─── Main Component ──────────────────────────────────────────────────────────── */

export function AICopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: genId(),
      role: "assistant",
      content:
        "Hey! I'm **TrustCopilot AI** 👋\n\nAsk me about any wallet address, contract, or risk score. I'll pull live on-chain data and give you a clear **Safe / Risky / Avoid** verdict.\n\nTry something like:\n*\"Is this wallet safe: 0x...\"*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasError, setHasError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Auto-scroll ─────────────────────────────────────────────────────────── */

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(false), 60);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  /* ── Auto-resize textarea ──────────────────────────────────────────────── */

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  /* ── Focus on open ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  /* ── Send message ──────────────────────────────────────────────────────── */

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    setInput("");
    setHasError(false);

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Build history for API (last 18 messages, excluding system welcome)
    const historyForApi: CopilotMessage[] = messages
      .filter((m) => !m.isError)
      .slice(-18)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await copilotChat(content, historyForApi);

      if (res.success) {
        const assistantMsg: Message = {
          id: genId(),
          role: "assistant",
          content: res.data.response,
          timestamp: new Date(),
          onChainContexts: res.data.onChainContexts,
          addressesAnalyzed: res.data.addressesAnalyzed,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("API returned success: false");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Something went wrong. Please check the backend connection and your API key.";

      setHasError(true);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: `⚠️ ${msg}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Copy ─────────────────────────────────────────────────────────────── */

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  /* ── Reset ────────────────────────────────────────────────────────────── */

  const handleReset = () => {
    setMessages([
      {
        id: genId(),
        role: "assistant",
        content:
          "Conversation cleared. Ask me anything about wallets, contracts, or risk scores! 🛡️",
        timestamp: new Date(),
      },
    ]);
    setHasError(false);
    setInput("");
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Floating Bubble ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="ai-copilot-bubble"
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: "0 0 0 0 rgba(139,92,246,0.7)",
            }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(139,92,246,0.5)",
                  "0 0 0 12px rgba(139,92,246,0)",
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <Bot className="w-6 h-6 text-white relative z-10" />

            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-copilot-panel"
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(420px, calc(100vw - 24px))",
              height: "min(640px, calc(100dvh - 80px))",
              borderRadius: "24px",
              background: "rgba(7, 10, 16, 0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow:
                "0 32px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%)",
              }}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 border border-violet-500/20 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-violet-400 w-[18px] h-[18px]" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070a10]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-none">TrustCopilot AI</p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5" />
                  Live on-chain analysis
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset */}
                <button
                  onClick={handleReset}
                  title="Clear chat"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col gap-1.5 max-w-[85%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Bubble */}
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[13px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
                          : msg.isError
                          ? "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-bl-sm"
                          : "bg-[#0d1117] border border-white/[0.07] text-gray-200 rounded-bl-sm"
                      )}
                    >
                      {msg.role === "user"
                        ? highlightAddresses(msg.content)
                        : formatMessage(msg.content)}
                    </div>

                    {/* On-chain context badges */}
                    {msg.onChainContexts && msg.onChainContexts.length > 0 && (
                      <div className="w-full space-y-1.5">
                        {msg.onChainContexts.map((ctx) => (
                          <OnChainBadge key={ctx.address} ctx={ctx} />
                        ))}
                      </div>
                    )}

                    {/* Footer: timestamp + copy */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-700">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.role === "assistant" && !msg.isError && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-[10px] flex items-center gap-1 text-gray-700 hover:text-gray-400 transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Scroll to bottom button ── */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-[90px] right-4 w-8 h-8 rounded-full bg-[#0d1117] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white shadow-lg z-10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Suggestions (shown only if 1 message = welcome) ── */}
            <AnimatePresence>
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0"
                >
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isTyping}
                      className="text-[11px] text-gray-500 bg-white/[0.03] border border-white/[0.07] rounded-full px-3 py-1.5 hover:text-violet-300 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all disabled:opacity-40 text-left"
                    >
                      {prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input Area ── */}
            <div className="px-3 pb-3 pt-2 shrink-0 border-t border-white/[0.05]">
              {hasError && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-400 mb-2 px-1">
                  <WifiOff className="w-3 h-3" />
                  Backend offline or API key missing. Check your configuration.
                </div>
              )}

              <div className="flex items-end gap-2 bg-[#0d1117] border border-white/[0.08] rounded-2xl px-3 py-2.5 focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.07)] transition-all">
                <textarea
                  ref={inputRef}
                  id="copilot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a wallet, contract, or risk score…"
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none leading-relaxed min-h-[22px] disabled:opacity-50"
                  style={{ maxHeight: "120px" }}
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
                    input.trim() && !isTyping
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                      : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
                  )}
                >
                  {isTyping ? (
                    <Zap className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </div>

              <p className="text-center text-[10px] text-gray-700 mt-1.5">
                Powered by Gemini · Live on-chain data · Press ⏎ to send
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
