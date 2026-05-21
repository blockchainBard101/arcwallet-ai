"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import {
  Bot,
  Sliders,
  Play,
  CheckCircle,
  HelpCircle,
  Plus,
  Terminal,
  ArrowLeft,
  Settings,
  Sparkles,
  Zap,
  Code,
  Shield,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentRulesConsole({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const { agents, rules, addRule, triggerToast } = useApp();
  const agent = agents.find((a) => a.id === id);

  // Mode Selection: 'visual' or 'nlp'
  const [mode, setMode] = useState<"visual" | "nlp">("visual");

  // Visual Builder form states
  const [triggerType, setTriggerType] = useState("Balance Threshold");
  const [conditionField, setConditionField] = useState("USDC Balance");
  const [conditionOperator, setConditionOperator] = useState(">");
  const [conditionValue, setConditionValue] = useState("1000");
  const [actionType, setActionType] = useState("Swap Assets");
  const [actionDetail, setActionDetail] = useState("Swap 100 USDC to ARC");

  // NLP form states
  const [nlpText, setNlpText] = useState("");
  const [nlpParsing, setNlpParsing] = useState(false);
  const [nlpParsedResult, setNlpParsedResult] = useState<{
    trigger: string;
    action: string;
    text: string;
    valid: boolean;
  } | null>(null);

  // Simulator states
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simCompleted, setSimCompleted] = useState(false);

  // Reset simulator when agent details change
  useEffect(() => {
    if (!agent) return;
    setSimulatorLogs([
      `[SIMULATOR] Scoped to sandbox wallet: ${agent.wallet}`,
      `[SIMULATOR] Status: Ready. Configure a rule to simulate.`,
    ]);
  }, [agent]);

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
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-all font-semibold cursor-pointer"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  // Compile visual elements into text format
  const getCompiledRuleText = () => {
    return `If ${conditionField} is ${conditionOperator} ${conditionValue}, then execute action: ${actionDetail}.`;
  };

  // Run Rule Simulation Compiler
  const handleRunSimulation = (ruleText: string, trigger: string, action: string) => {
    setSimulating(true);
    setSimCompleted(false);
    setSimulatorLogs([
      `[COMPILER] [0.00s] Parsing rule script: "${ruleText}"`,
      `[COMPILER] [0.05s] Token verification passed. Schema matches standard DSL.`,
      `[COMPILER] [0.12s] Target contract interfaces loaded: Circle Wallet Safe`,
      `[SIMULATION] [0.20s] Fetching mockup state from Arc RPC network...`,
      `[SIMULATION] [0.35s] Wallet balance set to 1,500 USDC / 1,200 ARC.`,
      `[SIMULATION] [0.50s] Evaluating condition: ${trigger} => TRUE`,
      `[SIMULATION] [0.65s] Simulating Action: ${action} on Sandbox.`,
      `[SIMULATION] [0.80s] Executing mock router swap contract: ArcSwapRouter.sol`,
      `[SIMULATION] [0.95s] Gas usage: 0.00315 ARC. Transaction status: SIM_SUCCESS`,
      `[SIMULATOR] Simulation completed successfully! The rule is safe to deploy.`,
    ]);

    setTimeout(() => {
      setSimulating(false);
      setSimCompleted(true);
    }, 1200);
  };

  // Deploy Rule
  const handleDeployRule = (e: React.FormEvent) => {
    e.preventDefault();
    let finalRuleText = "";
    let finalTrigger = "";
    let finalAction = "";

    if (mode === "visual") {
      finalRuleText = getCompiledRuleText();
      finalTrigger = `${conditionField} (${conditionOperator} ${conditionValue})`;
      finalAction = actionDetail;
    } else {
      if (!nlpParsedResult || !nlpParsedResult.valid) {
        triggerToast("Please parse and validate the rule script first.", "error");
        return;
      }
      finalRuleText = nlpParsedResult.text;
      finalTrigger = nlpParsedResult.trigger;
      finalAction = nlpParsedResult.action;
    }

    addRule(agent.id, finalRuleText, finalTrigger, finalAction);
    
    // Clear forms & redirect
    setNlpText("");
    setNlpParsedResult(null);
    setSimCompleted(false);
    router.push(`/agents/${agent.id}`);
  };

  // Parse NLP rule
  const handleNLPParse = () => {
    if (!nlpText.trim()) return;
    setNlpParsing(true);

    setTimeout(() => {
      const txt = nlpText.trim().toLowerCase();
      let trigger = "Custom Trigger";
      let action = "Custom Action";
      let valid = true;

      // Basic keyword mapping simulation
      if (txt.includes("balance") || txt.includes("usdc") || txt.includes("greater than")) {
        trigger = "Balance (> 1000 USDC)";
      } else if (txt.includes("price") || txt.includes("drop") || txt.includes("under")) {
        trigger = "Price Oracle Check";
      } else {
        trigger = "Block Event Monitor";
      }

      if (txt.includes("swap") || txt.includes("buy") || txt.includes("reinvest")) {
        action = "Swap Asset Allocation";
      } else if (txt.includes("alert") || txt.includes("notify") || txt.includes("ping")) {
        action = "Push Alert / Webhook";
      } else {
        action = "Sandbox Contract Call";
      }

      setNlpParsedResult({
        text: nlpText,
        trigger,
        action,
        valid,
      });
      setNlpParsing(false);
      triggerToast("Natural Language parsed. Simulation ready.", "success");

      // Auto load simulator logs
      setSimulatorLogs([
        `[NLP_PARSER] Detected Trigger: "${trigger}"`,
        `[NLP_PARSER] Detected Action: "${action}"`,
        `[SIMULATOR] Ready to run dry-run verification.`,
      ]);
    }, 800);
  };

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
              <Sliders className="w-5 h-5 text-neon-blue" />
              Guardrail Rules Builder
            </h1>
            <p className="text-xs text-slate-400">Configure automated logic triggers on your Circle sandbox wallet.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#15161C] p-1 rounded-xl border border-[#22252F]">
          <button
            onClick={() => setMode("visual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "visual" ? "bg-neon-blue text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Visual Blocks
          </button>
          <button
            onClick={() => setMode("nlp")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "nlp" ? "bg-neon-blue text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            NL Script
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Builder Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form onSubmit={handleDeployRule} className="glass-panel bg-[#15161C] p-6 flex flex-col gap-5">
            
            <div className="flex items-center gap-2.5 border-b border-[#22252F] pb-3">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">Target Agent Node</span>
                <span className="text-[10px] text-slate-400 font-mono">{agent.name} ({agent.model})</span>
              </div>
            </div>

            {/* VISUAL BUILDER MODE */}
            {mode === "visual" && (
              <div className="flex flex-col gap-4">
                
                {/* Rule trigger group */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trigger Class</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option>Balance Threshold</option>
                    <option>Price Deviation</option>
                    <option>Cron Scheduler</option>
                    <option>Gas Metric Alert</option>
                  </select>
                </div>

                {/* Condition setup fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Condition Field</label>
                    <select
                      value={conditionField}
                      onChange={(e) => setConditionField(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                    >
                      <option>USDC Balance</option>
                      <option>ARC Balance</option>
                      <option>ARC Oracle Price</option>
                      <option>RPC Gas Limit</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operator</label>
                    <select
                      value={conditionOperator}
                      onChange={(e) => setConditionOperator(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                    >
                      <option>&gt;</option>
                      <option>&lt;</option>
                      <option>==</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trigger Value</label>
                    <input
                      type="text"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                    />
                  </div>
                </div>

                {/* Action builder */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Action Type</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                    >
                      <option>Swap Assets</option>
                      <option>Send Alert</option>
                      <option>Transfer USDC</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Action Parameters</label>
                    <input
                      type="text"
                      value={actionDetail}
                      onChange={(e) => setActionDetail(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                    />
                  </div>
                </div>

                {/* Compiled string preview */}
                <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] mt-2 flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Compiled DSL Script Preview</span>
                  <span className="text-xs font-mono text-neon-blue break-words">{getCompiledRuleText()}</span>
                </div>

              </div>
            )}

            {/* NLP MODE */}
            {mode === "nlp" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Natural Language Script Prompt</label>
                  <textarea
                    placeholder="e.g. If ARC price drops below 0.35 USDC, then auto-swap 150 USDC to buy ARC and alert my dashboard..."
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    className="p-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white min-h-[120px] focus:outline-none focus:border-neon-blue/50 leading-relaxed"
                  />
                </div>

                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-slate-500">Press parse to compile script keywords into state models.</span>
                  <button
                    type="button"
                    onClick={handleNLPParse}
                    disabled={nlpParsing || !nlpText.trim()}
                    className="h-8 px-4 rounded-lg bg-[#15161C] border border-[#22252F] hover:bg-[#22252F] text-[10px] font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {nlpParsing ? "Analyzing Script..." : "Compile Script"}
                  </button>
                </div>

                {nlpParsedResult && (
                  <div className="p-4 rounded-xl bg-[#090A0F]/90 border border-[#22252F] flex flex-col gap-3 animate-slide-in">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Parser Compilation Success
                    </span>
                    <div className="grid grid-cols-2 gap-3 border-t border-b border-[#22252F] py-2.5 my-0.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Extracted Trigger</span>
                        <span className="text-[10px] font-semibold text-white font-mono">{nlpParsedResult.trigger}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Extracted Action</span>
                        <span className="text-[10px] font-semibold text-white font-mono">{nlpParsedResult.action}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Structured Script Result</span>
                      <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-[#090A0F] p-2.5 rounded border border-[#22252F]">{nlpParsedResult.text}</p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-3 mt-4 border-t border-[#22252F] pt-4">
              <button
                type="button"
                onClick={() => {
                  const ruleTxt = mode === "visual" ? getCompiledRuleText() : (nlpParsedResult?.text || nlpText);
                  const trig = mode === "visual" ? `${conditionField} (${conditionOperator} ${conditionValue})` : (nlpParsedResult?.trigger || "NLP Trigger");
                  const act = mode === "visual" ? actionDetail : (nlpParsedResult?.action || "NLP Action");
                  handleRunSimulation(ruleTxt, trig, act);
                }}
                className="h-10 px-5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan hover:bg-neon-cyan/10 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                Run Simulator
              </button>
              <button
                type="submit"
                disabled={!simCompleted}
                className="h-10 px-6 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Deploy visual guardrail
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: Simulator Terminal */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[480px]">
          <div className="glass-panel bg-[#15161C] p-5 flex flex-col gap-4 flex-1 h-full select-none justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#22252F] pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Terminal className="w-4 h-4 text-neon-cyan animate-pulse" />
                  Compiler Simulator Console
                </span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  simCompleted
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : simulating
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                    : "bg-[#22252F] text-slate-400 border border-[#22252F]"
                }`}>
                  {simCompleted ? "Ready to Deploy" : simulating ? "Simulating..." : "Idle"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-[10px] text-slate-300 leading-relaxed overflow-y-auto max-h-[380px] pr-1">
                {simulatorLogs.map((log, idx) => {
                  let logClass = "text-slate-400";
                  if (log.includes("[COMPILER]")) logClass = "text-neon-blue";
                  if (log.includes("[SIMULATION]")) logClass = "text-neon-cyan";
                  if (log.includes("completed successfully") || log.includes("SUCCESS")) logClass = "text-emerald-400 font-bold";
                  if (log.includes("[NLP_PARSER]")) logClass = "text-neon-purple";

                  return (
                    <div key={idx} className={`${logClass} whitespace-pre-wrap`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#22252F] pt-4 flex flex-col gap-3 mt-4">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#15161C] border border-[#22252F] text-[10px] text-slate-400 leading-normal">
                <Shield className="w-4.5 h-4.5 text-neon-cyan shrink-0 mt-0.5" />
                <p>
                  Circle sandbox guardrails are simulated before publication to prevent transaction failures, gas exhaustion, or logic loops. Running a simulator is required before deploying.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
