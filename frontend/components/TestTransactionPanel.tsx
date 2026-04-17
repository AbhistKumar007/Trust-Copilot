"use client";

import React, { useState } from "react";
import { Send, Loader2, Info } from "lucide-react";
import { preTransactionCheck, type PreTransactionCheckResponse } from "@/lib/api";
import { InterceptorModal } from "./InterceptorModal";

interface Props {
  isAutoProtectEnabled: boolean;
}

export const TestTransactionPanel: React.FC<Props> = ({ isAutoProtectEnabled }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Interceptor State
  const [showModal, setShowModal] = useState(false);
  const [interceptData, setInterceptData] = useState<PreTransactionCheckResponse["data"] | null>(null);
  
  // Fake success state for demo
  const [txSuccess, setTxSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    setTxSuccess(false);

    // Auto-Protect Intercept Logic
    if (isAutoProtectEnabled) {
      setIsProcessing(true);
      try {
        const result = await preTransactionCheck(recipient);
        
        // If it crosses threshold, block it and display modal
        if (result.success && result.data.isBlocked) {
          setInterceptData(result.data);
          setShowModal(true);
          setIsProcessing(false);
          return; // HALTS EXECUTION!
        }
        
      } catch (err) {
        console.error("Interceptor failed to evaluate address", err);
      }
    }

    // Normal execution path (if not blocked or auto-protect is OFF)
    executeTransaction();
  };

  const executeTransaction = () => {
    setIsProcessing(true);
    // Simulate web3 tx delay
    setTimeout(() => {
      setIsProcessing(false);
      setTxSuccess(true);
      setRecipient("");
      setAmount("");
      
      // Reset success state after a few seconds
      setTimeout(() => setTxSuccess(false), 3000);
    }, 1500);
  };

  const handleOverride = () => {
    setShowModal(false);
    executeTransaction();
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setIsProcessing(false);
  };

  return (
    <>
      <div className="glass-panel p-6 w-full max-w-sm mx-auto relative overflow-hidden group border border-white/5 hover:border-sky-500/20 transition-colors duration-500">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
           <Send className="w-5 h-5 text-sky-400" /> Web3 Sandbox
        </h3>
        
        <form onSubmit={handleSend} className="space-y-4 relative z-10">
          <div>
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Recipient Address</label>
             <input 
               type="text" 
               placeholder="0x..." 
               value={recipient}
               onChange={(e) => setRecipient(e.target.value)}
               className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500/50 transition-colors"
               required
             />
          </div>

          <div>
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount Input</label>
             <input 
               type="number" 
               step="0.01"
               placeholder="0.00" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500/50 transition-colors"
               required
             />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 mt-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : "Confirm Transaction"}
          </button>
        </form>

        {txSuccess && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-md z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <Send className="w-6 h-6 text-white" />
             </div>
             <span className="font-black tracking-wide text-lg text-emerald-400">Transaction Sent!</span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            This simulator allows you to test the <strong className="text-sky-400">Auto-Protect Interceptor</strong> capability before configuring mainnet wallets.
          </p>
        </div>
      </div>

      <InterceptorModal 
         isOpen={showModal}
         score={interceptData?.risk?.score || 0}
         explanation={interceptData?.ai?.summary || "This address has been flagged for potentially malicious activity."}
         targetAddress={recipient}
         onProceed={handleOverride}
         onCancel={handleCancelModal}
      />
    </>
  );
};
