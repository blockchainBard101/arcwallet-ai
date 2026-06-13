"use client";

import React, { useState } from "react";

export default function ActivityHeatmap({ data }: { data?: number[][] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = ["12am", "2am", "4am", "6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"];

  // Mock intensity matrix (7 days x 12 hour blocks)
  const defaultMatrix = [
    [1, 0, 2, 4, 3, 0, 5, 8, 3, 2, 1, 0], // Mon
    [0, 1, 0, 3, 5, 2, 9, 6, 4, 3, 2, 1], // Tue
    [2, 0, 1, 2, 4, 1, 6, 7, 5, 8, 3, 0], // Wed
    [1, 1, 0, 5, 3, 4, 8, 9, 2, 4, 1, 1], // Thu
    [3, 2, 2, 4, 6, 3, 7, 8, 9, 6, 5, 2], // Fri
    [4, 5, 3, 1, 2, 0, 3, 4, 5, 3, 6, 4], // Sat
    [2, 3, 1, 0, 1, 1, 2, 3, 4, 2, 1, 1], // Sun
  ];

  const matrix = data || defaultMatrix;

  const [hoveredCell, setHoveredCell] = useState<{ dayIdx: number; hourIdx: number; count: number } | null>(null);


  const getBgColor = (count: number) => {
    if (count === 0) return "bg-[#090A0F]/40 border-[#22252F]";
    if (count <= 2) return "bg-neon-blue/15 border-neon-blue/10";
    if (count <= 4) return "bg-neon-blue/35 border-neon-blue/20";
    if (count <= 6) return "bg-neon-cyan/50 border-neon-cyan/30";
    if (count <= 8) return "bg-neon-cyan/75 border-neon-cyan/50";
    return "bg-neon-cyan text-[#090A0F] border-neon-cyan";
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 select-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hourly Activity Heatmap</span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-[#090A0F]/40 border border-[#22252F]" />
          <div className="w-2.5 h-2.5 rounded bg-neon-blue/15" />
          <div className="w-2.5 h-2.5 rounded bg-neon-blue/35" />
          <div className="w-2.5 h-2.5 rounded bg-neon-cyan/50" />
          <div className="w-2.5 h-2.5 rounded bg-neon-cyan" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[600px] flex flex-col gap-1.5 relative">
          
          {/* Hours Headers */}
          <div className="flex pl-10 text-[10px] text-slate-400 font-semibold mb-1">
            {hours.map((hour, idx) => (
              <div key={idx} className="flex-1 text-center font-mono">
                {hour}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1.5">
              {/* Day Label */}
              <div className="w-8 text-[11px] font-semibold text-slate-400 font-mono text-left shrink-0">
                {day}
              </div>
              
              {/* Cells */}
              <div className="flex-1 flex gap-1.5">
                {matrix[dayIdx].map((count, hourIdx) => (
                  <div
                     key={hourIdx}
                     onMouseEnter={() => setHoveredCell({ dayIdx, hourIdx, count })}
                     onMouseLeave={() => setHoveredCell(null)}
                     className={`flex-1 h-7 rounded border transition-all duration-150 cursor-pointer hover:scale-105 hover:z-10 ${getBgColor(
                       count
                     )}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip Overlay */}
      {hoveredCell !== null && (
        <div className="absolute z-20 p-2.5 rounded-lg border border-[#22252F] bg-[#15161C] text-[11px] font-semibold shadow-2xl backdrop-blur-md animate-slide-in pointer-events-none flex flex-col gap-0.5"
             style={{
               bottom: "15px",
               right: "15px"
             }}>
          <span className="text-slate-400">
            {days[hoveredCell.dayIdx]} at {hours[hoveredCell.hourIdx]}
          </span>
          <span className="text-white text-xs font-mono font-bold">
            {hoveredCell.count === 0 ? "No" : hoveredCell.count} transactions detected
          </span>
        </div>
      )}
    </div>
  );
}
