"use client";

import React from "react";
import { Bot, Lightbulb, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface AIExplanationProps {
  summary: string;
  explanation: string;
  keyFindings: string[];
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ summary, explanation, keyFindings }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8 flex flex-col h-full relative"
    >
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg text-violet-400 border border-violet-500/20">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">TrustCopilot AI Analysis</h2>
          <p className="text-gray-400 text-sm">Powered by GPT-4</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-violet-400" /> Executive Summary
          </h3>
          <p className="text-gray-200 text-lg leading-relaxed">{summary}</p>
        </div>

        <div className="bg-white/5 rounded-xl block p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Detailed Explanation</h3>
          <p className="text-gray-300 leading-relaxed text-sm format-paragraph whitespace-pre-wrap">
            {explanation}
          </p>
        </div>

        {keyFindings && keyFindings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-yellow-400" /> Key Findings
            </h3>
            <ul className="space-y-2">
              {keyFindings.map((finding, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-start gap-3 text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5"
                >
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span className="text-sm leading-relaxed">{finding}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};
