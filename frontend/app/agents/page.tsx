"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Bot, Plus, Play, Pause, ExternalLink, Zap, TrendingDown, RefreshCw, Bell, MessageSquare, ArrowRight, Copy } from "lucide-react";
import MetricCard from "../components/MetricCard";

const LLM_PROVIDERS = [
  { id: "anthropic", label: "Anthropic", hint: "sk-ant-..." },
  { id: "openai",    label: "OpenAI",    hint: "sk-proj-..." },
  { id: "grok",      label: "Grok",      hint: "xai-..." },
];

const RULE_TEMPLATES = [
  { icon: TrendingDown, label: "Stop-loss",   text: "If my USDC balance drops below 100, pause all swaps and alert me immediately." },
  { icon: RefreshCw,    label: "Auto-compound", text: "Every 24 hours, reinvest any yield above 5 USDC back into the highest-APY pool." },
  { icon: Zap,          label: "Swap trigger", text: "Swap 50 USDC to EURC whenever my USDC balance exceeds 1,000 USDC." },
  { icon: Bell,         label: "Price alert",  text: "Alert me when EURC price drops more than 15% in a single hour." },
];

export default function AgentsPage() {
  const router = useRouter();
  const { agents, rules, addAgent, toggleAgentStatus, triggerToast, isLoadingAgents } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [ruleText, setRuleText] = useState("");

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const modelLabel = LLM_PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
    addAgent(name.trim(), modelLabel, ruleText.trim(), { provider, apiKey });
    
    // Clear states
    setName("");
    setApiKey("");
    setShowKey(false);
    setRuleText("");
    setModalOpen(false);
  };

  // Scoped stats (including EURC converted to USD equivalent ~1.08)
  const totalBalance = agents.reduce((acc, curr) => acc + curr.balance + ((curr.balanceEURC ?? 0) * 1.08), 0);
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
          subtext="USDC/EURC in Circle wallets"
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
        {isLoadingAgents ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col justify-between min-h-[220px] relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#22252F]/40 skeleton shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <div className="skeleton skeleton-text w-32" />
                    <div className="skeleton skeleton-text w-20 opacity-60" style={{ height: "0.65em" }} />
                  </div>
                </div>
                <div className="w-20 h-8 rounded-lg bg-[#22252F]/40 skeleton" />
              </div>
              
              <div className="flex flex-col gap-1 mt-4">
                <div className="skeleton skeleton-text w-16 opacity-60" style={{ height: "0.6em" }} />
                <div className="w-full h-8 rounded-lg bg-[#22252F]/40 skeleton" />
              </div>

              <div className="flex items-end justify-between border-t border-[#22252F] pt-4 mt-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="skeleton skeleton-text w-16 opacity-60" style={{ height: "0.6em" }} />
                    <div className="skeleton skeleton-text w-12" />
                  </div>
                  <div className="flex flex-col gap-1 border-l border-[#22252F] pl-4">
                    <div className="skeleton skeleton-text w-16 opacity-60" style={{ height: "0.6em" }} />
                    <div className="skeleton skeleton-text w-8" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#22252F]/40 skeleton" />
                  <div className="w-24 h-8 rounded-lg bg-[#22252F]/40 skeleton" />
                </div>
              </div>
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-1 md:col-span-2 glass-panel border-[#22252F] bg-[#15161C] p-8 flex flex-col items-center justify-center text-center gap-4 py-12">
            <div className="w-12 h-12 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue animate-pulse">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-white text-sm">No Active Agent Vaults</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                You haven't provisioned any Circle Agent Wallets yet. Use the button in the top right to deploy your first secure automation node.
              </p>
            </div>
          </div>
        ) : (
          agents.map((agent) => {
            const isPaused = agent.status === "paused";
            const agentRules = rules[agent.id] || [];

            return (
              <div
                key={agent.id}
                onClick={() => router.push(`/agents/${agent.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/agents/${agent.id}`)}
                className={`glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 relative overflow-hidden group cursor-pointer hover:border-neon-blue/30 hover:bg-[#15161C]/90 ${
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
                    onClick={(e) => { e.stopPropagation(); toggleAgentStatus(agent.id); }}
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
                  <div className="flex items-center gap-2 bg-[#090A0F]/60 p-2 rounded-lg border border-[#22252F] justify-between relative group/address">
                    <span className="text-[10px] font-mono text-slate-300 truncate select-all pr-8">
                      {agent.wallet}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(agent.wallet);
                        triggerToast?.("Agent wallet address copied!", "info");
                      }}
                      className="p-1 hover:bg-[#22252F] rounded text-slate-500 hover:text-white transition-colors absolute right-2 bg-[#090A0F]/60"
                      title="Copy wallet address"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card bottom: metrics & management controls */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-t border-[#22252F] pt-4 mt-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Vault Balance</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 font-mono text-xs font-bold">
                        <span className="text-white">{agent.balance.toLocaleString()} USDC</span>
                        {!!agent.balanceEURC && agent.balanceEURC > 0 && (
                          <span className="text-neon-cyan">• {agent.balanceEURC.toLocaleString()} EURC</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col border-l border-[#22252F] pl-4">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rules Active</span>
                      <span className="text-sm font-bold text-neon-cyan font-mono mt-0.5">
                        {agentRules.filter(r => r.active).length}/{agentRules.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/agents/${agent.id}/dashboard`); }}
                      className="p-2 rounded-lg bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="View Analytics Dashboard"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/agents/${agent.id}`); }}
                      className="h-8 px-3 rounded-lg bg-neon-blue text-slate-950 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Open Chat
                    </button>
                  </div>
                </div>

                {/* Subtle hover arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <ArrowRight className="w-3.5 h-3.5 text-neon-blue/50" />
                </div>
              </div>
            );
          })
        )}
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

              {/* Natural Language Rule */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Initial Automation Rule <span className="text-slate-600 font-normal normal-case">(optional)</span></label>
                {/* Quick-rule template chips */}
                <div className="flex flex-wrap gap-1.5">
                  {RULE_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setRuleText(t.text)}
                      className={`flex items-center gap-1 px-2.5 h-7 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                        ruleText === t.text
                          ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                          : "border-[#22252F] bg-[#090A0F] text-slate-400 hover:text-slate-200 hover:border-[#2e3140]"
                      }`}
                    >
                      <t.icon className="w-3 h-3" />
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Describe what your agent should do, or pick a template above..."
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  className="p-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 min-h-[72px] leading-relaxed resize-none transition-colors placeholder:text-slate-600"
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
