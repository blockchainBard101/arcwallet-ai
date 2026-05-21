"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export interface Wallet {
  address: string;
  balanceUSDC: number;
  balanceARC: number;
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
  connectWallet: (address?: string) => void;
  disconnectWallet: () => void;
  searchWallet: (address: string) => void;
  addAgent: (name: string, model: string, initialRuleText?: string) => string;
  toggleAgentStatus: (agentId: string) => void;
  addRule: (agentId: string, ruleText: string, trigger?: string, action?: string) => void;
  toggleRule: (agentId: string, ruleId: string) => void;
  deleteRule: (agentId: string, ruleId: string) => void;
  addChatMessage: (chatId: string, text: string, sender: "user" | "agent", data?: any) => void;
  triggerToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
  addAlert: (condition: string, channel: string) => void;
  deleteAlert: (id: string) => void;
  clearChat: (chatId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Yield Harvester",
    model: "Claude 3.5 Sonnet",
    status: "active",
    wallet: "0xArcAgent1A2zP1eP5q77ab",
    balance: 1450.0,
    token: "USDC",
    created: "2026-05-10",
    rulesCount: 3,
    successRate: 98.4,
    gasSpent: 1.25,
  },
  {
    id: "agent-2",
    name: "Arbitrage Scout",
    model: "Grok 2.0",
    status: "idle",
    wallet: "0xArcAgent2B3yQ2fR6r88bc",
    balance: 842.15,
    token: "ARC",
    created: "2026-05-15",
    rulesCount: 1,
    successRate: 100,
    gasSpent: 0.45,
  },
];

const INITIAL_RULES: Record<string, Rule[]> = {
  "agent-1": [
    {
      id: "rule-1",
      text: "If USDC balance is greater than 1000, swap 100 USDC to ARC weekly.",
      trigger: "Balance (> 1000 USDC)",
      action: "Swap 100 USDC to ARC",
      active: true,
      lastTriggered: "2026-05-20 14:32",
    },
    {
      id: "rule-2",
      text: "Alert me on push notification if transaction size exceeds 500 USDC.",
      trigger: "Transaction Size (> 500 USDC)",
      action: "Push Alert",
      active: true,
      lastTriggered: "Never",
    },
    {
      id: "rule-3",
      text: "Auto-rebalance portfolio to 80% USDC and 20% ARC every Sunday at 00:00 UTC.",
      trigger: "Scheduled (Weekly)",
      action: "Rebalance Portfolio",
      active: false,
      lastTriggered: "2026-05-18 00:00",
    },
  ],
  "agent-2": [
    {
      id: "rule-4",
      text: "If price of ARC drops below 0.40 USDC, auto-buy 200 ARC with USDC from agent wallet.",
      trigger: "Price (ARC < 0.40 USDC)",
      action: "Buy 200 ARC",
      active: true,
      lastTriggered: "Never",
    },
  ],
};

const INITIAL_ALERTS: Alert[] = [
  {
    id: "alert-1",
    condition: "USDC Balance drops below 500",
    channel: "In-App + Email",
    active: true,
    created: "2026-05-12",
  },
  {
    id: "alert-2",
    condition: "Gas price on Arc L1 > 50 Gwei",
    channel: "In-App",
    active: false,
    created: "2026-05-18",
  },
];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  public: [
    {
      id: "m-1",
      sender: "agent",
      text: "Welcome to ArcWallet AI's Public Intelligence Explorer! You can scan any wallet address on the Arc blockchain or ask about recent onchain activities. Try typing a wallet address or selecting a prompt chip below.",
      timestamp: "15:10",
    },
  ],
  "agent-1": [
    {
      id: "m-2",
      sender: "agent",
      text: "Yield Harvester online. Ready to execute rules and monitor the Arc blockchain. I am currently running 2 active automated rules. What would you like to check?",
      timestamp: "12:00",
    },
  ],
  "agent-2": [
    {
      id: "m-3",
      sender: "agent",
      text: "Arbitrage Scout initialized. Connected to Circle Agent Wallet. Standing by.",
      timestamp: "12:05",
    },
  ],
};

const INITIAL_ACTIVITY: Activity[] = [
  {
    id: "act-1",
    type: "rule_trigger",
    title: "Rule Executed: Auto-Reinvest",
    description: "Yield Harvester swapped 100 USDC for 204.5 ARC successfully.",
    wallet: "0xArcAgent1A2zP1eP5q77ab",
    status: "success",
    value: "100.00 USDC",
    timestamp: "2026-05-20 14:32",
  },
  {
    id: "act-2",
    type: "swap",
    title: "Portfolio Swap",
    description: "Swapped 500 USDC for 1,020 ARC.",
    wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    status: "success",
    value: "500.00 USDC",
    timestamp: "2026-05-19 09:15",
  },
  {
    id: "act-3",
    type: "transfer",
    title: "Bridge Deposit",
    description: "Bridged 2,500 USDC from Ethereum to Arc.",
    wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    status: "success",
    value: "2,500.00 USDC",
    timestamp: "2026-05-17 16:40",
  },
  {
    id: "act-4",
    type: "agent_creation",
    title: "Agent Created: Arbitrage Scout",
    description: "Provisioned Circle Agent Wallet 0xArcAgent2B...bc.",
    wallet: "0xArcAgent2B3yQ2fR6r88bc",
    status: "success",
    timestamp: "2026-05-15 12:05",
  },
];

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [explorerWallet, setExplorerWallet] = useState<string>("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [rules, setRules] = useState<Record<string, Rule[]>>(INITIAL_RULES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(INITIAL_CHATS);
  const [activityLog, setActivityLog] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auto-connect wallet simulation for testing purposes if desired,
  // but let's keep it clean so users can onboarding connect it!

  const connectWallet = (address?: string) => {
    const defaultAddress = address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    setConnectedWallet({
      address: defaultAddress,
      balanceUSDC: 12531.79,
      balanceARC: 842.15,
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
  };

  const addAgent = (name: string, model: string, initialRuleText?: string) => {
    const id = `agent-${Date.now()}`;
    const walletAddress = `0xArcAgent${Math.random().toString(36).substring(2, 8)}Wallet`;
    const newAgent: Agent = {
      id,
      name,
      model,
      status: "active",
      wallet: walletAddress,
      balance: 100.0, // initial USDC top-up
      token: "USDC",
      created: new Date().toISOString().split("T")[0],
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
        [id]: [newRule],
      }));
    } else {
      setRules((prev) => ({
        ...prev,
        [id]: [],
      }));
    }

    // Initialize chat
    setChats((prev) => ({
      ...prev,
      [id]: [
        {
          id: `m-${Date.now()}`,
          sender: "agent",
          text: `Hello! I am ${name}, your new Personal Wallet Agent powered by the ${model} model. My Circle Agent Wallet is ready: ${walletAddress}. Please define rules or chat with me to begin.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    }));

    // Add activity
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      type: "agent_creation",
      title: `Agent Created: ${name}`,
      description: `Provisioned agent wallet ${walletAddress.slice(0, 8)}...`,
      wallet: walletAddress,
      status: "success",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setActivityLog((prev) => [newAct, ...prev]);

    triggerToast(`Agent "${name}" created successfully!`, "success");
    return id;
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
        connectWallet,
        disconnectWallet,
        searchWallet,
        addAgent,
        toggleAgentStatus,
        addRule,
        toggleRule,
        deleteRule,
        addChatMessage,
        triggerToast,
        removeToast,
        addAlert,
        deleteAlert,
        clearChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
};
