"use client";

import React from "react";
import { Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  enabled: boolean;
  onToggle: (state: boolean) => void;
}

export const AutoProtectToggle: React.FC<Props> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
        enabled 
          ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60" 
          : "bg-gray-500/10 border-gray-500/30 hover:border-gray-500/60"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300",
        enabled ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-500"
      )}>
        {enabled ? <Shield className="w-3.5 h-3.5 text-black" /> : <ShieldAlert className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={cn(
        "text-sm font-bold tracking-wide",
        enabled ? "text-emerald-400" : "text-gray-400"
      )}>
        Auto-Protect {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
};
