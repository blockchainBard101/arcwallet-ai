"use client";

import React, { useState } from "react";

// ==========================================
// 1. VOLUME TREND CHART (Area Chart)
// ==========================================
interface AreaChartData {
  date: string;
  value: number;
}

export function VolumeTrendChart({
  data = [
    { date: "Mon", value: 1200 },
    { date: "Tue", value: 1900 },
    { date: "Wed", value: 1400 },
    { date: "Thu", value: 2400 },
    { date: "Fri", value: 1800 },
    { date: "Sat", value: 2800 },
    { date: "Sun", value: 2200 },
  ],
}: {
  data?: AreaChartData[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartWidth = 600;
  const chartHeight = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = 0;
  const activeData = data.filter((d) => d.value !== undefined && d.value !== null);
  const maxVal = activeData.length > 0 ? Math.max(...activeData.map((d) => d.value)) * 1.15 : 1000;

  // Coordinate conversion helpers
  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * graphWidth;
  };
  const getY = (val: number) => {
    return paddingTop + graphHeight - (val / maxVal) * graphHeight;
  };

  // Build svg path
  let pathD = "";
  let areaD = "";
  if (activeData.length > 0) {
    const startIdx = data.indexOf(activeData[0]);
    pathD = `M ${getX(startIdx)} ${getY(activeData[0].value)}`;
    areaD = `M ${getX(startIdx)} ${getY(0)} L ${getX(startIdx)} ${getY(activeData[0].value)}`;
    for (let i = 1; i < activeData.length; i++) {
      const origIdx = data.indexOf(activeData[i]);
      pathD += ` L ${getX(origIdx)} ${getY(activeData[i].value)}`;
      areaD += ` L ${getX(origIdx)} ${getY(activeData[i].value)}`;
    }
    const endIdx = data.indexOf(activeData[activeData.length - 1]);
    areaD += ` L ${getX(endIdx)} ${getY(0)} Z`;
  }

  // Draw grid lines
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">


        {/* Horizontal Grids */}
        {gridLines.map((ratio, idx) => {
          const y = paddingTop + graphHeight * (1 - ratio);
          const valLabel = Math.round(maxVal * ratio);
          return (
            <g key={idx} className="opacity-20">
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 10} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" className="font-mono">
                ${valLabel}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const x = getX(idx);
          return (
            <text key={idx} x={x} y={chartHeight - 15} fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-medium">
              {d.date}
            </text>
          );
        })}

        {/* Area Fill */}
        {areaD && <path d={areaD} fill="var(--neon-blue)" fillOpacity="0.05" />}

        {/* Line Stroke */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--neon-blue)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive hover points & vertical track lines */}
        {data.map((d, idx) => {
          if (d.value === undefined || d.value === null) return null;
          const x = getX(idx);
          const y = getY(d.value);
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible wide track for easier hover */}
              <rect x={x - 20} y={paddingTop} width="40" height={graphHeight} fill="transparent" />
              
              {isHovered && (
                <>
                  <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="var(--neon-cyan)" strokeWidth="1" strokeDasharray="2 2" className="opacity-60" />
                  <circle cx={x} cy={y} r="7" fill="var(--background)" stroke="var(--neon-cyan)" strokeWidth="3" />
                </>
              )}
              <circle cx={x} cy={y} r="4" fill="var(--neon-blue)" />
            </g>
          );
        })}
      </svg>


      {/* Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-10 p-2.5 rounded-lg border border-[#22252F] bg-[#15161C] text-[11px] font-medium shadow-2xl backdrop-blur-md animate-slide-in pointer-events-none"
          style={{
            left: `${(getX(hoveredIdx) / chartWidth) * 100}%`,
            top: `${(getY(data[hoveredIdx].value) / chartHeight) * 100 - 30}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-slate-400 font-bold">{data[hoveredIdx].date} Volume</div>
          <div className="text-white font-mono text-sm mt-0.5">${data[hoveredIdx].value.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. PORTFOLIO VALUE OVER TIME (Area Chart)
// ==========================================
export function PortfolioValueChart({
  data = [
    { date: "May 1", value: 8500 },
    { date: "May 5", value: 9200 },
    { date: "May 10", value: 8900 },
    { date: "May 15", value: 11200 },
    { date: "May 20", value: 12531 },
  ],
}: {
  data?: AreaChartData[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartWidth = 600;
  const chartHeight = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = data.length > 0 ? Math.min(...data.map((d) => d.value)) * 0.9 : 0;
  const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value)) * 1.05 : 10000;
  const range = (maxVal - minVal) || 1;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1)) * graphWidth;
  const getY = (val: number) => paddingTop + graphHeight - ((val - minVal) / range) * graphHeight;

  let pathD = "";
  let areaD = "";
  if (data.length > 0) {
    pathD = `M ${getX(0)} ${getY(data[0].value)}`;
    areaD = `M ${getX(0)} ${getY(minVal)} L ${getX(0)} ${getY(data[0].value)}`;
    for (let i = 1; i < data.length; i++) {
      pathD += ` L ${getX(i)} ${getY(data[i].value)}`;
      areaD += ` L ${getX(i)} ${getY(data[i].value)}`;
    }
    areaD += ` L ${getX(data.length - 1)} ${getY(minVal)} Z`;
  }

  const gridRatios = [0, 0.5, 1];

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">


        {/* Horizontal Grids */}
        {gridRatios.map((ratio, idx) => {
          const y = paddingTop + graphHeight * (1 - ratio);
          const valLabel = Math.round(minVal + range * ratio);
          return (
            <g key={idx} className="opacity-15">
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <text x={paddingLeft - 10} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" className="font-mono">
                ${valLabel.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const x = getX(idx);
          return (
            <text key={idx} x={x} y={chartHeight - 15} fill="#94a3b8" fontSize="11" textAnchor="middle">
              {d.date}
            </text>
          );
        })}

        {/* Area */}
        {areaD && <path d={areaD} fill="var(--neon-purple)" fillOpacity="0.05" />}

        {/* Line */}
        {pathD && <path d={pathD} fill="none" stroke="var(--neon-purple)" strokeWidth="3" />}

        {/* Tracker */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const y = getY(d.value);
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect x={x - 25} y={paddingTop} width="50" height={graphHeight} fill="transparent" />
              {isHovered && (
                <>
                  <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="var(--neon-purple)" strokeWidth="1" strokeDasharray="2 2" className="opacity-60" />
                  <circle cx={x} cy={y} r="7" fill="var(--background)" stroke="var(--neon-purple)" strokeWidth="3" />
                </>
              )}
              <circle cx={x} cy={y} r="4" fill="var(--neon-purple)" />
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div
          className="absolute z-10 p-2.5 rounded-lg border border-[#22252F] bg-[#15161C] text-[11px] font-medium shadow-2xl backdrop-blur-md animate-slide-in pointer-events-none"
          style={{
            left: `${(getX(hoveredIdx) / chartWidth) * 100}%`,
            top: `${(getY(data[hoveredIdx].value) / chartHeight) * 100 - 30}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-slate-400 font-bold">{data[hoveredIdx].date}</div>
          <div className="text-white font-mono text-sm mt-0.5">${data[hoveredIdx].value.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. DEX DISTRIBUTION (Donut Chart)
// ==========================================
interface DonutData {
  name: string;
  value: number;
  color: string;
}

export function DexDistributionChart({
  data = [
    { name: "Uniswap V3", value: 55, color: "var(--neon-blue)" },
    { name: "Curve", value: 25, color: "var(--neon-cyan)" },
    { name: "Balancer", value: 12, color: "var(--neon-purple)" },
    { name: "Others", value: 8, color: "var(--neon-magenta)" },
  ],
  centerLabel = "Total DEX",
  centerValue = "100%",
}: {
  data?: DonutData[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const chartSize = 220;
  const center = chartSize / 2;
  const radius = 70;
  const strokeWidth = 22;

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const circumference = 2 * Math.PI * radius;

  let accumulatedLength = 0;

  return (
    <div className="flex flex-col items-center gap-4 justify-center w-full">
      {/* SVG Donut */}
      <div className="relative w-[220px] h-[220px] shrink-0">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartSize} ${chartSize}`}>
          {/* Rotated group to start slices at 12 o'clock */}
          <g transform={`rotate(-90 ${center} ${center})`}>
            {data.map((item, idx) => {
              const sliceLength = (item.value / total) * circumference;
              const dashArray = `${sliceLength} ${circumference}`;
              const dashOffset = -accumulatedLength;
              accumulatedLength += sliceLength;

              const isActive = activeIdx === idx;

              return (
                <circle
                  key={item.name}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300 cursor-pointer hover:stroke-[26px]"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                />
              );
            })}
          </g>

          {/* Center text hole */}
          <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 2} fill="var(--card-bg)" />
          
          <g transform={`translate(${center}, ${center})`} textAnchor="middle">
            <text y="-5" fill="#94a3b8" fontSize="11" className="font-semibold uppercase tracking-wider">
              {activeIdx !== null ? data[activeIdx].name : centerLabel}
            </text>
            <text y="18" fill="#ffffff" fontSize="18" className="font-bold font-mono">
              {activeIdx !== null ? `${data[activeIdx].value}%` : centerValue}
            </text>
          </g>
        </svg>
      </div>

      {/* Donut Legend */}
      <div className="flex flex-col gap-2.5">
        {data.map((item, idx) => (
          <div
            key={item.name}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              activeIdx === idx ? "bg-white/5 border-white/10" : "border-transparent"
            }`}
            onMouseEnter={() => setActiveIdx(idx)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-semibold text-slate-300 w-24">{item.name}</span>
            <span className="text-xs font-mono font-bold text-white text-right">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. BRIDGE BREAKDOWN (Bar Chart)
// ==========================================
interface BarData {
  name: string;
  value: number;
}

export function BridgeBarChart({
  data = [
    { name: "Circle CCTP", value: 12500 },
    { name: "Arc Native", value: 8900 },
    { name: "Across", value: 4300 },
    { name: "Synapse", value: 1800 },
  ],
}: {
  data?: BarData[];
}) {
  const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value)) * 1.1 : 1000;

  return (
    <div className="flex flex-col gap-4 w-full select-none py-1">
      {data.map((item, idx) => {
        const percent = (item.value / maxVal) * 100;
        return (
          <div key={item.name} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="text-slate-200">{item.name}</span>
              <span className="font-mono text-white">${item.value.toLocaleString()}</span>
            </div>
            
            {/* Bar Container */}
            <div className="w-full h-3 rounded-full bg-[#090A0F] overflow-hidden border border-[#22252F]">
              <div
                className="h-full rounded-full bg-neon-blue transition-all duration-1000 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
