"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, Activity } from "../../../context/AppContext";
import {
  Bot,
  TrendingUp,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
  HelpCircle,
} from "lucide-react";
import MetricCard from "../../../components/MetricCard";
import {
  VolumeTrendChart,
  DexDistributionChart,
  BridgeBarChart,
} from "../../../components/CustomCharts";
import TransactionTable from "../../../components/TransactionTable";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDashboardPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { agents, rules, activityLog } = useApp();
  const agent = agents.find((a) => a.id === id);

  const [activeMetricTab, setActiveMetricTab] = useState<"volume" | "gas">("volume");

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 select-none">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Agent Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">The requested agent ID does not exist.</p>
        </div>
        <button
          onClick={() => router.push("/agents")}
          className="px-4 py-2 rounded-xl bg-[#15161C] border border-[#22252F] text-xs text-white hover:bg-[#22252F] transition-all font-semibold cursor-pointer"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  const agentRules = rules[id] || [];

  // Scoped activity logs
  const scopedActivity = activityLog.filter(
    (act) => act.wallet.toLowerCase() === agent.wallet.toLowerCase()
  );

  // If there are no activities in context, generate mock logs scoped to this agent
  const fallbackActivity: Activity[] = [
    {
      id: `act-1-${id}`,
      type: "rule_trigger",
      title: "Rule Executed: Auto-Reinvest",
      description: `${agent.name} swapped 100 USDC for 204.5 ARC successfully.`,
      wallet: agent.wallet,
      status: "success",
      value: "100.00 USDC",
      timestamp: "2026-05-20 14:32",
    },
    {
      id: `act-2-${id}`,
      type: "swap",
      title: "Sandbox Swap",
      description: `Swapped 50 USDC for 102.5 ARC.`,
      wallet: agent.wallet,
      status: "success",
      value: "50.00 USDC",
      timestamp: "2026-05-18 10:15",
    },
    {
      id: `act-3-${id}`,
      type: "transfer",
      title: "Rebalance Top-up",
      description: `Circle vault topped up from primary wallet.`,
      wallet: agent.wallet,
      status: "success",
      value: "250.00 USDC",
      timestamp: "2026-05-15 16:40",
    },
  ];

  const transactionData = scopedActivity.length > 0 ? scopedActivity : fallbackActivity;

  // Mock scoped charts datasets based on agent
  const isAgent1 = id === "agent-1";
  const volumeData = isAgent1
    ? [
        { date: "May 15", value: 120 },
        { date: "May 16", value: 240 },
        { date: "May 17", value: 180 },
        { date: "May 18", value: 420 },
        { date: "May 19", value: 290 },
        { date: "May 20", value: 600 },
        { date: "May 21", value: 450 },
      ]
    : [
        { date: "May 15", value: 80 },
        { date: "May 16", value: 140 },
        { date: "May 17", value: 95 },
        { date: "May 18", value: 310 },
        { date: "May 19", value: 190 },
        { date: "May 20", value: 480 },
        { date: "May 21", value: 320 },
      ];

  const gasData = [
    { date: "May 15", value: 12 },
    { date: "May 16", value: 24 },
    { date: "May 17", value: 15 },
    { date: "May 18", value: 38 },
    { date: "May 19", value: 22 },
    { date: "May 20", value: 55 },
    { date: "May 21", value: 41 },
  ];

  const dexData = isAgent1
    ? [
        { name: "Uniswap V3", value: 70, color: "#ADF02F" },
        { name: "Balancer", value: 30, color: "#6366F1" },
      ]
    : [
        { name: "Curve", value: 50, color: "#F97316" },
        { name: "Balancer", value: 30, color: "#6366F1" },
        { name: "Others", value: 20, color: "#64748B" },
      ];

  const bridgeData = [
    { name: "Circle CCTP", value: 1250 },
    { name: "Arc Native", value: 890 },
  ];

  return (
    <div className="flex flex-col gap-6 select-none relative h-full">
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-[#22252F] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="p-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
              Agent performance metrics
            </h1>
            <p className="text-xs text-slate-400">Scoped telemetry and transaction metrics for {agent.name}.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 bg-[#15161C] p-2 rounded-lg border border-[#22252F]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Circle Sandbox: 2026-05-15 to 2026-05-21
          </span>
        </div>
      </div>

      {/* Scoped Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <MetricCard
          label="Vault Balance"
          value={`${agent.balance.toLocaleString()} ${agent.token}`}
          subtext="Available sandbox reserves"
          sparklineData={[1320, 1350, 1310, 1390, 1450]}
        />
        <MetricCard
          label="Simulation Success Rate"
          value={`${agent.successRate}%`}
          subtext="Simulated execution success"
          sparklineData={[99, 99, 99, 98, 98.4]}
          isPositive={true}
        />
        <MetricCard
          label="Active Guardrails"
          value={agentRules.filter((r) => r.active).length.toString()}
          subtext="Continuous active scripts"
          sparklineData={[1, 2, 2, 3, 3]}
          isPositive={true}
        />
        <MetricCard
          label="Gas Spent (Sandbox)"
          value={`${agent.gasSpent} ARC`}
          subtext="Mock L1 RPC execution cost"
          sparklineData={[0.2, 0.45, 0.6, 0.95, 1.25]}
        />
      </div>

      {/* Scoped Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Scoped Trend Chart */}
        <div className="lg:col-span-8 glass-panel bg-[#15161C] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#22252F] pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-neon-cyan" />
              Historical execution Volume
            </span>
            
            <div className="flex items-center gap-1 bg-[#15161C] p-1 rounded-lg border border-[#22252F]">
              <button
                onClick={() => setActiveMetricTab("volume")}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md cursor-pointer transition-colors ${
                  activeMetricTab === "volume"
                    ? "bg-neon-blue text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Volume (USDC)
              </button>
              <button
                onClick={() => setActiveMetricTab("gas")}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md cursor-pointer transition-colors ${
                  activeMetricTab === "gas"
                    ? "bg-neon-blue text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Gas Fee (Gwei)
              </button>
            </div>
          </div>

          <div className="h-64 mt-2">
            <VolumeTrendChart data={activeMetricTab === "volume" ? volumeData : gasData} />
          </div>
        </div>

        {/* Scoped Donut Chart */}
        <div className="lg:col-span-4 glass-panel bg-[#15161C] p-5 flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              DEX Swap Allocations
            </span>
            <span className="text-[10px] text-slate-500 font-mono">DEX volume distribution for agent swaps</span>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <DexDistributionChart data={dexData} />
          </div>
        </div>

      </div>

      {/* Scoped Transactions Table */}
      <div className="mt-2">
        <TransactionTable transactions={transactionData} />
      </div>

    </div>
  );
}
