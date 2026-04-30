"use client";

import React from "react";

// ─── Network definitions ──────────────────────────────────────────────────────

const NETWORK_STYLES: Record<string, {
  dot: string; bg: string; border: string; text: string; label: string;
}> = {
  "Ethereum Mainnet": {
    dot: "bg-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-300",
    label: "Mainnet",
  },
  "Sepolia Testnet": {
    dot: "bg-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    text: "text-violet-300",
    label: "Sepolia",
  },
  "Polygon": {
    dot: "bg-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    text: "text-purple-300",
    label: "Polygon",
  },
  "Mumbai Testnet": {
    dot: "bg-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/25",
    text: "text-fuchsia-300",
    label: "Mumbai",
  },
  "Amoy Testnet": {
    dot: "bg-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
    text: "text-pink-300",
    label: "Amoy",
  },
  "BSC": {
    dot: "bg-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    text: "text-yellow-300",
    label: "BSC",
  },
};

const FALLBACK_STYLE = {
  dot: "bg-amber-400",
  bg: "bg-amber-500/10",
  border: "border-amber-500/30",
  text: "text-amber-300",
  label: "Unknown",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface NetworkBadgeProps {
  chainName: string | null;
  isTestnet?: boolean;
  size?: "sm" | "md";
}

export function NetworkBadge({ chainName, isTestnet = false, size = "sm" }: NetworkBadgeProps) {
  if (!chainName) return null;

  const style = NETWORK_STYLES[chainName] ?? FALLBACK_STYLE;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full border ${style.bg} ${style.border} ${style.text} ${textSize} font-bold`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      {style.label}
      {isTestnet && (
        <span className="text-[9px] opacity-70 font-black tracking-wider">TEST</span>
      )}
    </span>
  );
}
