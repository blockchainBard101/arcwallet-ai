"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "./context/AppContext";
import { ArrowRight, ShieldCheck, Compass, BarChart3, Coins, Sparkles, Send, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function LandingPage() {
  const router = useRouter();
  const { connectedWallet, connectWallet } = useApp();
  const [demoInput, setDemoInput] = useState("");
  const [demoChat, setDemoChat] = useState<Array<{ sender: "user" | "agent"; text: string; hasData?: boolean; type?: string }>>([
    {
      sender: "agent",
      text: "Hello! I am BlockGENT. I can analyze any wallet on the Arc blockchain or help you configure autonomous trading agents using the Circle stack. Ask me anything!",
    },
  ]);

  const handleLaunch = () => {
    if (connectedWallet) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const handleDemoSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    const userText = demoInput;
    setDemoChat((prev) => [...prev, { sender: "user", text: userText }]);
    setDemoInput("");

    setTimeout(() => {
      if (userText.toLowerCase().includes("rule") || userText.toLowerCase().includes("create")) {
        setDemoChat((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "I've drafted a new automated rule for your agent based on your intent. Please confirm if these parameters are correct:",
            hasData: true,
            type: "rule",
          },
        ]);
      } else if (userText.toLowerCase().includes("portfolio") || userText.toLowerCase().includes("balance") || userText.toLowerCase().includes("analyze")) {
        setDemoChat((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "Here is the visual balance overview for the queried wallet address. Swaps are heavily dominated by USDC pair-pools:",
            hasData: true,
            type: "chart",
          },
        ]);
      } else {
        setDemoChat((prev) => [
          ...prev,
          {
            sender: "agent",
            text: `I've scanned the Arc L1 network for your request. It appears transaction speeds are currently optimal at 0.8s finality. I can execute operations within these parameters once you connect your wallet.`,
          },
        ]);
      }
    }, 900);
  };

  const chips = [
    "Analyze wallet 0x71C7...976F",
    "Auto-buy EURC if price drops below $1.05",
    "Show USDC bridge volume this week",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden select-none">
      {/* Visual background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Landing Header */}
      <header className="h-20 max-w-[1400px] w-full mx-auto px-6 flex items-center justify-between z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-[#090A0F] border border-neon-blue/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
            <Image src="/blockgent.png" alt="BlockGENT" width={36} height={36} className="object-contain" priority />
          </div>
          <span className="font-bold text-white text-base tracking-tight">BlockGENT <span className="text-neon-cyan text-xs">AI</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <a href="#demo" className="hover:text-slate-200 transition-colors">Interactive Demo</a>
          <a href="#developers" className="hover:text-slate-200 transition-colors">Circle Stack</a>
        </nav>

        <button
          onClick={handleLaunch}
          className="h-10 px-5 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Launch App
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1200px] w-full mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center gap-6 z-10">
        <div className="px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-[10px] text-neon-cyan font-bold tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Native on Arc + Circle Agent Stack
        </div>
        
        <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
          Chat with your wallet. <br className="hidden sm:inline" />
          Command the chain. <span className="text-neon-blue">Own your AI agent.</span>
        </h1>
        
        <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
          The premium intelligence interface and automation suite for the Arc blockchain. Provision Circle Agent Wallets, program natural language guardrails, and access visual DeFi metrics in a unified chat experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          <button
            onClick={handleLaunch}
            className="h-12 px-7 rounded-xl bg-neon-blue text-slate-950 font-bold text-sm cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Launch Core Platform
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="h-12 px-7 rounded-xl border border-[#22252F] bg-[#15161C] text-sm text-slate-300 font-semibold cursor-pointer hover:bg-[#22252F]/50 hover:border-[#22252F] transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4.5 h-4.5 text-neon-cyan" />
            Explore Blockchain Chat
          </button>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="max-w-[950px] w-full mx-auto px-6 py-12 z-10">
        <div className="glass-panel border-[#22252F] bg-[#15161C] overflow-hidden shadow-2xl flex flex-col h-[460px]">
          {/* Header */}
          <div className="h-14 border-b border-[#22252F] bg-[#090A0F]/80 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-xs font-bold text-white">BlockGENT Sandbox</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Simulated LLM Terminal</div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {demoChat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20"
                    : "bg-[#090A0F] border border-[#22252F] overflow-hidden"
                }`}>
                  {msg.sender === "user"
                    ? <User className="w-4.5 h-4.5" />
                    : <Image src="/blockgent.png" alt="BlockGENT" width={32} height={32} className="object-contain" />}
                </div>

                <div className="flex flex-col gap-2">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user" ? "bg-neon-blue/10 text-slate-200 rounded-tr-none" : "bg-[#090A0F]/50 text-slate-300 rounded-tl-none border border-[#22252F]"
                  }`}>
                    {msg.sender === "user" ? (
                      <span>{msg.text}</span>
                    ) : (
                      <div className="prose-agent">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-sm font-bold text-white mb-2 mt-1">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xs font-bold text-white mb-1.5 mt-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-200 mb-1 mt-1.5">{children}</h3>,
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                            em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
                            code: ({ children, className }) => {
                              const isBlock = className?.includes("language-");
                              return isBlock ? (
                                <code className="block bg-[#0a0b10] border border-[#22252F] rounded-lg p-2.5 font-mono text-[9px] text-neon-cyan overflow-x-auto my-2 whitespace-pre">{children}</code>
                              ) : (
                                <code className="bg-[#0a0b10] border border-[#22252F] rounded px-1.5 py-0.5 font-mono text-[9px] text-neon-cyan">{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="my-0">{children}</pre>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-slate-300">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-slate-300">{children}</ol>,
                            li: ({ children }) => <li className="text-xs">{children}</li>,
                            hr: () => <hr className="border-[#22252F] my-2" />,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-neon-blue underline hover:text-neon-cyan transition-colors">{children}</a>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-neon-blue/30 pl-3 italic text-slate-400 my-1">{children}</blockquote>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Simulated widget render */}
                  {msg.hasData && msg.type === "chart" && (
                    <div className="glass-panel p-3.5 border-[#22252F] bg-[#15161C] max-w-sm flex flex-col gap-2 animate-slide-in">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Swap Volume Share</span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-[6px] border-neon-blue border-r-neon-cyan border-b-neon-purple shrink-0" />
                        <div className="flex flex-col text-[11px]">
                          <span className="text-white font-bold">USDC Swaps: 70%</span>
                          <span className="text-slate-400">EURC Swaps: 30%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.hasData && msg.type === "rule" && (
                    <div className="glass-panel p-3.5 border-[#22252F] bg-[#15161C] max-w-sm flex flex-col gap-3 animate-slide-in">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Definition</div>
                      <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
                        <div className="text-white font-medium"><span className="text-neon-blue">IF:</span> EURC price drops below 1.05 USDC</div>
                        <div className="text-white font-medium"><span className="text-neon-cyan">ACTION:</span> Buy 200 EURC from primary wallet</div>
                        <div className="text-slate-500 font-mono text-[9px]">Slippage protection limit: 1%</div>
                      </div>
                      <button
                        onClick={() => {
                          connectWallet();
                          router.push("/onboarding");
                        }}
                        className="py-1.5 px-3 rounded-lg bg-neon-blue text-slate-950 font-bold text-[10px] hover:opacity-90 transition-all cursor-pointer text-center"
                      >
                        Click to Deploy Rule
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chips suggestions */}
          <div className="px-4 py-2 border-t border-[#22252F] bg-[#090A0F] flex gap-2 flex-wrap shrink-0">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDemoInput(chip);
                }}
                className="px-3 py-1 rounded-full border border-[#22252F] bg-[#15161C] text-[10px] text-slate-400 hover:text-white hover:border-[#22252F]/80 cursor-pointer transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <form onSubmit={handleDemoSend} className="p-3 border-t border-[#22252F] bg-[#090A0F] flex items-center gap-2.5 shrink-0">
            <input
              type="text"
              placeholder="Ask the agent to build rules or analyze metrics..."
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              className="flex-1 bg-transparent border-0 text-xs text-white focus:ring-0 focus:outline-none placeholder-slate-500"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-neon-blue flex items-center justify-center text-slate-950 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Feature Matrix */}
      <section id="features" className="max-w-[1200px] w-full mx-auto px-6 py-20 flex flex-col gap-12 z-10 border-t border-[#22252F] mt-12">
        <div className="flex flex-col gap-2 max-w-xl">
          <span className="text-xs font-bold text-neon-blue tracking-widest uppercase">Institutional Analytics</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Built for Circle Agent Wallets & Arc L1</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 border-[#22252F] bg-[#15161C] hover:border-neon-blue/30 transition-all duration-300 flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-neon-blue transition-colors">Circle Agent Stack</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomously manage secure agent wallets under strict spending rules and cryptographic protections native to Circle's infrastructure.
            </p>
          </div>

          <div className="glass-panel p-6 border-[#22252F] bg-[#15161C] hover:border-neon-cyan/30 transition-all duration-300 flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-neon-cyan transition-colors">Risk & Safety Guardian</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define natural language guardrails that verify contract authenticity and prevent unauthorized high-value swaps on the fly.
            </p>
          </div>

          <div className="glass-panel p-6 border-[#22252F] bg-[#15161C] hover:border-neon-purple/30 transition-all duration-300 flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-neon-purple transition-colors">Visual Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extract high-fidelity charts detailing volume spikes, DEX allocations, bridge breakdowns, and daily transactions.
            </p>
          </div>

          <div className="glass-panel p-6 border-[#22252F] bg-[#15161C] hover:border-rose-500/30 transition-all duration-300 flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Sub-Second Finality</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take advantage of Arc L1's high-speed consensus block times and low transaction fee layers for seamless agent actions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#22252F] bg-[#090A0F] py-8 text-center text-xs text-slate-500 z-10">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 BlockGENT. All rights reserved.</span>
          <div className="flex gap-6 font-semibold">
            <a href="#" className="hover:text-slate-300">Docs</a>
            <a href="#" className="hover:text-slate-300">GitHub</a>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
