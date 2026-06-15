"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, getBackendUrl } from "../context/AppContext";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Send, User, Bot, HelpCircle, LayoutDashboard, Wallet, Compass, Search, ExternalLink, CreditCard, Copy, Check, Sparkles, ArrowRight, Plus, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const router = useRouter();
  const { chats, addChatMessage, searchWallet, clearChat, connectedWallet, recentExplorations, triggerToast, setAgentChats } = useApp();
  const { getAccessToken, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [inputText, setInputText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleExecuteRealTransaction = async (preparedPayload: any) => {
    if (!preparedPayload || !preparedPayload.transaction) {
      triggerToast("Invalid transaction parameters", "error");
      return;
    }

    triggerToast("Initiating secure signature request...", "info");

    try {
      const activeWallet = wallets?.find((w) => w.walletClientType === "privy") || wallets?.[0];
      if (!activeWallet) {
        triggerToast("No connected wallet found. Please authenticate.", "error");
        return;
      }

      const ARC_CHAIN_ID = 5042002;
      if (activeWallet.chainId !== `eip155:${ARC_CHAIN_ID}` && activeWallet.chainId !== String(ARC_CHAIN_ID) && activeWallet.chainId !== ARC_CHAIN_ID) {
        triggerToast("Switching network to Arc Testnet...", "info");
        await activeWallet.switchChain(ARC_CHAIN_ID);
      }

      const provider = await activeWallet.getEthereumProvider();
      
      triggerToast("Requesting cryptographic signature from Privy...", "info");
      
      const txParams = preparedPayload.transaction;
      
      const { createWalletClient, custom } = await import("viem");
      const { arcTestnet } = await import("viem/chains");
      
      const client = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        chain: arcTestnet,
        transport: custom(provider),
      });

      const txToSign: any = {
        to: txParams.to as `0x${string}`,
        data: txParams.data as `0x${string}`,
        value: txParams.value ? BigInt(txParams.value) : 0n,
        gas: txParams.gasLimit ? BigInt(txParams.gasLimit) : 100000n,
      };

      if (txParams.nonce !== undefined && txParams.nonce !== null) {
        const parsedNonce = Number(txParams.nonce);
        if (!isNaN(parsedNonce)) {
          txToSign.nonce = parsedNonce;
        }
      }

      const signedTx = await client.signTransaction(txToSign);

      triggerToast("Transaction signed successfully. Broadcasting...", "info");

      const token = await getAccessToken();
      const res = await fetch(`${getBackendUrl()}/transactions/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signedTx }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to broadcast signed transaction.");
      }

      const result = await res.json();
      
      addChatMessage(
        "public",
        `✅ Transaction successfully signed & executed!\n\nTx Hash: \`${result.txHash}\`\n\n[View on Explorer](https://testnet.arcscan.app/tx/${result.txHash})`,
        "agent"
      );

      triggerToast("Transaction executed successfully!", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Execution failed: ${err.message || err}`, "error");
    }
  };

  const [sessions, setSessions] = useState<any[]>([]);

  // Fetch recent explorer chat sessions
  useEffect(() => {
    if (!authenticated) return;
    const fetchSessions = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`${getBackendUrl()}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const allSessions = await res.json();
          // Filter to only show explorer chats (where agentId is null or undefined)
          const explorerSessions = allSessions.filter((s: any) => !s.agentId);
          setSessions(explorerSessions);
        }
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }
    };
    fetchSessions();
  }, [authenticated, sessionId]);

  const handleSelectSession = async (sessId: string) => {
    try {
      setIsResponding(true);
      const token = await getAccessToken();
      const res = await fetch(`${getBackendUrl()}/chat/sessions/${sessId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const dbMessages = await res.json();
        const mappedMessages = dbMessages.map((m: any) => ({
          id: m.id,
          sender: m.role === "user" ? "user" : "agent",
          text: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          data: m.payload ? JSON.parse(JSON.stringify(m.payload)) : undefined,
        }));
        
        setAgentChats("public", mappedMessages);
        setSessionId(sessId);
        triggerToast("Chat session loaded", "success");
      }
    } catch (err) {
      console.error("Failed to load chat messages:", err);
      triggerToast("Failed to load session", "error");
    } finally {
      setIsResponding(false);
    }
  };

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
      const res = await fetch(`${getBackendUrl()}/chat`, {
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

      // Generate structured card from response actions or tools
      let customData: any = null;
      const actions = data.structuredData?.actions ?? [];
      const txAction = actions.find((a: any) => a.type === 'sign_transaction');
      const fundAction = actions.find((a: any) => a.type === 'fund_agent');

      if (txAction?.payload) {
        const p = txAction.payload;
        const activeWallet = wallets?.find((w) => w.walletClientType === "privy") || wallets?.[0];
        const fromAddr = p.transaction?.from || activeWallet?.address || "Connected Wallet";
        const toAddr = p.recipientAddress || p.transaction?.to || "—";
        const amountStr = p.amount ? `${p.amount} USDC` : "—";

        customData = {
          type: "transaction_preview",
          title: "Sign Transaction via Privy",
          details: [
            { label: "From Address", value: fromAddr.startsWith("0x") ? `${fromAddr.slice(0, 10)}...${fromAddr.slice(-6)}` : fromAddr },
            { label: "To Address",   value: toAddr.startsWith("0x") ? `${toAddr.slice(0, 10)}...${toAddr.slice(-6)}` : toAddr },
            { label: "Amount",       value: amountStr },
            { label: "Safety Score", value: `${p.risk?.score ?? 100}/100` },
          ],
          showExecuteButton: true,
          warning: p.risk?.warnings?.join(" | ") || p.warning || null,
          payload: p,
        };
      } else if (fundAction?.payload) {
        const p = fundAction.payload;
        customData = {
          type: "fund_agent",
          title: `Fund ${p.agentName}`,
          depositAddress: p.depositAddress,
          requestedAmount: p.requestedAmount,
          agentId: p.agentId,
        };
      } else {
        const ranStatsTool = data.toolsUsed?.includes("get_public_wallet_stats");
        const matchedAddr = textToSend.match(/0x[a-fA-F0-9]+/);
        const address = matchedAddr ? matchedAddr[0] : null;

        if (ranStatsTool && address) {
          try {
            const statsRes = await fetch(`${getBackendUrl()}/stats/${address}?timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
            const stats = statsRes.ok ? await statsRes.json() : null;
            if (stats) {
              customData = {
                type: "wallet_preview",
                address: address,
                balance: `${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
                tokens: ["USDC", "ARC", "USDT"],
                txCount: stats.transactionCount,
                riskScore: stats.riskScore ?? 15,
              };
            }
          } catch (e) {
            console.error("Failed to load inline preview stats:", e);
          }
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

        {/* Recent Chat Sessions */}
        <div className="flex flex-col gap-0.5 mt-4 pt-4 border-t border-[#22252F]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-neon-cyan" />
            Recent Explorer Chats
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Click to reload chat history</span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {sessions.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">No recent chats</span>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs font-semibold truncate cursor-pointer ${
                  sessionId === s.id
                    ? "border-neon-cyan/50 bg-neon-cyan/5 text-white"
                    : "border-[#22252F] bg-[#090A0F]/40 text-slate-400 hover:text-white"
                }`}
              >
                Chat {s.id.slice(0, 8)} ({s._count?.messages || 0} msgs)
              </button>
            ))
          )}
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
            onClick={() => {
              clearChat("public");
              setSessionId(undefined);
              triggerToast("Started new chat session", "success");
            }}
            className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200 border border-[#22252F] rounded hover:bg-[#22252F] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {thread.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-[85%] group/msg ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
            >
              <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue" : "bg-[#090A0F] border-[#22252F] text-neon-cyan"
              }`}>
                {msg.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className={`relative p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user" ? "bg-neon-blue/10 text-slate-200 rounded-tr-none" : "bg-[#090A0F]/60 text-slate-300 border border-[#22252F] rounded-tl-none"
                }`}>
                  {/* Copy button — shows on hover */}
                  <button
                    onClick={() => handleCopyMessage(msg.text, msg.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-md bg-[#15161C] border border-[#22252F] text-slate-400 hover:text-white cursor-pointer z-10"
                    title="Copy message"
                  >
                    {copiedMsgId === msg.id
                      ? <Check className="w-3 h-3 text-neon-cyan" />
                      : <Copy className="w-3 h-3" />}
                  </button>

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
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          msg.data.riskScore < 30
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                            : msg.data.riskScore < 60
                            ? "bg-amber-950/20 text-amber-400 border-amber-500/20"
                            : "bg-rose-950/20 text-rose-400 border-rose-500/20"
                        }`}>
                          {msg.data.riskScore}/100 ({
                            msg.data.riskScore < 30 ? "Safe" : msg.data.riskScore < 60 ? "Medium Risk" : "High Risk"
                          })
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

                {msg.data && msg.data.type === "transaction_preview" && (
                  <div className="glass-panel p-4 border-[#22252F] bg-[#090A0F]/70 max-w-sm flex flex-col gap-3 animate-slide-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
                      {msg.data.title}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {msg.data.details?.map((detail: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-0.5 border-r border-[#22252F] last:border-0 pr-2">
                          <span className="text-[8px] text-slate-500 font-bold uppercase">{detail.label}</span>
                          <span className="text-[10px] text-white font-mono font-semibold">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                    {msg.data.warning && (
                      <div className="text-[9px] text-amber-500 font-medium bg-amber-950/20 border border-amber-500/25 p-2 rounded-lg leading-normal">
                        ⚠️ {msg.data.warning}
                      </div>
                    )}
                    {msg.data.showExecuteButton && (
                      <button
                        onClick={() => handleExecuteRealTransaction(msg.data.payload)}
                        type="button"
                        className="w-full py-2 rounded-lg bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Sign & Execute Tx
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {msg.data && msg.data.type === "fund_agent" && (
                  <div className="glass-panel p-4 border-[#22252F] bg-[#090A0F]/70 max-w-sm flex flex-col gap-3 animate-slide-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-neon-blue" />
                      {msg.data.title}
                    </span>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Deposit Address</span>
                      <div className="flex items-center gap-2 bg-[#090A0F] rounded-lg px-2.5 py-2 border border-[#22252F]">
                        <span className="text-[9px] font-mono text-slate-300 truncate flex-1">{msg.data.depositAddress}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.data.depositAddress); triggerToast("Address copied!", "info"); }}
                          className="text-slate-500 hover:text-neon-cyan transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {msg.data.requestedAmount && (
                      <div className="text-[10px] text-slate-400">
                        Amount Requested: <span className="text-white font-bold">{msg.data.requestedAmount} USDC</span>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          const activeWallet = wallets?.find((w) => w.walletClientType === "privy") || wallets?.[0];
                          if (!activeWallet) {
                            triggerToast("No wallet connected.", "error");
                            return;
                          }
                          
                          const ARC_CHAIN_ID = 5042002;
                          if (activeWallet.chainId !== `eip155:${ARC_CHAIN_ID}` && activeWallet.chainId !== String(ARC_CHAIN_ID) && activeWallet.chainId !== ARC_CHAIN_ID) {
                            triggerToast("Switching network to Arc Testnet...", "info");
                            await activeWallet.switchChain(ARC_CHAIN_ID);
                          }

                          const provider = await activeWallet.getEthereumProvider();
                          const { createWalletClient, custom, parseUnits } = await import("viem");
                          const { arcTestnet } = await import("viem/chains");
                          const client = createWalletClient({
                            account: activeWallet.address as `0x${string}`,
                            chain: arcTestnet,
                            transport: custom(provider),
                          });
                          
                          const USDC_CONTRACT = "0x3600000000000000000000000000000000000000" as `0x${string}`;
                          const transferAbi = [{
                            name: "transfer",
                            type: "function",
                            stateMutability: "nonpayable",
                            inputs: [
                              { name: "to",     type: "address" },
                              { name: "amount", type: "uint256" },
                            ],
                            outputs: [{ type: "bool" }],
                          }] as const;
                          
                          const amountRaw = parseUnits(String(msg.data.requestedAmount || 10), 6);
                          const { encodeFunctionData } = await import("viem");
                          const calldata = encodeFunctionData({
                            abi: transferAbi,
                            functionName: "transfer",
                            args: [msg.data.depositAddress as `0x${string}`, amountRaw],
                          });
                          
                          triggerToast("Sending transaction...", "info");
                          const hash = await client.sendTransaction({
                            to: USDC_CONTRACT,
                            data: calldata,
                          });
                          
                          addChatMessage("public", `✅ Successfully sent ${msg.data.requestedAmount || 10} USDC to agent vault!\n\nTx Hash: \`${hash}\``, "agent");
                          triggerToast("Funds sent successfully!", "success");
                        } catch (err: any) {
                          console.error(err);
                          triggerToast(`Transfer failed: ${err.message || err}`, "error");
                        }
                      }}
                      className="w-full py-2 rounded-lg bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CreditCard className="w-4 h-4" />
                      Fund Vault Now
                    </button>
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
