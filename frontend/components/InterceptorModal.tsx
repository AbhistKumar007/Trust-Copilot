"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, XCircle, ShieldAlert, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  score: number;
  explanation: string;
  targetAddress: string;
  onProceed: () => void;
  onCancel: () => void;
}

export const InterceptorModal: React.FC<Props> = ({ isOpen, score, explanation, targetAddress, onProceed, onCancel }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0B0E14] border border-rose-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.2)]"
        >
          {/* Header */}
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <AlertOctagon className="text-rose-500 w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-500 uppercase tracking-wide">High Risk Detected</h2>
              <p className="text-sm text-rose-300/80">Transaction Intercepted by Auto-Protect</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
               <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Risk Score</span>
                  <span className="text-4xl font-black text-white">{score}<span className="text-lg text-gray-500 font-normal">/100</span></span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Target Recipient</span>
                  <span className="font-mono text-sm text-rose-400 mt-1 bg-rose-500/10 px-2 py-1 rounded">
                    {targetAddress.slice(0, 8)}...{targetAddress.slice(-6)}
                  </span>
               </div>
            </div>

            <div className="bg-rose-500/5 rounded-xl p-5 border border-rose-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-10 -mt-10 rounded-full"></div>
              
              <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold tracking-wide relative z-10">
                <ShieldAlert className="w-4 h-4" />
                AI Security Assessment
              </div>
              <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                {explanation}
              </p>
            </div>
          </div>

          {/* Footer Overrides */}
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onCancel}
              className="w-full sm:flex-1 bg-white hover:bg-gray-200 text-black font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 active:scale-95"
            >
              <XCircle className="w-5 h-5" /> Cancel Transaction
            </button>
            
            <button 
              onClick={onProceed}
              className="w-full sm:flex-1 bg-transparent hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 font-medium py-3.5 px-4 rounded-xl border border-gray-600 hover:border-rose-500/40 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              Force Proceed <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
