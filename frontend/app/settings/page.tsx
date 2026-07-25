"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApp } from "../context/AppContext";
import { User, Wallet, Bell, Shield, Lock, CreditCard, Sparkles, RefreshCw, LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = usePrivy();
  const { connectedWallet, connectWallet, disconnectWallet, triggerToast } = useApp();

  const [username, setUsername] = useState("BlockchainBard");
  const [email, setEmail] = useState("bard@blockchain.io");
  const [activeTab, setActiveTab] = useState("security");

  // Security States
  const [maxTxLimit, setMaxTxLimit] = useState(50);
  const [dailyLimit, setDailyLimit] = useState(500);
  const [allowUnverified, setAllowUnverified] = useState(false);
  const [allowedContracts, setAllowedContracts] = useState("0xCircleSwapL1, 0xAcrossBridgeL1");

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  // Subscription State
  const { getAccessToken } = usePrivy();
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  React.useEffect(() => {
    const fetchSub = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("http://localhost:3001/subscription", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setLoadingSub(false);
      }
    };
    if (activeTab === "subscription") {
      fetchSub();
    }
  }, [activeTab, getAccessToken]);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast("Security guardrails updated successfully!", "success");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast("Profile preferences updated.", "success");
  };

  const tabs = [
    { id: "profile", label: "User Profile", icon: User },
    { id: "wallets", label: "Wallet Nodes", icon: Wallet },
    { id: "notifications", label: "Notification Channels", icon: Bell },
    { id: "security", label: "Security Guardrails", icon: Shield },
    { id: "subscription", label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <div className="flex flex-col gap-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-[#22252F] pb-5">
        <h1 className="text-xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400">Configure global preferences, authentication nodes, and automated safety policies.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Navigation Tabs — horizontal scroll on mobile, vertical column on desktop */}
        <div className="w-full lg:w-60 shrink-0">
          {/* Mobile: horizontal scrollable pill tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? "bg-neon-blue/10 text-white border border-neon-blue/30"
                    : "text-slate-400 hover:text-slate-200 bg-[#15161C] border border-[#22252F]"
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.id ? "text-neon-blue" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop: vertical button list */}
          <div className="hidden lg:flex flex-col gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-neon-blue/10 text-white border-l-2 border-neon-blue"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#22252F]/50"
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? "text-neon-blue" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Panels (Right) */}
        <div className="flex-1 w-full glass-panel border-[#22252F] bg-[#15161C] p-5 md:p-6 overflow-y-auto max-w-4xl">
          
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 animate-slide-in">
              <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
                <span className="text-sm font-bold text-white tracking-tight">User Profile</span>
                <span className="text-[10px] text-slate-500 font-mono">Personal account preferences and identifiers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="self-start px-5 py-2.5 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90 transition-transform active:scale-95"
              >
                Save Profile Changes
              </button>

              <div className="mt-6 border-t border-[#22252F] pt-6 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">Danger Zone</span>
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">Log out of Workspace</span>
                    <span className="text-[10px] text-slate-400">Safely terminate your Privy identity session and linked wallets sync</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      disconnectWallet();
                      router.push("/onboarding");
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Logout Workspace
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: WALLET NODES */}
          {activeTab === "wallets" && (
            <div className="flex flex-col gap-5 animate-slide-in">
              <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
                <span className="text-sm font-bold text-white tracking-tight">Wallet Connection Registry</span>
                <span className="text-[10px] text-slate-500 font-mono">Review active blockchain nodes and API connections</span>
              </div>

              {connectedWallet ? (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">MetaMask Node Connected</span>
                      <span className="text-[10px] font-mono text-emerald-400/80">{connectedWallet.address}</span>
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 rounded-xl border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    Disconnect Node
                  </button>
                </div>
              ) : (
                <div className="p-10 rounded-xl border border-[#22252F] bg-[#090A0F]/40 text-center flex flex-col items-center gap-4">
                  <Wallet className="w-8 h-8 text-slate-500" />
                  <div className="flex flex-col gap-1 text-center">
                    <span className="text-xs font-bold text-slate-300">No primary wallet connected</span>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Connect your MetaMask, Coinbase, or WalletConnect node to authorize autonomous agent actions.
                    </p>
                  </div>
                  <button
                    onClick={() => connectWallet()}
                    className="py-2 px-4 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Connect Wallet Node
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="flex flex-col gap-5 animate-slide-in">
              <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
                <span className="text-sm font-bold text-white tracking-tight">Notification Channels</span>
                <span className="text-[10px] text-slate-500 font-mono">Receive real-time agent signals and transaction receipts</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Email notifications */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#22252F] bg-[#090A0F]/30">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">Email Summaries</span>
                    <span className="text-[10px] text-slate-500">Receive weekly portfolio balance audits</span>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${emailAlerts ? "bg-neon-cyan" : "bg-[#22252F]"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[#090A0F] transition-transform ${emailAlerts ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Telegram notifications */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#22252F] bg-[#090A0F]/30">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">Telegram Bot Notifications</span>
                    <span className="text-[10px] text-slate-500">Instant warnings on contract triggers</span>
                  </div>
                  <button
                    onClick={() => setTelegramAlerts(!telegramAlerts)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${telegramAlerts ? "bg-neon-cyan" : "bg-[#22252F]"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[#090A0F] transition-transform ${telegramAlerts ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Push alerts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#22252F] bg-[#090A0F]/30">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">Browser Push Notifications</span>
                    <span className="text-[10px] text-slate-500">Allow desktop notification badges</span>
                  </div>
                  <button
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${pushAlerts ? "bg-neon-cyan" : "bg-[#22252F]"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[#090A0F] transition-transform ${pushAlerts ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === "security" && (
            <form onSubmit={handleSaveSecurity} className="flex flex-col gap-5 animate-slide-in">
              <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
                <span className="text-sm font-bold text-white tracking-tight">Security & Guardrails Policies</span>
                <span className="text-[10px] text-slate-500 font-mono">Strict rules-enforcement and maximum spend volumes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Single Tx Limit (USDC)</label>
                  <input
                    type="number"
                    value={maxTxLimit}
                    onChange={(e) => setMaxTxLimit(Number(e.target.value))}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 font-mono"
                  />
                  <span className="text-[9px] text-slate-500">Transactions above this threshold require manual signatures.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Spending Limit (USDC)</label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 font-mono"
                  />
                  <span className="text-[9px] text-slate-500">Max cumulative agent transactions per day.</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Smart Contract Whitelist</label>
                <input
                  type="text"
                  value={allowedContracts}
                  onChange={(e) => setAllowedContracts(e.target.value)}
                  className="h-10 px-3.5 rounded-xl bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50 font-mono"
                />
                <span className="text-[9px] text-slate-500">Comma-separated target addresses allowed without custom confirmation.</span>
              </div>

              {/* Block/Toggle unverified */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#22252F] bg-[#090A0F]/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-200">Allow Unverified Contracts</span>
                  <span className="text-[10px] text-slate-500">Allow agents to trade on tokens without source audits</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowUnverified(!allowUnverified)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${allowUnverified ? "bg-neon-cyan" : "bg-[#22252F]"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-[#090A0F] transition-transform ${allowUnverified ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <button
                type="submit"
                className="self-start px-5 py-2.5 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer hover:opacity-90 transition-transform active:scale-95"
              >
                Save Security Policies
              </button>
            </form>
          )}

          {/* TAB 5: SUBSCRIPTION */}
          {activeTab === "subscription" && (
            <div className="flex flex-col gap-5 animate-slide-in">
              <div className="flex flex-col gap-1 border-b border-[#22252F] pb-3">
                <span className="text-sm font-bold text-white tracking-tight">Billing &amp; Plans</span>
                <span className="text-[10px] text-slate-500 font-mono">Manage your subscription tier, quotas, and nanopayment limits</span>
              </div>

              {loadingSub ? (
                <div className="text-xs text-slate-400">Loading subscription data...</div>
              ) : subscription ? (
                <div className="flex flex-col gap-6">
                  {/* Current Plan Overview */}
                  <div className="p-5 rounded-xl border border-neon-blue/20 bg-[#090A0F] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">Current Plan</span>
                      <span className="text-xl font-bold text-white capitalize">{subscription.tier} Tier</span>
                      <span className="text-[10px] text-slate-400">Cycle ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                    {subscription.tier === "free" && (
                      <button 
                        onClick={() => router.push("/pricing")}
                        className="px-4 py-2 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:opacity-90"
                      >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Pro
                      </button>
                    )}
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-[#22252F] bg-[#090A0F]/50 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-300">LLM Operations Used</span>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white font-mono">{subscription.llmCallsUsed}</span>
                        <span className="text-xs text-slate-500 font-mono pb-1">/ {subscription.tier === "free" ? 50 : subscription.tier === "pro" ? 500 : "∞"} calls</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#22252F] rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-neon-blue rounded-full" 
                          style={{ width: `${Math.min(100, (subscription.llmCallsUsed / (subscription.tier === "free" ? 50 : 500)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-[#22252F] bg-[#090A0F]/50 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-300">Nanopayments Used</span>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white font-mono">${subscription.nanopayUsed?.toFixed(2)}</span>
                        <span className="text-xs text-slate-500 font-mono pb-1">/ ${subscription.tier === "free" ? "0.00" : subscription.tier === "pro" ? "5.00" : "∞"} limit</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#22252F] rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-emerald-400 rounded-full" 
                          style={{ width: `${Math.min(100, (subscription.nanopayUsed / (subscription.tier === "free" ? 0.0001 : 5)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-400">Failed to load subscription data.</div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
