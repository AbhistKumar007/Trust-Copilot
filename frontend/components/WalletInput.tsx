"use client";

import React, { useState } from "react";
import { Search, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WalletInputProps {
  onAnalyze: (address: string) => void;
  isLoading: boolean;
}

export const WalletInput: React.FC<WalletInputProps> = ({ onAnalyze, isLoading }) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic multi-chain address validation
    if (!/^[a-zA-Z0-9]{20,90}$/.test(address.trim())) {
      setError("Please enter a valid crypto wallet address.");
      return;
    }

    onAnalyze(address.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto z-10 relative">
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit} 
        className="glass-panel p-2.5 flex items-center relative group backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_8px_40px_rgba(139,92,246,0.15)] hover:border-white/20 rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none" />
        
        <Search className="w-5 h-5 text-indigo-400 ml-4 relative z-10" />
        
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste any crypto wallet address..."
          className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-gray-500/70 relative z-10 text-lg font-medium tracking-wide selection:bg-indigo-500/30"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !address}
          className={cn(
            "relative z-10 px-8 py-3.5 rounded-xl font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden group/btn",
            isLoading
              ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
              : "bg-black/20 text-white border border-white/10 hover:border-violet-400/50 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98]"
          )}
        >
          {/* Animated Gradient Background for Button */}
          {!isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 rounded-xl opacity-80 group-hover/btn:opacity-100 bg-[length:200%_auto] animate-shine transition-opacity duration-300 z-0" />
          )}

          <div className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-gray-300">Processing...</span>
              </>
            ) : (
              <span className="tracking-wide">Analyze Wallet</span>
            )}
          </div>
        </button>
      </motion.form>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-3 ml-2 flex items-center gap-1"
        >
          <ShieldAlert className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
};
