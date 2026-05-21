"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  sparklineData?: number[];
}

export default function MetricCard({
  label,
  value,
  change,
  isPositive = true,
  subtext,
  sparklineData = [10, 15, 8, 22, 14, 25, 18],
}: MetricCardProps) {
  // Generate points for sparkline
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const height = 28;
  const width = 80;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="glass-panel p-5 border-[#22252F] flex flex-col justify-between min-h-[125px] relative overflow-hidden bg-[#15161C] hover:border-[#22252F]/80 transition-all duration-300">
      <div className="absolute top-0 right-0 w-16 h-16 bg-neon-blue/5 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {change && (
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPositive ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/30 text-rose-400 border border-rose-500/20"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
          {subtext && <span className="text-[10px] text-slate-500">{subtext}</span>}
        </div>

        {/* Sparkline Graphic */}
        <div className="w-20 h-7 shrink-0">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
            <polyline
              fill="none"
              stroke={isPositive ? "var(--neon-cyan)" : "var(--neon-magenta)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
