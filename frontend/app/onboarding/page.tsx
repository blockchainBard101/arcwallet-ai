"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Wallet, Bot, Cpu, Play, CheckCircle2, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { connectedWallet, connectWallet, addAgent } = useApp();

  const [step, setStep] = useState<number>(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Agent Wizard Form States
  const [agentName, setAgentName] = useState("Alpha Scout");
  const [agentModel, setAgentModel] = useState("Claude 3.5 Sonnet");
  const [selectedTemplate, setSelectedTemplate] = useState("yield");
  const [customRule, setCustomRule] = useState("");

  const templates = [
    {
      id: "yield",
      title: "DeFi Yield Accumulator",
      description: "Auto-reinvest USDC into yield farming pools and rebalance assets weekly.",
      ruleText: "Swap surplus USDC into yield positions when USDC balance is > 1000.",
    },
    {
      id: "buy",
      title: "Buy the Dip Strategy",
      description: "Trigger buy orders automatically if ARC price drops below target values.",
      ruleText: "Buy 100 ARC with USDC if price of ARC falls below 0.40 USDC.",
    },
    {
      id: "alert",
      title: "Whale Alert & Guardrail",
      description: "Send push and email notifications if large outflows are initiated.",
      ruleText: "Send email alert if transfer exceeds 500 USDC from wallet.",
    },
    {
      id: "custom",
      title: "Custom Strategy",
      description: "Write your own automated rules in plain English.",
      ruleText: "",
    },
  ];

  const handleSimulateConnection = () => {
    setIsConnecting(true);
    setTimeout(() => {
      connectWallet();
      setIsConnecting(false);
      setStep(3); // Advance to agent wizard
    }, 1500);
  };

  const handleDeployAgent = () => {
    setIsDeploying(true);
    setTimeout(() => {
      // Find rule text
      const tmpl = templates.find((t) => t.id === selectedTemplate);
      const ruleText = selectedTemplate === "custom" ? customRule : (tmpl ? tmpl.ruleText : "");
      
      // Add agent to global context
      addAgent(agentName, agentModel, ruleText);
      
      setIsDeploying(false);
      setStep(4); // Advance to completion screen
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 relative min-h-screen bg-background">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Progress Header */}
      <div className="max-w-md w-full mb-10 flex items-center justify-between z-10">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Setup Progress</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-7 h-1.5 rounded-full transition-all duration-300 ${
                step >= num ? "bg-neon-cyan glow-cyan" : "bg-[#22252F]"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass-panel border-[#22252F] bg-[#15161C] max-w-lg w-full p-8 shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="flex flex-col gap-5 text-center items-center animate-slide-in">
            <div className="w-14 h-14 rounded-2xl bg-neon-blue flex items-center justify-center text-slate-950">
              <Sparkles className="w-7 h-7" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome to ArcWallet AI</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Get started by setting up your workspace. We will connect your Web3 wallet and provision your first automated Circle wallet agent.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-4 py-3 px-6 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Onboarding Setup
              <Play className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: CONNECT WALLET */}
        {step === 2 && (
          <div className="flex flex-col gap-5 text-center items-center animate-slide-in">
            <div className="w-14 h-14 rounded-2xl bg-[#15161C] border border-[#22252F] flex items-center justify-center text-slate-300 shrink-0">
              <Wallet className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Connect Primary Wallet</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                To interact with the Arc blockchain, we require connection to a Web3 wallet (e.g. MetaMask, Coinbase). No gas fees will be charged for connecting.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={handleSimulateConnection}
                disabled={isConnecting}
                className="w-full py-3 px-4 rounded-xl border border-[#22252F] bg-[#090A0F] hover:bg-[#15161C] transition-colors flex items-center justify-center gap-2.5 cursor-pointer text-xs font-bold text-slate-200"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neon-blue" />
                    Connecting MetaMask...
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 text-[10px] font-bold">M</div>
                    Connect MetaMask
                  </>
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 px-4 rounded-xl border border-transparent text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CREATE FIRST AGENT */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-slide-in">
            <div className="flex items-center gap-4 border-b border-[#22252F] pb-4">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-extrabold text-white tracking-tight">Create Personal Agent</h2>
                <span className="text-[10px] text-slate-400 font-medium">Step 3 of 4: Agent Configuration</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Agent Name & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cognitive Model</label>
                  <select
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option>Claude 3.5 Sonnet</option>
                    <option>Grok 2.0</option>
                    <option>GPT-4o</option>
                  </select>
                </div>
              </div>

              {/* Automation Rules Templates */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Automation Rules</label>
                <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`text-left p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                        selectedTemplate === tmpl.id
                          ? "border-neon-cyan/40 bg-neon-cyan/5 text-white"
                          : "border-[#22252F] bg-[#090A0F]/40 text-slate-400 hover:border-[#22252F]/80"
                      }`}
                    >
                      <span className={`font-bold text-xs ${selectedTemplate === tmpl.id ? "text-neon-cyan" : "text-slate-200"}`}>
                        {tmpl.title}
                      </span>
                      <span className="text-[10px] leading-relaxed text-slate-400">{tmpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Rule Input */}
              {selectedTemplate === "custom" && (
                <div className="flex flex-col gap-1.5 animate-slide-in">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">English Language Rule</label>
                  <textarea
                    placeholder="Example: Auto-transfer 5 USDC to 0xabc... every Friday at 12pm..."
                    value={customRule}
                    onChange={(e) => setCustomRule(e.target.value)}
                    className="p-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 min-h-[60px]"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleDeployAgent}
              disabled={isDeploying}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isDeploying ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Provisioning Circle Agent Wallet...
                </>
              ) : (
                <>
                  Deploy AI Agent Wallet
                  <Play className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 4: COMPLETE */}
        {step === 4 && (
          <div className="flex flex-col gap-5 text-center items-center animate-slide-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Onboarding Completed!</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Your primary wallet has been linked. We've created the Circle Agent Wallet and activated your target automation rules script successfully.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 w-full py-3 px-4 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Dashboard Explorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
