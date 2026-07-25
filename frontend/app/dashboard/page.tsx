"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, getBackendUrl } from "../context/AppContext";
import MetricCard from "../components/MetricCard";
import { VolumeTrendChart, DexDistributionChart, BridgeBarChart } from "../components/CustomCharts";
import ActivityHeatmap from "../components/ActivityHeatmap";
import TransactionTable from "../components/TransactionTable";
import { Compass, Copy, Check } from "lucide-react";

/** Skeleton panel that replaces a chart while loading.
 *  Uses the shimmer class + scan-line overlay for a premium feel. */
function SkeletonChartPanel({ height = "h-[240px]" }: { height?: string }) {
  return (
    <div className={`w-full ${height} relative rounded-xl overflow-hidden`}>
      {/* Shimmer base */}
      <div className="skeleton skeleton-bar absolute inset-0" />

      {/* Fake axis lines */}
      <div className="absolute inset-x-0 bottom-6 flex flex-col gap-6 px-6 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-full h-px bg-[#22252F]/40"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>

      {/* Fake bar stubs */}
      <div className="absolute bottom-8 inset-x-6 flex items-end gap-3 pointer-events-none">
        {[40, 65, 52, 80, 58, 70, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-neon-blue/10"
            style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Traveling scan line */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent animate-scan pointer-events-none"
      />
    </div>
  );
}

/** Skeleton for circular / donut charts */
function SkeletonDonut() {
  return (
    <div className="flex items-center justify-center w-full h-[200px]">
      <div className="relative w-36 h-36">
        {/* Outer shimmer ring */}
        <div className="skeleton absolute inset-0 rounded-full" />
        {/* Inner cutout */}
        <div className="absolute inset-[22%] rounded-full bg-[#15161C]" />
        {/* Fake legend */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[60, 80, 50].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton w-2.5 h-2.5 rounded-full" />
              <div className="skeleton skeleton-text" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton row list (for transaction table) */
function SkeletonTableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="skeleton skeleton-text w-36 mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="skeleton skeleton-text w-1/2" />
            <div className="skeleton skeleton-text w-1/3 opacity-60" style={{ height: "0.65em" }} />
          </div>
          <div className="skeleton skeleton-text w-20" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { explorerWallet, triggerToast } = useApp();
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
        const res = await fetch(
          `${getBackendUrl()}/stats/${explorerWallet}?timeframe=${timeframe}&timezone=${timeZone}`
        );
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

  const displayVal = stats
    ? `$${stats.portfolioValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "$0.00";
  const displayVolume = stats
    ? `$${stats.totalVolumeTraded.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "$0.00";
  const displayTxs = stats ? stats.transactionCount : 0;
  const displayDexs = stats ? stats.uniqueDexPools : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Dashboard Toolbar Header — waterfall entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252F] pb-5 animate-waterfall">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Active Search Target
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm sm:text-base font-semibold text-white truncate max-w-[280px] sm:max-w-md">
              {explorerWallet}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-[#15161C] p-1 rounded-xl border border-[#22252F]">
            {["1d", "1w", "1m", "1y"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors ${
                  timeframe === t
                    ? "bg-neon-blue text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/chat")}
            className="h-9 px-4 rounded-xl border border-[#22252F] bg-[#15161C] text-xs text-slate-300 font-semibold flex items-center gap-1.5 hover:bg-[#22252F] transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-neon-cyan" />
            Switch to Chat Mode
          </button>
        </div>
      </div>

      {/* Grid: Key Metrics Cards — spring-pop stagger via nth-child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Estimated Portfolio Value"
          value={displayVal}
          change="+8.42%"
          isPositive={true}
          subtext="Updated just now"
          sparklineData={[11200, 11500, 11900, 11600, 12100, stats?.portfolioValue || 12531]}
          isLoading={loading}
        />
        <MetricCard
          label="Total Volume Traded"
          value={displayVolume}
          change="+15.3%"
          isPositive={true}
          subtext="Volume scoped to timeframe"
          sparklineData={[42000, 43500, 44200, 46100, stats?.totalVolumeTraded || 48930]}
          isLoading={loading}
        />
        <MetricCard
          label="Transaction Counts"
          value={displayTxs.toString()}
          change="+4.8%"
          isPositive={true}
          subtext="Valid RPC signatures"
          sparklineData={[120, 128, 131, 135, stats?.transactionCount || 142]}
          isLoading={loading}
        />
        <MetricCard
          label="Unique DEX Pools"
          value={displayDexs.toString()}
          change="-2.1%"
          isPositive={false}
          subtext="Liquidity routing pools"
          sparklineData={[9, 8, 8, 7, stats?.uniqueDexPools || 7]}
          isLoading={loading}
        />
      </div>

      {/* Grid: Charts Row 1 — waterfall entry */}
      <div className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 h-[320px] animate-waterfall" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Volume Trend Chart
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Dynamic trade volumes routed through indexer
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neon-blue font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse" />
            Live Sync
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          {loading ? (
            <SkeletonChartPanel height="h-full" />
          ) : (
            <VolumeTrendChart data={stats?.charts?.volumeTrend} />
          )}
        </div>
      </div>

      {/* Grid: Charts Row 2 — split panels with waterfall stagger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DEX Distribution */}
        <div
          className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 min-h-[320px] animate-waterfall"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              DEX Liquidity Distribution
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Top swap routing endpoints by volume share
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            {loading ? <SkeletonDonut /> : <DexDistributionChart data={stats?.charts?.dexDistribution} />}
          </div>
        </div>

        {/* Bridge Breakdown */}
        <div
          className="glass-panel p-5 bg-[#15161C] flex flex-col gap-4 min-h-[320px] justify-between animate-waterfall"
          style={{ animationDelay: "280ms" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bridge Integration Volume
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              USDC bridge deposit inflow channels
            </span>
          </div>
          <div className="flex-1 flex items-center min-h-0 pt-4">
            {loading ? (
              <SkeletonChartPanel height="h-[180px]" />
            ) : (
              <BridgeBarChart data={stats?.charts?.bridgeVolume} />
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap */}
      <div className="animate-waterfall" style={{ animationDelay: "340ms" }}>
        {loading ? (
          <div className="glass-panel p-5 bg-[#15161C]">
            <div className="skeleton skeleton-text w-40 mb-4" />
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 56 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton aspect-square rounded-sm"
                  style={{ animationDelay: `${(i % 7) * 30}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <ActivityHeatmap data={stats?.heatmap} />
        )}
      </div>

      {/* Row 4: Transaction List */}
      <div className="animate-waterfall" style={{ animationDelay: "400ms" }}>
        {loading ? (
          <div className="glass-panel bg-[#15161C]">
            <SkeletonTableRows rows={6} />
          </div>
        ) : (
          <TransactionTable transactions={stats?.transactions || []} />
        )}
      </div>

    </div>
  );
}
