"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import MetricCard from "../components/MetricCard";
import { DexDistributionChart } from "../components/CustomCharts";
import { Wallet, Bot, ArrowRight, LayoutDashboard, Settings, ExternalLink, HelpCircle } from "lucide-react";

export default function PortfolioPage() {
  const router = useRouter();
  const { connectedWallet, agents, searchWallet } = useApp();

  // Combine Connected Wallet balance + Agents balances
  const userBalanceUSDC = connectedWallet ? connectedWallet.balanceUSDC : 12531.79;
  const userBalanceEURC = connectedWallet ? connectedWallet.balanceEURC : 842.15;
  const eurcUSDValue = 1.09; // EURC token value mock
  
  const primaryVal = userBalanceUSDC + userBalanceEURC * eurcUSDValue;
  
  const agentsVal = agents.reduce((acc, curr) => {
    const val = curr.token === "USDC" ? curr.balance : curr.balance * eurcUSDValue;
    return acc + val;
  }, 0);

  const totalPortfolioValue = primaryVal + agentsVal;

  const handleInspectWallet = (address: string) => {
    searchWallet(address);
    router.push("/dashboard");
  };

  // Portfolio allocation assets data
  const allocationData = [
    { 
      name: "USDC (Stable)", 
      value: totalPortfolioValue > 0 
        ? Math.round(((userBalanceUSDC + agents.filter(a => a.token === "USDC").reduce((acc, c) => acc + c.balance, 0)) / totalPortfolioValue) * 100) 
        : 0, 
      color: "#F97316" 
    },
    { 
      name: "EURC (Stable)", 
      value: totalPortfolioValue > 0 
        ? Math.round((((userBalanceEURC + agents.filter(a => a.token === "EURC").reduce((acc, c) => acc + c.balance, 0)) * eurcUSDValue) / totalPortfolioValue) * 100) 
        : 0, 
      color: "#ADF02F" 
    },
  ];

  // If sum doesn't hit 100 due to rounding, force adjustment
  const sumPercent = allocationData.reduce((acc, c) => acc + c.value, 0);
  if (sumPercent < 100 && sumPercent > 0) {
    allocationData[0].value += (100 - sumPercent);
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[#22252F] pb-5">
        <h1 className="text-xl font-extrabold text-white tracking-tight">Portfolio Overview</h1>
        <p className="text-xs text-slate-400">Consolidated analytics and allocations across connected Web3 wallets and personal AI agents.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Total Aggregated Value"
          value={`$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+6.14%"
          isPositive={true}
          subtext="Connected + Agent Wallets"
          sparklineData={[13200, 13600, 13400, 13900, 14200, 14820]}
        />
        <MetricCard
          label="Primary Wallet Balance"
          value={`$${primaryVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+4.2%"
          isPositive={true}
          subtext="MetaMask Node"
          sparklineData={[11200, 11400, 11900, 11600, 12100, 12943]}
        />
        <MetricCard
          label="Managed Agent Holdings"
          value={`$${agentsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+18.9%"
          isPositive={true}
          subtext="Circle Vault Wallets"
          sparklineData={[1200, 1400, 1500, 1650, 1862]}
        />
      </div>

      {/* Grid Allocation & Wallet registry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Allocation Breakdowns */}
        <div className="glass-panel p-5 border-[#22252F] bg-[#15161C] lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Allocation</span>
            <span className="text-[10px] text-slate-500 font-mono">Token weighting across entire platform</span>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            <DexDistributionChart 
              data={allocationData} 
              centerLabel="Total Assets" 
              centerValue={totalPortfolioValue > 0 ? "100%" : "0%"} 
            />
          </div>
        </div>

        {/* Right: Wallets Registry list */}
        <div className="glass-panel p-5 border-[#22252F] bg-[#15161C] lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 border-b border-[#22252F] pb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Registries</span>
            <span className="text-[10px] text-slate-500 font-mono">List of active vault nodes and signatures</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Primary User Wallet */}
            <div className="p-4 rounded-xl border border-[#22252F] bg-[#090A0F]/40 hover:border-[#22252F]/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">Primary Connected Wallet</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {connectedWallet ? connectedWallet.address : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex flex-col text-right font-mono text-xs">
                  <span className="text-white font-bold">${userBalanceUSDC.toLocaleString()} USDC</span>
                  <span className="text-[10px] text-slate-400">{userBalanceEURC.toLocaleString()} EURC</span>
                </div>
                <button
                  onClick={() => handleInspectWallet(connectedWallet ? connectedWallet.address : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")}
                  className="px-3.5 py-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-neon-cyan" />
                  View Dashboard
                </button>
              </div>
            </div>

            {/* Agent Wallets */}
            {agents.map((agent) => {
              const valUSD = agent.token === "USDC" ? agent.balance : agent.balance * eurcUSDValue;
              return (
                <div key={agent.id} className="p-4 rounded-xl border border-[#22252F] bg-[#090A0F]/40 hover:border-[#22252F]/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{agent.name} (Circle Agent)</span>
                      <span className="text-[10px] font-mono text-slate-500">{agent.wallet}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="flex flex-col text-right font-mono text-xs">
                      <span className="text-white font-bold">
                        ${agent.balance.toLocaleString()} {agent.token}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ~${valUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/agents/${agent.id}`)}
                        className="px-3.5 py-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-neon-blue" />
                        Manage Rules
                      </button>
                      <button
                        onClick={() => handleInspectWallet(agent.wallet)}
                        className="p-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-slate-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
