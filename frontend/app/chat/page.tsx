"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { usePrivy } from "@privy-io/react-auth";
import { Send, User, Bot, HelpCircle, LayoutDashboard, Wallet, Compass, Search, ExternalLink } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { chats, addChatMessage, searchWallet, clearChat, connectedWallet, recentExplorations } = useApp();
  const { getAccessToken } = usePrivy();
  const [inputText, setInputText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const thread = chats["public"] || [];

  const userAddress = connectedWallet?.address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

  const recentSearches = recentExplorations.length > 0 ? recentExplorations : [userAddress];

  const suggestedPrompts = [
    { label: connectedWallet ? "Analyze my wallet" : "Analyze default wallet", text: `Analyze wallet ${userAddress}` },
    { label: "Check bridge data", text: "Show recent high-volume bridges on Arc" },
    { label: "Verify agent wallet", text: "What is the status of agent wallet 0xArcAgent1A2zP1eP5q77ab?" },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isResponding) return;

    addChatMessage("public", textToSend, "user");
    setInputText("");
    setIsResponding(true);

    try {
      const token = await getAccessToken();
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          sessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addChatMessage("public", `⚠️ Error: ${err.message || "The explorer agent is currently unavailable."}`, "agent");
        return;
      }

      const data = await res.json();

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Generate structured card if get_public_wallet_stats was run
      let customData: any = null;
      const ranStatsTool = data.toolsUsed?.includes("get_public_wallet_stats");
      const matchedAddr = textToSend.match(/0x[a-fA-F0-9]+/);
      const address = matchedAddr ? matchedAddr[0] : null;

      if (ranStatsTool && address) {
        try {
          const statsRes = await fetch(`http://localhost:3001/stats/${address}?timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
          const stats = statsRes.ok ? await statsRes.json() : null;
          if (stats) {
            customData = {
              type: "wallet_preview",
              address: address,
              balance: `${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
              tokens: ["USDC", "ARC", "USDT"],
              txCount: stats.transactionCount,
              riskScore: 8,
            };
          }
        } catch (e) {
          console.error("Failed to load inline preview stats:", e);
        }
      }

      addChatMessage("public", data.message, "agent", customData);
    } catch (e) {
      console.error(e);
      addChatMessage("public", "⚠️ Connection error — is the backend running on port 3001?", "agent");
    } finally {
      setIsResponding(false);
    }
  };

  const handleSelectPreview = (address: string) => {
    searchWallet(address);
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 flex gap-6 h-[calc(100vh-8.5rem)] overflow-hidden select-none">
      
      {/* Sidebar - Recent Searches */}
      <div className="w-64 glass-panel border-[#22252F] bg-[#15161C] p-4 hidden md:flex flex-col gap-4 overflow-y-auto shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-neon-blue" />
            Recent Explorations
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Click to reload metrics</span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {recentSearches.map((search, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (search.startsWith("0x")) {
                  setInputText(`Analyze wallet ${search}`);
                  handleSend(`Analyze wallet ${search}`);
                } else {
                  setInputText(search);
                }
              }}
              className="text-left p-2.5 rounded-lg border border-[#22252F] bg-[#090A0F]/40 text-xs font-semibold text-slate-400 hover:text-white hover:border-[#22252F]/80 transition-colors truncate font-mono cursor-pointer"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 glass-panel border-[#22252F] bg-[#15161C] flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />

        {/* Chat Header */}
        <div className="h-14 border-b border-[#22252F] px-5 flex items-center justify-between shrink-0 bg-[#090A0F]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Public Explorer Agent</span>
              <span className="text-[9px] font-mono text-neon-cyan uppercase tracking-wider font-semibold">Active RPC Nodes</span>
            </div>
          </div>
          <button
            onClick={() => clearChat("public")}
            className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200 border border-[#22252F] rounded hover:bg-[#22252F] transition-colors cursor-pointer"
          >
            Clear Thread
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {thread.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
            >
              <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue" : "bg-[#090A0F] border-[#22252F] text-neon-cyan"
              }`}>
                {msg.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user" ? "bg-neon-blue/10 text-slate-200 rounded-tr-none" : "bg-[#090A0F]/60 text-slate-300 border border-[#22252F] rounded-tl-none"
                }`}>
                  {msg.text}
                </div>

                {/* Inline previews */}
                {msg.data && msg.data.type === "wallet_preview" && (
                  <div className="glass-panel p-4 border-[#22252F] bg-[#090A0F]/70 max-w-sm flex flex-col gap-3 animate-slide-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-neon-blue" />
                      Scanner telemetry
                    </span>
                    
                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 font-mono">Address: {msg.data.address.slice(0, 10)}...{msg.data.address.slice(-6)}</span>
                      <span className="text-white font-bold font-mono">Total Assets: {msg.data.balance}</span>
                      <span className="text-slate-400">Tokens: {msg.data.tokens.join(", ")}</span>
                      <span className="text-slate-400 font-mono">Transactions: {msg.data.txCount}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-500/20">
                          {msg.data.riskScore}/100 (Safe)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPreview(msg.data.address)}
                      className="w-full py-2 rounded-lg bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Explore Dashboard Analytics
                    </button>
                  </div>
                )}

                {msg.data && msg.data.type === "metric_preview" && (
                  <div className="glass-panel p-4 border-[#22252F] bg-[#090A0F]/70 max-w-xs flex flex-col gap-2.5 animate-slide-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.data.label}</span>
                    <div className="flex flex-col gap-2 text-xs">
                      {msg.data.data.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between border-b border-[#22252F] pb-1 font-semibold text-slate-300">
                          <span>{item.name}</span>
                          <span className="font-mono text-white">{item.volume}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex gap-3.5 max-w-[85%] self-start animate-pulse">
              <div className="w-8.5 h-8.5 rounded-xl border bg-[#090A0F] border-[#22252F] text-neon-cyan flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="bg-[#090A0F]/60 text-slate-400 border border-[#22252F] rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="font-mono text-[9px] tracking-wider uppercase text-slate-500">Agent scanning RPC...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        {thread.length <= 1 && (
          <div className="px-5 py-3 border-t border-[#22252F] flex gap-2 flex-wrap shrink-0">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(prompt.text);
                  handleSend(prompt.text);
                }}
                className="px-3.5 py-1.5 rounded-full border border-[#22252F] bg-[#15161C] text-[10px] font-semibold text-slate-400 hover:text-white hover:border-[#22252F]/80 hover:bg-[#22252F] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {prompt.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="p-4 border-t border-[#22252F] bg-[#090A0F]/30 flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder="Search address (0x...) or ask blockchain explorer queries..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50"
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-xl bg-neon-blue flex items-center justify-center text-slate-950 cursor-pointer hover:opacity-90 transition-transform active:scale-95 shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
