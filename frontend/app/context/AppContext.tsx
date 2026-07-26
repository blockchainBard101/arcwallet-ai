"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { arcTestnet } from "viem/chains";

export const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
};


// Types
export interface Wallet {
  address: string;
  balanceUSDC: number;
  balanceEURC: number;
  connected: boolean;
  type: string;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: "active" | "idle" | "paused";
  wallet: string;
  balance: number;
  balanceEURC?: number;
  token: string;
  created: string;
  rulesCount: number;
  successRate: number;
  gasSpent: number;
}

export interface Rule {
  id: string;
  text: string;
  trigger: string;
  action: string;
  active: boolean;
  lastTriggered: string;
}

export interface Alert {
  id: string;
  condition: string;
  channel: string;
  active: boolean;
  created: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  data?: any; // structured content like chart summaries, TX previews, or rule confirmations
}

export interface Activity {
  id: string;
  type: "swap" | "transfer" | "rule_trigger" | "alert" | "agent_creation";
  title: string;
  description: string;
  wallet: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
  value?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface AppContextType {
  connectedWallet: Wallet | null;
  explorerWallet: string;
  agents: Agent[];
  rules: Record<string, Rule[]>;
  alerts: Alert[];
  chats: Record<string, ChatMessage[]>;
  activityLog: Activity[];
  toasts: Toast[];
  isLoadingAgents: boolean;
  connectWallet: (address?: string) => void;
  disconnectWallet: () => void;
  searchWallet: (address: string) => void;
  addAgent: (name: string, model: string, initialRuleText?: string, llmConfig?: { provider: string; apiKey: string }) => Promise<string>;
  toggleAgentStatus: (agentId: string) => void;
  addRule: (agentId: string, ruleText: string, trigger?: string, action?: string) => void;
  toggleRule: (agentId: string, ruleId: string) => void;
  deleteRule: (agentId: string, ruleId: string) => void;
  addChatMessage: (chatId: string, text: string, sender: "user" | "agent", data?: any) => void;
  setAgentChats: (agentId: string, messages: ChatMessage[]) => void;
  triggerToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
  addAlert: (condition: string, channel: string) => void;
  deleteAlert: (id: string) => void;
  clearChat: (chatId: string) => void;
  recentExplorations: string[];
  showUpgradeModal: (title: string, message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_AGENTS: Agent[] = [];

const INITIAL_RULES: Record<string, Rule[]> = {};

const INITIAL_ALERTS: Alert[] = [];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  public: [
    {
      id: "m-1",
      sender: "agent",
      text: "Welcome to BlockGENT's Public Intelligence Explorer! You can scan any wallet address on the Arc blockchain or ask about recent onchain activities. Try typing a wallet address or selecting a prompt chip below.",
      timestamp: "15:10",
    },
  ],
};

const INITIAL_ACTIVITY: Activity[] = [];

import { UpgradeModal } from "../components/UpgradeModal";

export const AppContextInnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [explorerWallet, setExplorerWallet] = useState<string>("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
  const [recentExplorations, setRecentExplorations] = useState<string[]>([]);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, title: "", message: "" });
  
  const showUpgradeModal = (title: string, message: string) => setUpgradeModal({ isOpen: true, title, message });
  const hideUpgradeModal = () => setUpgradeModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recent_explorations");
      if (stored) {
        try {
          setRecentExplorations(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        const initial = ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F"];
        setRecentExplorations(initial);
        localStorage.setItem("recent_explorations", JSON.stringify(initial));
      }
    }
  }, []);
  const { user: privyUser, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  // Automatically sync your real Privy EVM wallet address and balances into the frontend session
  useEffect(() => {
    const activeWallet = privyUser?.wallet || wallets?.[0];
    if (authenticated && activeWallet?.address) {
      const address = activeWallet.address;
      setConnectedWallet((prev) => {
        if (prev && prev.address === address) return prev;
        return {
          address,
          balanceUSDC: 0,
          balanceEURC: 0,
          connected: true,
          type: (activeWallet as any).wallet_client_type === "privy" || (activeWallet as any).walletClientType === "privy" || (activeWallet as any).connector_type === "embedded" || (activeWallet as any).connectorType === "embedded" ? "Privy Embedded" : "MetaMask",
        };
      });
      setExplorerWallet(address);
      setRecentExplorations((prev) => {
        if (prev.some((addr) => addr.toLowerCase() === address.toLowerCase())) return prev;
        const next = [address, ...prev].slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem("recent_explorations", JSON.stringify(next));
        }
        return next;
      });

      // Asynchronously fetch live balances from the Arc Testnet RPC node
      const fetchBalances = async () => {
        try {
          // 1. Fetch native gas balance (on Arc L1, native gas is native USDC, scaled to 18 decimals)
          const nativeRes = await fetch("https://rpc.testnet.arc.network", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBalance",
              params: [address, "latest"],
              id: 1,
            }),
          });
          const nativeData = await nativeRes.json();
          let nativeBalance = 0;
          if (nativeData.result) {
            const wei = BigInt(nativeData.result);
            nativeBalance = Number(wei) / 1e18;
          }

          // 2. Fetch ERC-20 USDC balance (0x3600000000000000000000000000000000000000, 6 decimals)
          const cleanAddr = address.toLowerCase().replace("0x", "");
          const dataPayload = `0x70a08231000000000000000000000000${cleanAddr.padStart(64, "0")}`;
          const erc20Res = await fetch("https://rpc.testnet.arc.network", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_call",
              params: [
                {
                  to: "0x3600000000000000000000000000000000000000",
                  data: dataPayload,
                },
                "latest",
              ],
              id: 2,
            }),
          });
          const erc20Data = await erc20Res.json();
          let erc20Balance = 0;
          if (erc20Data.result && erc20Data.result !== "0x") {
            const rawVal = BigInt(erc20Data.result);
            erc20Balance = Number(rawVal) / 1e6;
          }

          setConnectedWallet({
            address,
            balanceUSDC: nativeBalance || erc20Balance,
            balanceEURC: 0,
            connected: true,
            type: (activeWallet as any).wallet_client_type === "privy" || (activeWallet as any).walletClientType === "privy" || (activeWallet as any).connector_type === "embedded" || (activeWallet as any).connectorType === "embedded" ? "Privy Embedded" : "MetaMask",
          });
        } catch (err) {
          console.error("Error fetching live Arc Testnet balances:", err);
        }
      };

      fetchBalances();
    } else if (!authenticated) {
      setConnectedWallet(null);
      setExplorerWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
    }
  }, [authenticated, privyUser, wallets]);

  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Load agents from NestJS backend when user is authenticated
  useEffect(() => {
    if (authenticated) {
      const loadAgents = async () => {
        setIsLoadingAgents(true);
        try {
          const token = await getAccessToken();
          if (!token) return;

          const res = await fetch(`${getBackendUrl()}/agents`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const mappedAgents = data.map((a: any) => {
              const usdcObj = a.balances?.find((b: any) =>
                b.token?.symbol?.toLowerCase().includes("usdc")
              );
              const eurcObj = a.balances?.find((b: any) =>
                b.token?.symbol?.toLowerCase().includes("eurc")
              );

              const activeRules = a.rules?.filter((r: any) => r.status === 'active') ?? [];

              return {
                id: a.id,
                name: a.name,
                model: a.configuration?.model || "Claude 3.5 Sonnet",
                status: a.status || "active",
                wallet: a.wallet?.address || "No Wallet",
                balance: usdcObj?.amount ? Number(usdcObj.amount) : 0,
                balanceEURC: eurcObj?.amount ? Number(eurcObj.amount) : 0,
                token: "USDC",
                created: a.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
                rulesCount: activeRules.length,
                successRate: 100,
                gasSpent: 0,
              };
            });

            // Sync rules per agent
            const rulesMap: Record<string, any[]> = {};
            data.forEach((a: any) => {
              rulesMap[a.id] = (a.rules || []).map((r: any) => ({
                id: r.id,
                text: r.naturalRuleText,
                trigger: "Balance Threshold",
                action: "Swap/Transfer",
                active: r.status === "active",
                lastTriggered: r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never",
              }));
            });
            setRules(rulesMap);

            setAgents(mappedAgents);
          }
        } catch (err) {
          console.error("Error loading agents from backend:", err);
        } finally {
          setIsLoadingAgents(false);
        }
      };
      loadAgents();

      // Automatically refresh balances every 10 seconds without needing manual page refreshes
      const intervalId = setInterval(() => {
        loadAgents();
      }, 10000);

      return () => clearInterval(intervalId);
    } else {
      setAgents(INITIAL_AGENTS);
      setIsLoadingAgents(false);
    }
  }, [authenticated]);
  const [rules, setRules] = useState<Record<string, Rule[]>>(INITIAL_RULES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(INITIAL_CHATS);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("blockgent_chats");
      if (stored) {
        try {
          setChats(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse chats from localStorage:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && chats !== INITIAL_CHATS) {
      localStorage.setItem("blockgent_chats", JSON.stringify(chats));
    }
  }, [chats]);
  const [activityLog, setActivityLog] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auto-connect wallet simulation for testing purposes if desired,
  // but let's keep it clean so users can onboarding connect it!

  const connectWallet = (address?: string) => {
    const defaultAddress = address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    setConnectedWallet({
      address: defaultAddress,
      balanceUSDC: 12531.79,
      balanceEURC: 842.15,
      connected: true,
      type: "MetaMask",
    });
    triggerToast("Wallet connected successfully!", "success");
    // Add activity
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      type: "transfer",
      title: "Wallet Connected",
      description: `Primary wallet connected: ${defaultAddress.slice(0, 6)}...${defaultAddress.slice(-4)}`,
      wallet: defaultAddress,
      status: "success",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setActivityLog((prev) => [newAct, ...prev]);
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    triggerToast("Wallet disconnected.", "info");
  };

  const searchWallet = (address: string) => {
    if (!address.startsWith("0x") || address.length < 10) {
      triggerToast("Invalid wallet address format. Must start with 0x.", "error");
      return;
    }
    setExplorerWallet(address);
    triggerToast(`Loaded data for wallet ${address.slice(0, 6)}...${address.slice(-4)}`, "success");
    setRecentExplorations((prev) => {
      const filtered = prev.filter((addr) => addr.toLowerCase() !== address.toLowerCase());
      const next = [address, ...filtered].slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("recent_explorations", JSON.stringify(next));
      }
      return next;
    });
  };

  const addAgent = async (name: string, model: string, initialRuleText?: string, llmConfig?: { provider: string; apiKey: string }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        triggerToast("Not authenticated with Privy.", "error");
        return "";
      }

      triggerToast(`Provisioning Circle wallet for "${name}"...`, "info");

      const res = await fetch(`${getBackendUrl()}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          configuration: {
            model,
            provider: llmConfig?.provider ?? "anthropic",
            // NOTE: API key is sent securely to backend; never stored in frontend state beyond this call
            apiKey: llmConfig?.apiKey ?? "",
            initialRuleText,
            rulesCount: initialRuleText ? 1 : 0,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create agent wallet in backend");
      }

      const a = await res.json();
      
      const newAgent: Agent = {
        id: a.id,
        name: a.name,
        model,
        status: "active",
        wallet: a.wallet?.address || "No Wallet",
        balance: 0,
        token: "USDC",
        created: a.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
        rulesCount: initialRuleText ? 1 : 0,
        successRate: 100.0,
        gasSpent: 0.0,
      };

      setAgents((prev) => [...prev, newAgent]);

      // Initial rule if provided
      if (initialRuleText) {
        const newRule: Rule = {
          id: `rule-${Date.now()}`,
          text: initialRuleText,
          trigger: "Natural Language Condition",
          action: "Custom Action",
          active: true,
          lastTriggered: "Never",
        };
        setRules((prev) => ({
          ...prev,
          [a.id]: [newRule],
        }));
      } else {
        setRules((prev) => ({
          ...prev,
          [a.id]: [],
        }));
      }

      // Initialize chat
      setChats((prev) => ({
        ...prev,
        [a.id]: [
          {
            id: `m-${Date.now()}`,
            sender: "agent",
            text: `Hello! I am ${name}, your new Personal Wallet Agent powered by the ${model} model. My Circle Agent Wallet is ready: ${a.wallet?.address}. Please define rules or chat with me to begin.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));

      // Add activity
      const newAct: Activity = {
        id: `act-${Date.now()}`,
        type: "agent_creation",
        title: `Agent Created: ${name}`,
        description: `Provisioned agent wallet ${a.wallet?.address?.slice(0, 8)}...`,
        wallet: a.wallet?.address || "",
        status: "success",
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      };
      setActivityLog((prev) => [newAct, ...prev]);

      triggerToast(`Agent "${name}" deployed successfully!`, "success");
      return a.id;
    } catch (err: any) {
      console.error("Failed to deploy agent wallet:", err);
      if (err.message?.toLowerCase().includes("limit") || err.message?.toLowerCase().includes("upgrade")) {
        showUpgradeModal("Agent Limit Reached", err.message);
      } else {
        triggerToast(`Deployment failed: ${err.message}`, "error");
      }
      return "";
    }
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextStatus: Agent["status"] =
            a.status === "active" ? "paused" : a.status === "paused" ? "active" : "active";
          triggerToast(`Agent "${a.name}" is now ${nextStatus}.`, "info");
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const addRule = (agentId: string, ruleText: string, trigger?: string, action?: string) => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      text: ruleText,
      trigger: trigger || "Custom Trigger",
      action: action || "Custom Action",
      active: true,
      lastTriggered: "Never",
    };

    setRules((prev) => {
      const agentRules = prev[agentId] || [];
      return {
        ...prev,
        [agentId]: [...agentRules, newRule],
      };
    });

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return { ...a, rulesCount: a.rulesCount + 1 };
        }
        return a;
      })
    );

    // Add message to agent chat
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    addChatMessage(agentId, `I have created and activated the rule: "${ruleText}".`, "agent");

    triggerToast("Automation rule added and activated.", "success");
  };

  const toggleRule = (agentId: string, ruleId: string) => {
    setRules((prev) => {
      const agentRules = prev[agentId] || [];
      const updated = agentRules.map((r) => {
        if (r.id === ruleId) {
          const nextState = !r.active;
          triggerToast(`Rule ${nextState ? "activated" : "deactivated"}.`, "info");
          return { ...r, active: nextState };
        }
        return r;
      });
      return {
        ...prev,
        [agentId]: updated,
      };
    });
  };

  const deleteRule = (agentId: string, ruleId: string) => {
    setRules((prev) => {
      const agentRules = prev[agentId] || [];
      return {
        ...prev,
        [agentId]: agentRules.filter((r) => r.id !== ruleId),
      };
    });

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return { ...a, rulesCount: Math.max(0, a.rulesCount - 1) };
        }
        return a;
      })
    );

    triggerToast("Automation rule deleted.", "info");
  };

  const addChatMessage = (chatId: string, text: string, sender: "user" | "agent", data?: any) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      data,
    };

    setChats((prev) => {
      const thread = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...thread, newMessage],
      };
    });
  };

  const setAgentChats = (agentId: string, messages: ChatMessage[]) => {
    setChats((prev) => ({
      ...prev,
      [agentId]: messages,
    }));
  };

  const clearChat = (chatId: string) => {
    setChats((prev) => ({
      ...prev,
      [chatId]: [],
    }));
  };

  const triggerToast = (message: string, type: Toast["type"]) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAlert = (condition: string, channel: string) => {
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      condition,
      channel,
      active: true,
      created: new Date().toISOString().split("T")[0],
    };
    setAlerts((prev) => [newAlert, ...prev]);
    triggerToast("Custom alert created.", "success");
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    triggerToast("Alert removed.", "info");
  };

  return (
    <AppContext.Provider
      value={{
        connectedWallet,
        explorerWallet,
        agents,
        rules,
        alerts,
        chats,
        activityLog,
        toasts,
        isLoadingAgents,
        connectWallet,
        disconnectWallet,
        searchWallet,
        addAgent,
        toggleAgentStatus,
        addRule,
        toggleRule,
        deleteRule,
        addChatMessage,
        setAgentChats,
        triggerToast,
        removeToast,
        addAlert,
        deleteAlert,
        clearChat,
        recentExplorations,
        showUpgradeModal,
      }}
    >
      {children}
      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={hideUpgradeModal} 
        title={upgradeModal.title} 
        message={upgradeModal.message} 
      />
    </AppContext.Provider>
  );
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id";

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["google", "wallet", "email"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
      }}
    >
      <AppContextInnerProvider>
        {children}
      </AppContextInnerProvider>
    </PrivyProvider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
};
