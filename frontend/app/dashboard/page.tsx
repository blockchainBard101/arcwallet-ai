"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, getBackendUrl } from "../context/AppContext";
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

  const [stats, setStats] = useState<{
    portfolioValue: number;
    totalVolumeTraded: number;
    transactionCount: number;
    uniqueDexPools: number;
    heatmap?: number[][];
    transactions?: any[];
    charts: {
      volumeTrend: any[];
      dexDistribution: any[];
      bridgeVolume: any[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(`${getBackendUrl()}/stats/${explorerWallet}?timeframe=${timeframe}&timezone=${timeZone}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        if (active) {
          setStats(data);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      active = false;
    };
  }, [explorerWallet, timeframe]);


  const displayVal = stats ? `$${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";
  const displayVolume = stats ? `$${stats.totalVolumeTraded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";
  const displayTxs = stats ? stats.transactionCount : 0;
  const displayDexs = stats ? stats.uniqueDexPools : 0;
  const isAgentAddress = explorerWallet.toLowerCase().includes("agent");


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
          value={loading ? "Loading..." : displayVal}
          change="+8.42%"
          isPositive={true}
          subtext="Updated just now"
          sparklineData={[11200, 11500, 11900, 11600, 12100, stats?.portfolioValue || 12531]}
        />
        <MetricCard
          label="Total Volume Traded"
          value={loading ? "Loading..." : displayVolume}
          change="+15.3%"
          isPositive={true}
          subtext="Volume scoped to timeframe"
          sparklineData={[42000, 43500, 44200, 46100, stats?.totalVolumeTraded || 48930]}
        />
        <MetricCard
          label="Transaction Counts"
          value={loading ? "Loading..." : displayTxs.toString()}
          change="+4.8%"
          isPositive={true}
          subtext="Valid RPC signatures"
          sparklineData={[120, 128, 131, 135, stats?.transactionCount || 142]}
        />
        <MetricCard
          label="Unique DEX Pools"
          value={loading ? "Loading..." : displayDexs.toString()}
          change="-2.1%"
          isPositive={false}
          subtext="Liquidity routing pools"
          sparklineData={[9, 8, 8, 7, stats?.uniqueDexPools || 7]}
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
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
          ) : (
            <VolumeTrendChart data={stats?.charts?.volumeTrend} />
          )}
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
            {loading ? (
              <div className="text-slate-400 text-sm">Loading chart...</div>
            ) : (
              <DexDistributionChart data={stats?.charts?.dexDistribution} />
            )}
          </div>
        </div>

        {/* Bridge Breakdown */}
        <div className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 min-h-[320px] justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bridge Integration Volume</span>
            <span className="text-[10px] text-slate-500 font-mono">USDC bridge deposit inflow channels</span>
          </div>
          <div className="flex-1 flex items-center min-h-0 pt-4">
            {loading ? (
              <div className="text-slate-400 text-sm">Loading chart...</div>
            ) : (
              <BridgeBarChart data={stats?.charts?.bridgeVolume} />
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Heatmap */}
      {loading ? (
        <div className="glass-panel p-5 text-center text-slate-400 text-sm">Loading activity...</div>
      ) : (
        <ActivityHeatmap data={stats?.heatmap} />
      )}

      {/* Row 4: Transaction List */}
      {loading ? (
        <div className="glass-panel p-5 text-center text-slate-400 text-sm">Loading transactions...</div>
      ) : (
        <TransactionTable transactions={stats?.transactions || []} />
      )}

    </div>
  );
}

