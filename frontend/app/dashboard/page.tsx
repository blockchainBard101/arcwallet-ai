"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import MetricCard from "../components/MetricCard";
import { VolumeTrendChart, DexDistributionChart, BridgeBarChart } from "../components/CustomCharts";
import ActivityHeatmap from "../components/ActivityHeatmap";
import TransactionTable from "../components/TransactionTable";
import { Compass, Copy, Check, ChevronDown } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { explorerWallet, activityLog, triggerToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [timeframe, setTimeframe] = useState("1w");

  const handleCopy = () => {
    navigator.clipboard.writeText(explorerWallet);
    setCopied(true);
    triggerToast("Address copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Adjust mock data slightly based on searched address for realism
  const isAgentAddress = explorerWallet.toLowerCase().includes("agent");
  const displayVal = isAgentAddress ? "$1,450.00" : "$12,531.79";
  const displayVolume = isAgentAddress ? "$4,250.00" : "$48,930.50";
  const displayTxs = isAgentAddress ? 12 : 142;
  const displayDexs = isAgentAddress ? 2 : 7;
  const displaySlippage = isAgentAddress ? "0.2%" : "0.55%";

  return (
    <div className="flex flex-col gap-6">
      
      {/* Dashboard Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252F] pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Search Target</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm sm:text-base font-semibold text-white truncate max-w-[280px] sm:max-w-md">
              {explorerWallet}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#15161C] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-[#15161C] p-1 rounded-xl border border-[#22252F]">
            {["1d", "1w", "1m", "1y"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors ${
                  timeframe === t ? "bg-neon-blue text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Switch to Chat view */}
          <button
            onClick={() => router.push("/chat")}
            className="h-9 px-4 rounded-xl border border-[#22252F] bg-[#15161C] text-xs text-slate-300 font-semibold flex items-center gap-1.5 hover:bg-[#15161C] transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-neon-cyan" />
            Switch to Chat Mode
          </button>
        </div>
      </div>

      {/* Grid: Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Estimated Portfolio Value"
          value={displayVal}
          change="+8.42%"
          isPositive={true}
          subtext="Updated just now"
          sparklineData={[11200, 11500, 11900, 11600, 12100, 12531]}
        />
        <MetricCard
          label="Total Volume Traded"
          value={displayVolume}
          change="+15.3%"
          isPositive={true}
          subtext="Volume scoped to timeframe"
          sparklineData={[42000, 43500, 44200, 46100, 48930]}
        />
        <MetricCard
          label="Transaction Counts"
          value={displayTxs.toString()}
          change="+4.8%"
          isPositive={true}
          subtext="Valid RPC signatures"
          sparklineData={[120, 128, 131, 135, 142]}
        />
        <MetricCard
          label="Unique DEX Pools"
          value={displayDexs.toString()}
          change="-2.1%"
          isPositive={false}
          subtext="Liquidity routing pools"
          sparklineData={[9, 8, 8, 7, 7]}
        />
      </div>

      {/* Grid: Charts Row 1 (Volume trend area chart) */}
      <div className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 h-[320px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Trend Chart</span>
            <span className="text-[10px] text-slate-500 font-mono">Dynamic trade volumes routed through indexer</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neon-blue font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse" />
            Live Sync
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          <VolumeTrendChart />
        </div>
      </div>

      {/* Grid: Charts Row 2 (Split Donut and Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DEX Distribution */}
        <div className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 min-h-[320px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DEX Liquidity Distribution</span>
            <span className="text-[10px] text-slate-500 font-mono">Top swap routing endpoints by volume share</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <DexDistributionChart />
          </div>
        </div>

        {/* Bridge Breakdown */}
        <div className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 min-h-[320px] justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bridge Integration Volume</span>
            <span className="text-[10px] text-slate-500 font-mono">USDC bridge deposit inflow channels</span>
          </div>
          <div className="flex-1 flex items-center min-h-0 pt-4">
            <BridgeBarChart />
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap */}
      <ActivityHeatmap />

      {/* Row 4: Transaction List */}
      <TransactionTable transactions={activityLog.filter(act => act.wallet === explorerWallet || isAgentAddress)} />

    </div>
  );
}
