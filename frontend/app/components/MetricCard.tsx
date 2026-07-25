"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

export default function MetricCard({
  label,
  value,
  change,
  isPositive = true,
  subtext,
  sparklineData = [10, 15, 8, 22, 14, 25, 18],
  isLoading = false,
}: MetricCardProps) {
  // Generate points for sparkline
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const svgH = 28;
  const svgW = 80;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * svgW;
      const y = svgH - ((val - minVal) / range) * (svgH - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="glass-panel animate-spring-pop p-5 border-[#22252F] flex flex-col justify-between min-h-[125px] relative overflow-hidden bg-[#15161C] hover:border-neon-blue/20 transition-all duration-300">
      
      {/* Ambient glow blob — breathes on initial load */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none ${
          isLoading
            ? "bg-slate-700/20"
            : isPositive
            ? "bg-neon-blue/8 animate-glow-bloom"
            : "bg-rose-500/8 animate-glow-bloom"
        }`}
      />

      {/* Top row: label + badge */}
      <div className="flex items-start justify-between">
        {isLoading ? (
          <div className="skeleton skeleton-text w-28" />
        ) : (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        )}

        {/* Change badge */}
        {!isLoading && change && (
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold animate-value-pop ${
              isPositive
                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-950/30 text-rose-400 border border-rose-500/20"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{change}</span>
          </div>
        )}
        {isLoading && change && (
          <div className="skeleton skeleton-text w-14" />
        )}
      </div>

      {/* Bottom row: value + sparkline */}
      <div className="flex items-end justify-between mt-3">
        <div className="flex flex-col gap-0.5">
          {isLoading ? (
            <>
              <div className="skeleton skeleton-value" />
              <div className="skeleton skeleton-text w-20 mt-1 opacity-60" style={{ height: "0.75em" }} />
            </>
          ) : (
            <>
              <span
                key={value}
                className="text-2xl font-bold tracking-tight text-white font-mono animate-value-pop"
              >
                {value}
              </span>
              {subtext && (
                <span className="text-[10px] text-slate-500 animate-value-pop" style={{ animationDelay: "80ms" }}>
                  {subtext}
                </span>
              )}
            </>
          )}
        </div>

        {/* Sparkline */}
        <div className="w-20 h-7 shrink-0">
          {isLoading ? (
            <div className="skeleton w-full h-full" style={{ borderRadius: 4 }} />
          ) : (
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgW} ${svgH}`}
            >
              <polyline
                fill="none"
                stroke={isPositive ? "var(--neon-cyan)" : "var(--neon-magenta)"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: 200,
                  animation: "sparkline-draw 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
                }}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
