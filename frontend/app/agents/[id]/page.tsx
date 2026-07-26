"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import { encodeFunctionData } from "viem";
import ReactMarkdown from "react-markdown";
import { useApp, getBackendUrl } from "../../context/AppContext";
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
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Shield,
  X,
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
    setAgentChats,
    triggerToast,
    showUpgradeModal,
  } = useApp();

  const { getAccessToken, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  // Arc testnet USDC constants
  const USDC_CONTRACT = "0x3600000000000000000000000000000000000000" as `0x${string}`;
  const USDC_DECIMALS = 6;
  const ARC_CHAIN_ID = 5042002;
  const USDC_TRANSFER_ABI = [{
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  }] as const;

  const agent = agents.find((a) => a.id === id);
  const agentRules = rules[id] || [];
  const agentMessages = chats[id] || [];

  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  // Mobile panel switcher: "chat" | "telemetry"
  const [activePanel, setActivePanel] = useState<"chat" | "telemetry">("chat");

  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Fund Vault modal state
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundCopied, setFundCopied] = useState(false);
  const [fundSending, setFundSending] = useState(false);
  const [fundTxHash, setFundTxHash] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);

  // Policy modal state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [perTxLimit, setPerTxLimit] = useState("50");
  const [dailyLimit, setDailyLimit] = useState("200");
  const [monthlyLimit, setMonthlyLimit] = useState("1000");
  const [policySaved, setPolicySaved] = useState(false);

  const handleCopyFundAddress = () => {
    navigator.clipboard.writeText(agent?.wallet ?? "");
    setFundCopied(true);
    setTimeout(() => setFundCopied(false), 2000);
  };

  const openFundModal = (amount?: number) => {
    if (amount) setFundAmount(String(amount));
    setFundModalOpen(true);
    setFundTxHash(null);
    setFundError(null);
    setFundSending(false);
  };

  const handleSendFromWallet = async () => {
    const parsedAmount = parseFloat(fundAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFundError("Please enter a valid amount.");
      return;
    }
    if (!agent?.wallet) {
      setFundError("Agent wallet address not found.");
      return;
    }

    setFundSending(true);
    setFundError(null);
    setFundTxHash(null);

    try {
      const amountRaw = BigInt(Math.round(parsedAmount * 10 ** USDC_DECIMALS));
      const calldata = encodeFunctionData({
        abi: USDC_TRANSFER_ABI,
        functionName: "transfer",
        args: [agent.wallet as `0x${string}`, amountRaw],
      });
      const receipt = await sendTransaction({
        to: USDC_CONTRACT,
        data: calldata,
        chainId: ARC_CHAIN_ID,
      });
      setFundTxHash(receipt.hash);
      triggerToast?.(`${parsedAmount} USDC sent to ${agent.name}'s vault!`, "success");
    } catch (err: any) {
      const msg = err?.message?.includes("rejected")
        ? "Transaction rejected in wallet."
        : err?.message ?? "Transaction failed.";
      setFundError(msg);
    } finally {
      setFundSending(false);
    }
  };

  // Load chat history from NestJS backend on mount / agent change
  useEffect(() => {
    if (!authenticated || !agent) return;

    const loadChatHistory = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        // 1. Fetch sessions
        const sessionsRes = await fetch(`${getBackendUrl()}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!sessionsRes.ok) return;
        const sessions = await sessionsRes.json();
        const activeSession = sessions.find((s: any) => s.agentId === id);

        if (activeSession) {
          setSessionId(activeSession.id);

          // 2. Fetch messages
          const msgRes = await fetch(`${getBackendUrl()}/chat/sessions/${activeSession.id}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (msgRes.ok) {
            const dbMessages = await msgRes.json();
            const mappedMessages = dbMessages.map((m: any) => ({
              id: m.id,
              sender: m.role === "user" ? "user" : "agent",
              text: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setAgentChats(id, mappedMessages);
          }
        }
      } catch (err) {
        console.error("Error loading chat history from backend:", err);
      }
    };

    loadChatHistory();
  }, [id, authenticated, agent]);

  // Initialize logs & fetch real activity history from backend / Circle API
  useEffect(() => {
    if (!agent) return;
    const initial = [
      `[SYSTEM] [${new Date().toLocaleTimeString()}] Cognitive engine ${agent.model} initialized.`,
      `[SYSTEM] [${new Date().toLocaleTimeString()}] Secure bridge connection established to Circle vault ${agent.wallet.slice(0, 10)}...`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Loaded ${agentRules.length} active automation rules.`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Listening for RPC events on Arc L1 blockchain...`,
      `[DAEMON] [${new Date().toLocaleTimeString()}] Polling wallet balance. Current status: ${agent.status.toUpperCase()}.`,
    ];
    setLogs(initial);

    // Fetch real transaction & activity history from backend
    const fetchHistory = async () => {
      try {
        if (!agent.wallet || agent.wallet === "No Wallet") return;
        const res = await fetch(`${getBackendUrl()}/stats/${agent.wallet}?timeframe=1w`);
        if (res.ok) {
          const data = await res.json();
          if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
            const historyLogs = data.transactions.map((tx: any) => {
              const ts = new Date(tx.timestamp).toLocaleTimeString();
              return `[TRANSACTION] [${ts}] ${tx.title}: ${tx.description || tx.value} (${tx.status.toUpperCase()})`;
            });
            setLogs((prev) => [...prev, ...historyLogs]);
          }
        }
      } catch (err) {
        console.error("Failed to load agent transaction history:", err);
      }
    };
    fetchHistory();
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
            `[SIMULATE] [${timestamp}] Executed visual compiler test. Result: SUCCESS. Gas simulation: 0.003 USDC.`
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

  const isMockId = id === "agent-1" || id === "agent-2";
  const isStillLoading = !ready || (authenticated && !agent && !isMockId);

  if (isStillLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 select-none">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
          <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-300">Syncing Secure Workspace...</p>
          <p className="text-[10px] text-slate-500 mt-1">Connecting to Circle wallet and loading cognitive memory</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 select-none">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Agent Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">The requested wallet agent ID does not exist.</p>
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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userText = inputValue.trim();
    addChatMessage(id, userText, "user");
    setInputValue("");
    setIsThinking(true);

    try {
      const token = await getAccessToken();
      const res = await fetch(`${getBackendUrl()}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          agentId: id,
          sessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.message?.toLowerCase().includes("limit") || err.message?.toLowerCase().includes("budget") || err.message?.toLowerCase().includes("exceeds")) {
          addChatMessage(id, `⚠️ Error: ${err.message}`, "agent");
          showUpgradeModal("Quota Exceeded", err.message);
        } else {
          addChatMessage(id, `⚠️ ${err.message || 'The agent returned an error. Check your API key in agent settings.'}`, "agent");
        }
        return;
      }

      const data = await res.json();

      // Persist session for conversation continuity
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      // Build structured card data from response
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

        // If the AI was told an amount, auto-execute the transfer immediately
        if (p.requestedAmount && p.depositAddress) {
          addChatMessage(id, `⏳ Sending ${p.requestedAmount} USDC to **${p.agentName}**'s vault...`, "agent");

          try {
            const amountRaw = BigInt(Math.round(p.requestedAmount * 10 ** USDC_DECIMALS));
            const calldata = encodeFunctionData({
              abi: USDC_TRANSFER_ABI,
              functionName: "transfer",
              args: [p.depositAddress as `0x${string}`, amountRaw],
            });

            const receipt = await sendTransaction({
              to: USDC_CONTRACT,
              data: calldata,
              chainId: ARC_CHAIN_ID,
            });

            addChatMessage(
              id,
              `✅ **${p.requestedAmount} USDC** sent to **${p.agentName}**!\n\nTx: \`${receipt.hash}\`\n\n[View on Explorer](https://testnet.arcscan.app/tx/${receipt.hash})`,
              "agent",
            );
            triggerToast?.(`${p.requestedAmount} USDC sent to ${p.agentName}`, "success");
          } catch (txErr: any) {
            const reason = txErr?.message?.includes("rejected")
              ? "Transaction rejected in wallet."
              : txErr?.message ?? "Transaction failed.";
            addChatMessage(id, `⚠️ Transfer failed: ${reason}`, "agent");
          }
        } else {
          // No amount specified — show the funding card so user can choose
          customData = {
            type: "fund_agent",
            title: `Fund ${p.agentName}`,
            depositAddress: p.depositAddress,
            requestedAmount: p.requestedAmount,
            agentId: p.agentId,
          };
        }
      }

      // Log tool usage in daemon panel
      if (data.toolsUsed?.length > 0) {
        setLogs((prev) => [
          ...prev,
          `[LLM] [${new Date().toLocaleTimeString()}] Provider responded. Tools used: ${data.toolsUsed.join(', ')}`,
          `[LLM] [${new Date().toLocaleTimeString()}] Confidence: ${((data.confidence ?? 0) * 100).toFixed(0)}%`,
        ]);
      }

      addChatMessage(id, data.message, "agent", customData);
    } catch {
      addChatMessage(id, "⚠️ Connection error — is the backend running on port 3001?", "agent");
    } finally {
      setIsThinking(false);
    }
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

      if (activeWallet.chainId !== `eip155:${ARC_CHAIN_ID}` && activeWallet.chainId !== String(ARC_CHAIN_ID)) {
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
        id,
        `✅ Transaction successfully signed & executed!\n\nTx Hash: \`${result.txHash}\`\n\n[View on Explorer](https://testnet.arcscan.app/tx/${result.txHash})`,
        "agent"
      );

      setLogs((prev) => [
        ...prev,
        `[TRANSACTION] [${new Date().toLocaleTimeString()}] Securely signed by Privy user.`,
        `[TRANSACTION] [${new Date().toLocaleTimeString()}] Broadcast completed. Tx: ${result.txHash.slice(0, 10)}...`,
      ]);

      triggerToast("Transaction executed successfully!", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Execution failed: ${err.message || err}`, "error");
      setLogs((prev) => [
        ...prev,
        `[ERROR] [${new Date().toLocaleTimeString()}] Transaction signing or execution rejected/failed.`,
      ]);
    }
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
    "Swap 50 USDC for EURC",
    "Show active rules logs",
    "Check Circle vault balance",
  ];

  return (
    <>
    {/* Mobile Panel Switcher — only visible on smaller screens */}
    <div className="flex lg:hidden gap-2 mb-1">
      <button
        onClick={() => setActivePanel("chat")}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          activePanel === "chat"
            ? "bg-neon-blue/10 text-white border-neon-blue/30"
            : "text-slate-400 border-[#22252F] bg-[#15161C] hover:text-slate-200"
        }`}
      >
        💬 Agent Chat
      </button>
      <button
        onClick={() => setActivePanel("telemetry")}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          activePanel === "telemetry"
            ? "bg-neon-blue/10 text-white border-neon-blue/30"
            : "text-slate-400 border-[#22252F] bg-[#15161C] hover:text-slate-200"
        }`}
      >
        📡 Telemetry
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none h-full relative">
      
      {/* LEFT SIDE: Chat Workspace */}
      <div className={`lg:col-span-7 flex flex-col h-[calc(100dvh-160px)] sm:h-[calc(100dvh-170px)] lg:h-[calc(100dvh-130px)] min-h-[420px] glass-panel border-[#22252F] bg-[#15161C] overflow-hidden relative ${
        activePanel !== "chat" ? "hidden lg:flex" : "flex"
      }`}>
        {/* Chat header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#22252F] bg-[#090A0F]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue glow-blue shrink-0">
              <Bot className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-none">{agent.name}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">Model: {agent.model}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/agents/${agent.id}/dashboard`)}
              className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
              <span className="hidden sm:inline">Agent </span>Analytics
            </button>
            <button
              onClick={() => router.push(`/agents/${agent.id}/rules`)}
              className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-neon-blue shrink-0" />
              <span className="hidden sm:inline">Manage </span>Rules
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 flex flex-col gap-3.5 sm:gap-4">
          {agentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div key={msg.id} className={`flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[85%] group/msg ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  isUser
                    ? "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
                    : "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
                  <div className={`relative p-3.5 rounded-2xl text-xs leading-relaxed border break-words ${
                    isUser
                      ? "bg-[#090A0F]/80 border-neon-purple/10 text-slate-100 rounded-tr-none"
                      : "bg-[#090A0F]/90 border-[#22252F] text-slate-200 rounded-tl-none"
                  }`}>
                    {/* Copy button — agent messages only, shows on hover */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-md bg-[#15161C] border border-[#22252F] text-slate-400 hover:text-white cursor-pointer"
                        title="Copy response"
                      >
                        {copiedMsgId === msg.id
                          ? <Check className="w-3 h-3 text-neon-cyan" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Message body — markdown for agent, plain for user */}
                    {isUser ? (
                      <span className="break-words min-w-0 font-mono text-[11px] sm:text-xs">{msg.text}</span>
                    ) : (
                      <div className="prose-agent break-words min-w-0">
                        <ReactMarkdown
                          components={{
                            h1: ({children}) => <h1 className="text-sm font-bold text-white mb-2 mt-1">{children}</h1>,
                            h2: ({children}) => <h2 className="text-xs font-bold text-white mb-1.5 mt-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-xs font-semibold text-slate-200 mb-1 mt-1.5">{children}</h3>,
                            p:  ({children}) => <p className="mb-2 last:mb-0 leading-relaxed break-words break-all">{children}</p>,
                            strong: ({children}) => <strong className="font-bold text-white break-words">{children}</strong>,
                            em: ({children}) => <em className="text-slate-300 italic">{children}</em>,
                            code: ({children, className}) => {
                              const isBlock = className?.includes('language-');
                              return isBlock
                                ? <code className="block bg-[#0a0b10] border border-[#22252F] rounded-lg p-2.5 font-mono text-[9px] text-neon-cyan overflow-x-auto my-2 whitespace-pre break-all">{children}</code>
                                : <code className="bg-[#0a0b10] border border-[#22252F] rounded px-1.5 py-0.5 font-mono text-[9px] text-neon-cyan break-all">{children}</code>;
                            },
                            pre: ({children}) => <pre className="my-0 overflow-x-auto">{children}</pre>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-slate-300">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-slate-300">{children}</ol>,
                            li: ({children}) => <li className="text-xs break-words">{children}</li>,
                            hr: () => <hr className="border-[#22252F] my-2" />,
                            a:  ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="text-neon-blue underline hover:text-neon-cyan transition-colors break-all">{children}</a>,
                            blockquote: ({children}) => <blockquote className="border-l-2 border-neon-blue/30 pl-3 italic text-slate-400 my-1">{children}</blockquote>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Interactive payload block */}
                    {msg.data && (
                      <div className="mt-3 p-3 rounded-xl bg-[#090A0F]/70 border border-[#22252F] flex flex-col gap-2.5">

                        {/* Fund Agent Card */}
                        {msg.data.type === "fund_agent" ? (
                          <>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neon-blue flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {msg.data.title}
                            </span>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">Deposit Address</span>
                              <div className="flex items-center gap-2 bg-[#090A0F] rounded-lg px-2 py-1.5 border border-[#22252F]">
                                <span className="text-[9px] font-mono text-slate-300 truncate flex-1">{msg.data.depositAddress}</span>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(msg.data.depositAddress); }}
                                  className="text-slate-500 hover:text-neon-cyan transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {msg.data.requestedAmount && (
                              <div className="text-[9px] text-slate-400">
                                Requested: <span className="text-white font-bold">{msg.data.requestedAmount} USDC</span>
                              </div>
                            )}
                            <button
                              onClick={() => openFundModal(msg.data.requestedAmount)}
                              className="mt-1 h-7 rounded-lg bg-neon-blue text-slate-950 font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                              <CreditCard className="w-3 h-3" />
                              Fund Now
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {msg.data.title}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {msg.data.details?.map((detail: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-0.5 border-r border-[#22252F] last:border-0 pr-2">
                                  <span className="text-[8px] text-slate-500 font-bold uppercase">{detail.label}</span>
                                  <span className="text-[10px] text-white font-mono font-semibold">{detail.value}</span>
                                </div>
                              ))}
                            </div>
                            {msg.data.showExecuteButton && (
                              <button
                                onClick={() => {
                                  if (msg.data.type === "transaction_preview") {
                                    handleExecuteRealTransaction(msg.data.payload);
                                  } else {
                                    handleExecuteSimulatedAction(msg.data.title);
                                  }
                                }}
                                type="button"
                                className="mt-1 h-7 rounded-lg bg-neon-blue text-slate-950 font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                              >
                                {msg.data.type === "transaction_preview" ? "Sign & Execute Tx" : "Execute Sandboxed Tx"}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </>
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
          {/* Typing indicator */}
          {isThinking && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border bg-neon-blue/10 border-neon-blue/20 text-neon-blue">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#090A0F]/90 border border-[#22252F] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-blue/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-neon-blue/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-neon-blue/60 rounded-full animate-bounce" />
              </div>
            </div>
          )}
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
              placeholder={isThinking ? `${agent.name} is thinking...` : `Send message to ${agent.name}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isThinking}
              className="flex-1 h-11 px-4 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isThinking}
              className="w-11 h-11 rounded-xl bg-neon-blue text-slate-950 font-bold flex items-center justify-center shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Telemetry / Diagnostics */}
      <div className={`lg:col-span-5 flex flex-col gap-6 h-[calc(100dvh-180px)] lg:h-[calc(100dvh-130px)] min-h-[500px] overflow-y-auto pr-1 ${
        activePanel !== "telemetry" ? "hidden lg:flex" : "flex"
      }`}>
        
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
            <div className="col-span-2 p-3.5 rounded-xl bg-[#090A0F]/40 border border-neon-blue/10 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vault Balances</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-sm font-extrabold text-white">
                    {agent.balance.toLocaleString()} USDC
                  </span>
                  <span className="text-sm font-extrabold text-neon-cyan">
                    {(agent.balanceEURC ?? 0).toLocaleString()} EURC
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPolicyModalOpen(true)}
                  className="h-8 px-3 rounded-lg bg-[#15161C] border border-[#22252F] hover:bg-[#22252F] text-slate-300 font-bold text-[10px] uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-neon-cyan" />
                  Policy Limits
                </button>
                <button
                  onClick={() => openFundModal()}
                  className="h-8 px-3.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-bold text-[10px] uppercase flex items-center gap-1.5 cursor-pointer hover:bg-neon-blue/20 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Fund Vault
                </button>
              </div>
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
                {agent.gasSpent} USDC
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

      {/* ── Fund Vault Modal ─────────────────────────────────── */}
      {fundModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setFundModalOpen(false)}
        >
          <div
            className="glass-panel bg-[#0e0f14] border-[#22252F] w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5 text-neon-blue" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Fund Agent Vault</h2>
                  <p className="text-[10px] text-slate-500">Send USDC to {agent.name}</p>
                </div>
              </div>
              <button
                onClick={() => setFundModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Amount presets */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Amount (USDC)</label>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setFundAmount(String(preset))}
                    className={`flex-1 h-8 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                      fundAmount === String(preset)
                        ? 'border-neon-blue bg-neon-blue/15 text-neon-blue'
                        : 'border-[#22252F] bg-[#090A0F] text-slate-400 hover:border-neon-blue/30'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                placeholder="Custom amount..."
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="h-10 px-4 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 transition-all"
              />
            </div>

            {/* Deposit address */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Agent Vault Address (Arc Testnet)</label>
              <div className="flex items-center gap-2 bg-[#090A0F]/80 p-3 rounded-xl border border-[#22252F]">
                <span className="text-[10px] font-mono text-slate-300 truncate flex-1 select-all">{agent.wallet}</span>
                <button
                  onClick={handleCopyFundAddress}
                  className="p-1.5 rounded-lg bg-[#15161C] border border-[#22252F] text-slate-400 hover:text-neon-cyan transition-colors cursor-pointer shrink-0"
                  title="Copy address"
                >
                  {fundCopied ? <Check className="w-3.5 h-3.5 text-neon-cyan" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Send USDC to this address from your connected wallet or any exchange. Funds are credited on Arc Testnet.
              </p>
            </div>

            {/* CTA */}
            {fundTxHash ? (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Check className="w-4 h-4" />
                  {fundAmount} USDC sent successfully!
                </div>
                <a
                  href={`https://testnet.arcscan.app/tx/${fundTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono text-slate-400 hover:text-neon-cyan truncate transition-colors"
                >
                  Tx: {fundTxHash.slice(0, 20)}...{fundTxHash.slice(-8)} ↗
                </a>
                <button
                  onClick={() => { setFundModalOpen(false); setFundTxHash(null); setFundAmount(""); }}
                  className="h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs cursor-pointer hover:bg-emerald-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {fundError && (
                  <div className="text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    ⚠️ {fundError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleCopyFundAddress();
                      triggerToast?.(`Address copied — send ${fundAmount || '?'} USDC to ${agent.name}'s vault`, "success");
                    }}
                    disabled={fundSending}
                    className="flex-1 h-10 rounded-xl border border-neon-blue/30 bg-neon-blue/5 text-neon-blue font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-neon-blue/10 transition-all disabled:opacity-40"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Address
                  </button>
                  <button
                    onClick={handleSendFromWallet}
                    disabled={fundSending || !fundAmount}
                    className="flex-1 h-10 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {fundSending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        Send {fundAmount ? `${fundAmount} USDC` : "USDC"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Policy Limits Modal ─────────────────────────────────── */}
      {policyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setPolicyModalOpen(false)}
        >
          <div
            className="w-full max-w-md glass-panel bg-[#15161C] border-[#22252F] p-6 rounded-2xl flex flex-col gap-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#22252F] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Agent Spending Policy</h3>
                  <p className="text-[10px] text-slate-400">Configure cryptographic spending caps on {agent?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPolicyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#22252F] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Per-Transaction Limit (USDC)</label>
                <input
                  type="number"
                  value={perTxLimit}
                  onChange={(e) => setPerTxLimit(e.target.value)}
                  placeholder="50"
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-cyan/50 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Daily Spending Limit (USDC)</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="200"
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-cyan/50 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Spending Limit (USDC)</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="1000"
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-cyan/50 font-mono"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#090A0F]/60 border border-[#22252F] flex flex-col gap-1.5 mt-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Circle CLI Security Command</span>
                <span className="text-[9px] font-mono text-neon-cyan break-words">
                  circle wallet limit set --address {agent?.wallet} --per-tx {perTxLimit || '0'} --daily {dailyLimit || '0'} --monthly {monthlyLimit || '0'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#22252F]">
              <button
                onClick={() => {
                  setPolicySaved(true);
                  triggerToast?.(`Spending limits for ${agent?.name} updated!`, "success");
                  setTimeout(() => { setPolicySaved(false); setPolicyModalOpen(false); }, 1200);
                }}
                className="h-9 px-5 rounded-xl bg-neon-cyan text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {policySaved ? "Limits Saved!" : "Save Policy Limits"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
