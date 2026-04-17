"use client";

import React from "react";
import { History, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Transaction {
  hash: string;
  type: string;
  timestamp: number;
  to: string;
  severity: string;
}

interface TransactionInsightsProps {
  transactions: Transaction[];
  walletAddress: string;
}

export const TransactionInsights: React.FC<TransactionInsightsProps> = ({ transactions, walletAddress }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400">
          <History size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Clean Transaction History</h3>
        <p className="text-gray-400 max-w-sm">
          No suspicious transaction patterns or flagged smart contract interactions were detected for this wallet.
        </p>
      </div>
    );
  }

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString();
  };

  const truncate = (str: string) => {
    if (!str) return "";
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="text-rose-500" /> Suspicious Activity Log
        </h3>
        <div className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-500/20">
          {transactions.length} Flags
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[400px]">
        {transactions.map((tx, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx }}
            key={idx}
            className={cn(
              "p-4 rounded-xl border flex flex-col gap-2 transition-all hover:bg-white/5 cursor-default",
              tx.severity === "high" ? "bg-rose-500/5 border-rose-500/20" : "bg-yellow-500/5 border-yellow-500/20"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1",
                tx.severity === "high" ? "bg-rose-500/20 text-rose-400" : "bg-yellow-500/20 text-yellow-400"
              )}>
                {tx.type}
              </span>
              <span className="text-gray-500 text-xs">{formatTime(tx.timestamp)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm font-mono text-gray-300 mt-1">
               <span className="opacity-50" title={walletAddress}>Self</span>
               <ArrowRight size={14} className="text-gray-500" />
               <span className="text-violet-400 hover:text-violet-300 transition-colors" title={tx.to}>
                 {truncate(tx.to)}
               </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
