"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import {
  Bot,
  User,
  Send,
  Terminal,
  Play,
  Pause,
  Trash2,
  Sliders,
  TrendingUp,
  CreditCard,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailWorkspace({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const {
    agents,
    rules,
    chats,
    toggleAgentStatus,
    toggleRule,
    deleteRule,
    addChatMessage,
    triggerToast,
  } = useApp();

  const agent = agents.find((a) => a.id === id);
  const agentRules = rules[id] || [];
  const agentMessages = chats[id] || [];

  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Initialize logs
  useEffect(() => {
    if (!agent) return;
    setLogs([
      `[SYSTEM] [${new Date().toLocaleTimeString()}] Cognitive engine ${agent.model} initialized.`,
      `[SYSTEM] [${new Date().toLocaleTimeString()}] Secure bridge connection established to Circle vault ${agent.wallet.slice(0, 10)}...`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Loaded ${agentRules.length} active automation rules.`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Listening for RPC events on Arc L1 blockchain...`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Polling wallet balance. Current status: ${agent.status.toUpperCase()}.`,
    ]);
  }, [agent]);

  // Live log generator simulation
  useEffect(() => {
    if (!agent || agent.status === "paused") return;

    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const randomLogs = [
        `[DAEMON] [${timestamp}] Polled RPC node block #${Math.floor(100000 + Math.random() * 900000)}. Status: OK`,
        `[MONITOR] [${timestamp}] Running rule checks for ${agent.name}...`,
        `[MONITOR] [${timestamp}] Balance verified: ${agent.balance.toLocaleString()} ${agent.token}. Threshold check OK.`,
        `[DAEMON] [${timestamp}] Latency to Arc L1 validator: ${Math.floor(12 + Math.random() * 18)}ms`,
      ];

      // Occasional rule trigger simulation log
      if (Math.random() > 0.8 && agentRules.length > 0) {
        const randomRule = agentRules[Math.floor(Math.random() * agentRules.length)];
        if (randomRule.active) {
          randomLogs.push(
            `[TRIGGER] [${timestamp}] Rule "${randomRule.trigger}" condition evaluated to TRUE.`,
            `[SIMULATE] [${timestamp}] Executed visual compiler test. Result: SUCCESS. Gas simulation: 0.003 ARC.`
          );
        } else {
          randomLogs.push(`[MONITOR] [${timestamp}] Rule [${randomRule.id}] is inactive. Skipping check.`);
        }
      }

      setLogs((prev) => {
        const updated = [...prev, ...randomLogs];
        // Keep last 30 logs
        return updated.slice(-30);
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [agent, agentRules]);

  // Scroll chats and logs to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 select-none">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Agent Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">The requested wallet agent agent ID does not exist.</p>
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

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(agent.wallet);
    setCopied(true);
    triggerToast("Wallet address copied!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    addChatMessage(id, userText, "user");
    setInputValue("");

    // Simulate Agent reply
    setTimeout(() => {
      let replyText = "";
      let customData = null;

      const lowerText = userText.toLowerCase();
      if (lowerText.includes("rebalance") || lowerText.includes("reinvest")) {
        replyText = `Understood. I am starting a rebalance simulation for your vault. I will check the asset pool ratios and execute a test swap.`;
        customData = {
          type: "simulation",
          title: "Simulation Pre-Run",
          details: [
            { label: "Target Ratio", value: "80% USDC / 20% ARC" },
            { label: "Current Balance", value: `${agent.balance} USDC` },
            { label: "Estimated Gas", value: "0.0042 ARC" },
            { label: "Status", value: "Ready to Simulate" },
          ],
          showExecuteButton: true,
        };
      } else if (lowerText.includes("swap") || lowerText.includes("buy") || lowerText.includes("sell")) {
        replyText = `Acknowledged. Simulating a swap request on Arc L1 via Circle's sandbox. Processing trial calculation...`;
        customData = {
          type: "transaction_preview",
          title: "Onchain Swap Simulation",
          details: [
            { label: "Action", value: "Swap 50 USDC for ARC" },
            { label: "Execution Pool", value: "ArcSwap v2 DEX" },
            { label: "Min Received", value: "102.4 ARC" },
            { label: "Gas Estimation", value: "0.0031 ARC" },
          ],
          showExecuteButton: true,
        };
      } else if (lowerText.includes("rule") || lowerText.includes("rules") || lowerText.includes("guardrail")) {
        const activeRules = agentRules.filter((r) => r.active);
        replyText = `I currently have ${agentRules.length} rules configured (${activeRules.length} active). You can view the telemetry panel to toggle them or click 'Manage Rules' to configure custom visual triggers.`;
      } else if (lowerText.includes("balance") || lowerText.includes("vault") || lowerText.includes("usdc")) {
        replyText = `Querying Circle Sandbox secure wallets... Node reports: Vault balance is currently ${agent.balance.toLocaleString()} ${agent.token}. All keys secure.`;
      } else {
        replyText = `Hello! I am ${agent.name}, your automated assistant. I monitor block events and execute custom logic under the guardrails you configure. Type "swap USDC to ARC" or "simulate portfolio rebalance" to run interactive commands.`;
      }

      addChatMessage(id, replyText, "agent", customData);

      // Append to daemon logs
      setLogs((prev) => [
        ...prev,
        `[USER_CMD] [${new Date().toLocaleTimeString()}] Processed command: "${userText}"`,
        `[DAEMON] [${new Date().toLocaleTimeString()}] Sent cognitive reply: "${replyText.slice(0, 50)}..."`,
      ]);
    }, 800); // quick reply simulation
  };

  const handleExecuteSimulatedAction = (actionTitle: string) => {
    triggerToast("Executing simulated transaction...", "info");
    
    // Add transaction to chat logs
    setTimeout(() => {
      addChatMessage(
        id,
        `Simulation successfully executed on Sandbox! The action "${actionTitle}" completed with status: SUCCESS. Transaction hash: 0xSimTx${Math.random().toString(36).substring(2, 10)}`,
        "agent"
      );
      
      setLogs((prev) => [
        ...prev,
        `[TRANSACTION] [${new Date().toLocaleTimeString()}] Executed simulated action "${actionTitle}" on Circle sandboxed wallet.`,
        `[TRANSACTION] [${new Date().toLocaleTimeString()}] Tx confirmed on Arc L1. Status: SUCCESS`,
      ]);
      
      triggerToast("Transaction simulation completed!", "success");
    }, 1200);
  };

  const suggestionChips = [
    "Simulate portfolio rebalance",
    "Swap 50 USDC for ARC",
    "Show active rules logs",
    "Check Circle vault balance",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none h-full relative">
      
      {/* LEFT SIDE: Chat Workspace */}
      <div className="lg:col-span-7 flex flex-col h-[calc(100vh-130px)] min-h-[500px] glass-panel border-[#22252F] bg-[#15161C] overflow-hidden relative">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#22252F] bg-[#090A0F]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue glow-blue">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{agent.name}</span>
                <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Model: {agent.model}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/agents/${agent.id}/dashboard`)}
              className="px-3 py-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-neon-cyan" />
              Agent Analytics
            </button>
            <button
              onClick={() => router.push(`/agents/${agent.id}/rules`)}
              className="px-3 py-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-neon-blue" />
              Manage Rules
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {agentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  isUser
                    ? "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
                    : "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isUser
                      ? "bg-[#090A0F]/80 border-neon-purple/10 text-slate-100 rounded-tr-none"
                      : "bg-[#090A0F]/90 border-[#22252F] text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.text}

                    {/* Interactive payload block */}
                    {msg.data && (
                      <div className="mt-3 p-3 rounded-xl bg-[#090A0F]/70 border border-[#22252F] flex flex-col gap-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {msg.data.title}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {msg.data.details.map((detail: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-0.5 border-r border-[#22252F] last:border-0 pr-2">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">{detail.label}</span>
                              <span className="text-[10px] text-white font-mono font-semibold">{detail.value}</span>
                            </div>
                          ))}
                        </div>

                        {msg.data.showExecuteButton && (
                          <button
                            onClick={() => handleExecuteSimulatedAction(msg.data.title)}
                            type="button"
                            className="mt-1 h-7 rounded-lg bg-neon-blue text-slate-950 font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                          >
                            Execute Sandboxed Tx
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-[8px] text-slate-500 font-mono ${isUser ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions & Input Toolbar */}
        <div className="border-t border-[#22252F] p-4 bg-[#090A0F]/10 shrink-0 flex flex-col gap-3">
          {/* Quick chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputValue(chip)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#22252F] bg-[#15161C] hover:border-neon-blue/20 hover:bg-neon-blue/5 text-[10px] text-slate-400 hover:text-white transition-all cursor-pointer font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Send message to ${agent.name}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 h-11 px-4 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 transition-all"
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-xl bg-neon-blue text-slate-950 font-bold flex items-center justify-center shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Telemetry / Diagnostics */}
      <div className="lg:col-span-5 flex flex-col gap-6 h-[calc(100vh-130px)] min-h-[500px] overflow-y-auto pr-1">
        
        {/* Core telemetry details */}
        <div className="glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#22252F] pb-3.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Vault Registry details</span>
            <button
              onClick={() => toggleAgentStatus(agent.id)}
              className={`h-7 px-3 rounded-lg border text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1 transition-all ${
                agent.status === "paused"
                  ? "border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan hover:bg-neon-cyan/10"
                  : "border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
              }`}
            >
              {agent.status === "paused" ? (
                <>
                  <Play className="w-2.5 h-2.5" />
                  Resume Agent
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5" />
                  Pause Agent
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Sandbox Wallet Address</span>
            <div className="flex items-center gap-2 bg-[#090A0F]/60 p-2.5 rounded-xl border border-[#22252F]">
              <span className="text-[10px] font-mono text-slate-300 truncate flex-1">{agent.wallet}</span>
              <button
                onClick={handleCopyWallet}
                className="p-1 rounded bg-[#15161C] border border-[#22252F] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Wallet Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={`https://explorer.arc.network/address/${agent.wallet}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-[#15161C] border border-[#22252F] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="View on Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick numbers grid */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-3.5 rounded-xl bg-[#090A0F]/40 border border-[#22252F] flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vault Balance</span>
              <span className="text-sm font-extrabold text-white font-mono">
                {agent.balance.toLocaleString()} {agent.token}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090A0F]/40 border border-[#22252F] flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Automated Rules</span>
              <span className="text-sm font-extrabold text-neon-cyan font-mono">
                {agentRules.filter((r) => r.active).length} / {agentRules.length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090A0F]/40 border border-[#22252F] flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Simulation Success</span>
              <span className="text-sm font-extrabold text-emerald-500 font-mono">
                {agent.successRate}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090A0F]/40 border border-[#22252F] flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Gas spent (sandbox)</span>
              <span className="text-sm font-extrabold text-neon-purple font-mono">
                {agent.gasSpent} ARC
              </span>
            </div>
          </div>
        </div>

        {/* Configured Rules Overview */}
        <div className="glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#22252F] pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-neon-blue" />
              Active Trigger Rules
            </span>
            <button
              onClick={() => router.push(`/agents/${agent.id}/rules`)}
              className="text-[9px] font-bold text-neon-blue hover:text-neon-cyan tracking-wider uppercase transition-colors cursor-pointer"
            >
              Manage Rules &rarr;
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-56 overflow-y-auto">
            {agentRules.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-[10px] text-slate-500">No automation rules configured.</span>
              </div>
            ) : (
              agentRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-opacity ${
                    rule.active ? "bg-[#090A0F]/60 border-[#22252F]" : "bg-[#090A0F]/20 border-[#22252F] opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold font-mono text-neon-cyan bg-neon-cyan/5 px-2 py-0.5 rounded border border-neon-cyan/15">
                      {rule.trigger}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={() => toggleRule(agent.id, rule.id)}
                        type="button"
                        className={`p-1 rounded hover:bg-[#22252F] transition-colors cursor-pointer text-slate-400 hover:text-white`}
                        title={rule.active ? "Pause Rule" : "Activate Rule"}
                      >
                        {rule.active ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                      <button
                        onClick={() => deleteRule(agent.id, rule.id)}
                        type="button"
                        className="p-1 rounded hover:bg-[#22252F] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-normal">{rule.text}</p>

                  <div className="flex items-center justify-between border-t border-[#22252F] pt-2 mt-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Last Triggered</span>
                    <span className="text-[9px] font-mono text-slate-400">{rule.lastTriggered}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Daemon Log Monitor console */}
        <div className="glass-panel border-[#22252F] bg-[#090A0F]/80 p-4 flex flex-col gap-3 flex-1 min-h-[180px]">
          <div className="flex items-center justify-between border-b border-[#22252F] pb-2 shrink-0">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-neon-cyan shrink-0 animate-pulse" />
              Daemon Logger (Sandbox Node)
            </span>
            <button
              onClick={() => {
                setLogs((prev) => [
                  ...prev,
                  `[SYSTEM] [${new Date().toLocaleTimeString()}] Terminal cleared by user. Listening...`,
                ]);
              }}
              className="text-[9px] text-slate-500 hover:text-slate-300 font-mono uppercase cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto font-mono text-[9px] text-emerald-500/90 leading-relaxed flex flex-col gap-1 pr-1"
          >
            {logs.map((log, idx) => {
              let colorClass = "text-emerald-500/80";
              if (log.includes("[SYSTEM]")) colorClass = "text-neon-blue/80";
              if (log.includes("[TRIGGER]")) colorClass = "text-amber-400 font-semibold";
              if (log.includes("[TRANSACTION]")) colorClass = "text-neon-purple font-semibold";
              if (log.includes("[USER_CMD]")) colorClass = "text-white";

              return (
                <div key={idx} className={`${colorClass} whitespace-pre-wrap break-all`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
