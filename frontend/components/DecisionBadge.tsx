"use client";

import React from "react";
import { Shield, AlertTriangle, XOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecisionBadgeProps {
  verdict: string;
  action: string;
  score: number;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ verdict, action, score }) => {
  let isSafe = score <= 40;
  let isCritical = score >= 80;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "glass-card p-6 flex flex-col items-center text-center relative overflow-hidden",
        isCritical ? "border-red-500/30" : isSafe ? "border-emerald-500/30" : "border-yellow-500/30"
      )}
    >
      {/* Background glow */}
      <div 
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-3xl opacity-20 rounded-full",
          isCritical ? "bg-red-500" : isSafe ? "bg-emerald-500" : "bg-yellow-500"
        )}
      />

      <div className={cn(
        "p-4 rounded-2xl mb-4 relative z-10",
        isCritical ? "bg-red-500/10 text-red-500" : isSafe ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
      )}>
        {isCritical ? <XOctagon size={48} /> : isSafe ? <Shield size={48} /> : <AlertTriangle size={48} />}
      </div>
      
      <h2 className={cn(
        "text-2xl font-bold tracking-tight mb-2 relative z-10",
        isCritical ? "text-red-400" : isSafe ? "text-emerald-400" : "text-yellow-400"
      )}>
        {verdict}
      </h2>
      
      <p className="text-gray-300 relative z-10 max-w-sm">
        {action}
      </p>
    </motion.div>
  );
};
