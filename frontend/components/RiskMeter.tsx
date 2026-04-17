"use client";

import React from "react";
import { motion } from "framer-motion";

interface RiskMeterProps {
  score: number;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score }) => {
  // Determine color and label based on score (0 = safe, 100 = critical risk)
  let colorClass = "from-emerald-400 to-emerald-600";
  let label = "Safe";
  let shadowColor = "rgba(16, 185, 129, 0.4)";

  if (score > 20) {
    colorClass = "from-yellow-400 to-yellow-600";
    label = "Low Risk";
    shadowColor = "rgba(234, 179, 8, 0.4)";
  }
  if (score > 40) {
    colorClass = "from-orange-400 to-orange-600";
    label = "Medium Risk";
    shadowColor = "rgba(249, 115, 22, 0.4)";
  }
  if (score > 60) {
    colorClass = "from-red-400 to-red-600";
    label = "High Risk";
    shadowColor = "rgba(239, 68, 68, 0.4)";
  }
  if (score > 80) {
    colorClass = "from-rose-600 to-rose-900";
    label = "Critical Risk";
    shadowColor = "rgba(225, 29, 72, 0.5)";
  }

  // Animation values
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center relative min-h-[300px]">
      <h3 className="text-xl font-semibold mb-6 flex space-x-2 text-white/90">
        Risk Assessment Score
      </h3>
      
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* SVG Circle Background */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-white/10"
          />
          {/* Animated SVG Circle Foreground */}
          <motion.circle
            initial={{ strokeDashoffset: 440 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="80"
            cy="80"
            r="70"
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            style={{
              strokeDasharray: 440,
              filter: `drop-shadow(0 0 8px ${shadowColor})`,
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={score > 50 ? "#ef4444" : "#10b981"} />
              <stop offset="100%" stopColor={score > 80 ? "#9f1239" : score > 50 ? "#f97316" : "#059669"} />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner Content */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-5xl font-bold text-white tracking-widest"
            style={{ textShadow: `0 0 20px ${shadowColor}` }}
          >
            {score}
          </motion.span>
          <span className="text-gray-400 text-sm mt-1 uppercase tracking-wider font-semibold">
            / 100
          </span>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-6 text-lg font-medium tracking-wide text-center"
      >
        Status: <span className={`bg-gradient-to-r text-transparent bg-clip-text font-bold ${colorClass}`}>{label}</span>
      </motion.div>
    </div>
  );
};
