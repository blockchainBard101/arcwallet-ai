"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Bot, Plus, Play, Pause, Trash2, Cpu, Settings, ExternalLink, Sparkles } from "lucide-react";
import MetricCard from "../components/MetricCard";

export default function AgentsPage() {
  const router = useRouter();
  const { agents, rules, addAgent, toggleAgentStatus } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [model, setModel] = useState("Claude 3.5 Sonnet");
  const [ruleText, setRuleText] = useState("");

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addAgent(name.trim(), model, ruleText.trim());
    
    // Clear states
    setName("");
    setRuleText("");
    setModalOpen(false);
  };

  // Scoped stats
  const totalBalance = agents.reduce((acc, curr) => acc + curr.balance, 0);
  const activeRulesCount = Object.values(rules).reduce((acc, list) => acc + list.filter(r => r.active).length, 0);
  const avgSuccessRate = agents.length > 0 ? (agents.reduce((acc, curr) => acc + curr.successRate, 0) / agents.length).toFixed(1) : "100";

  return (
    <div className="flex flex-col gap-6 select-none relative h-full">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252F] pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight font-sans">My Personal Agents</h1>
          <p className="text-xs text-slate-400">Deploy, pause, and configure rules for autonomous wallets inside Circle's sandbox.</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          Create New Agent
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Total Agent Assets"
          value={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtext="USDC/ARC in Circle wallets"
          sparklineData={[1800, 1920, 2050, 2180, 2292]}
        />
        <MetricCard
          label="Active Automation Rules"
          value={activeRulesCount.toString()}
          subtext="Continuous RPC listeners active"
          sparklineData={[2, 3, 3, 4, 4]}
          isPositive={true}
        />
        <MetricCard
          label="Avg Transaction Success Rate"
          value={`${avgSuccessRate}%`}
          subtext="Simulated execution success"
          sparklineData={[99, 99.2, 99.2, 98.4, 99.2]}
          isPositive={true}
        />
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {agents.map((agent) => {
          const isPaused = agent.status === "paused";
          const agentRules = rules[agent.id] || [];

          return (
            <div
              key={agent.id}
              className={`glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 relative overflow-hidden group hover:border-[#22252F]/80 ${
                isPaused ? "opacity-60" : ""
              }`}
            >
              {/* Card top banner */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isPaused
                      ? "bg-[#090A0F] border-[#22252F] text-slate-500"
                      : "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan glow-cyan"
                  }`}>
                    <Bot className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">{agent.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      {agent.model}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() => toggleAgentStatus(agent.id)}
                  className={`h-8 px-3 rounded-lg border text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-all ${
                    isPaused
                      ? "border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan hover:bg-neon-cyan/10"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" />
                      Pause
                    </>
                  )}
                </button>
              </div>

              {/* Card Mid: Wallet info & balance */}
              <div className="flex flex-col gap-1 mt-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Agent Vault</span>
                <span className="text-[10px] font-mono text-slate-300 bg-[#090A0F]/60 p-2 rounded-lg border border-[#22252F] truncate">
                  {agent.wallet}
                </span>
              </div>

              {/* Card bottom: metrics & management controls */}
              <div className="flex items-end justify-between border-t border-[#22252F] pt-4 mt-4">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Vault Balance</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5">
                      {agent.balance.toLocaleString()} {agent.token}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-[#22252F] pl-4">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rules Active</span>
                    <span className="text-sm font-bold text-neon-cyan font-mono mt-0.5">
                      {agentRules.filter(r => r.active).length}/{agentRules.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/agents/${agent.id}/dashboard`)}
                    className="p-2 rounded-lg bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="View Agent Dashboard"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/agents/${agent.id}`)}
                    className="h-8 px-3 rounded-lg bg-neon-blue text-slate-950 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure Rules
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW AGENT OVERLAY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#090A0F]/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          
          <form
            onSubmit={handleCreateAgentSubmit}
            className="relative glass-panel border-[#22252F] bg-[#15161C] max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-slide-in z-50"
          >
            <div className="flex items-center gap-3 border-b border-[#22252F] pb-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                <Plus className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Deploy Circle Agent Wallet</h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Agent Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agent Identifier (Name)</label>
                <input
                  type="text"
                  placeholder="e.g. Yield Reaper"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  required
                />
              </div>

              {/* Model selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cognitive Engine Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                >
                  <option>Claude 3.5 Sonnet</option>
                  <option>Grok 2.0</option>
                  <option>GPT-4o</option>
                </select>
              </div>

              {/* Rules script text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Natural Language Initial Rule</label>
                <textarea
                  placeholder="e.g. Swap 50 USDC for ARC whenever my USDC balance goes above 1000..."
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  className="p-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 min-h-[70px] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#22252F] hover:bg-[#15161C] text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90"
              >
                Deploy Vault Node
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
