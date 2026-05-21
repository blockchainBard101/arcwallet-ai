"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  Bot,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  ExternalLink,
} from "lucide-react";

export default function ActivityPage() {
  const { activityLog, triggerToast } = useApp();

  const [selectedWallet, setSelectedWallet] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const handleExport = () => {
    triggerToast("Exporting activity logs... CSV download started.", "success");
  };

  // Filter logic
  const filteredActivities = activityLog.filter((act) => {
    // Wallet filter
    if (selectedWallet !== "all") {
      if (selectedWallet === "primary" && act.wallet.includes("Agent")) return false;
      if (selectedWallet === "agents" && !act.wallet.includes("Agent")) return false;
    }

    // Type filter
    if (selectedType !== "all") {
      if (selectedType === "swaps" && act.type !== "swap" && act.type !== "rule_trigger") return false;
      if (selectedType === "transfers" && act.type !== "transfer") return false;
      if (selectedType === "agents" && act.type !== "agent_creation") return false;
    }

    // Status filter
    if (selectedStatus !== "all" && act.status !== selectedStatus) return false;

    return true;
  });

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "swap":
      case "rule_trigger":
        return (
          <div className="w-9 h-9 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0 z-10">
            <ArrowLeftRight className="w-4.5 h-4.5" />
          </div>
        );
      case "transfer":
        return (
          <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0 z-10">
            <ArrowDownLeft className="w-4.5 h-4.5" />
          </div>
        );
      case "agent_creation":
        return (
          <div className="w-9 h-9 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple shrink-0 z-10">
            <Bot className="w-4.5 h-4.5" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 z-10">
            <Bell className="w-4.5 h-4.5" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold bg-rose-950/20 border border-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-amber-950/20 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
            <Clock className="w-3 h-3 animate-spin" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252F] pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Activity & History</h1>
          <p className="text-xs text-slate-400">Global audit logs, smart contract triggers, and transaction hashes.</p>
        </div>
        
        <button
          onClick={handleExport}
          className="h-10 px-4 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 text-neon-cyan" />
          Export Audit Trail
        </button>
      </div>

      {/* Filters grid panel */}
      <div className="glass-panel p-4.5 border-[#22252F] bg-[#15161C] grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Wallet Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-neon-blue" />
            Target Wallet
          </label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
          >
            <option value="all">All Wallets</option>
            <option value="primary">Primary Connected Wallet</option>
            <option value="agents">Circle Agent Wallets</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-neon-cyan" />
            Event Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
          >
            <option value="all">All Types</option>
            <option value="swaps">Token Swaps & Triggers</option>
            <option value="transfers">Bridges & Transfers</option>
            <option value="agents">Agent Deployments</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-neon-purple" />
            Execution Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#090A0F] border border-[#22252F] text-xs text-white focus:outline-none focus:border-neon-blue/50"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success Only</option>
            <option value="pending">Pending Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

      </div>

      {/* Vertical Timeline Feed */}
      <div className="glass-panel p-6 border-[#22252F] bg-[#15161C] flex flex-col gap-6 relative min-h-[300px]">
        {/* Continuous Timeline Line */}
        <div className="absolute left-[34px] top-8 bottom-8 w-[2px] bg-[#22252F]" />

        {filteredActivities.length > 0 ? (
          <div className="flex flex-col gap-6">
            {filteredActivities.map((act) => (
              <div key={act.id} className="flex gap-4 relative group items-start">
                
                {/* Visual Icon */}
                {getTimelineIcon(act.type)}

                {/* Timeline Content Card */}
                <div className="flex-1 p-4 rounded-xl border border-[#22252F] bg-[#090A0F]/40 hover:border-[#22252F]/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-100">{act.title}</span>
                      {getStatusBadge(act.status)}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{act.description}</p>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                      Node: {act.wallet.slice(0, 10)}...{act.wallet.slice(-4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="flex flex-col text-right font-mono text-xs">
                      {act.value && <span className="text-white font-bold">{act.value}</span>}
                      <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                    </div>

                    <a
                      href="#"
                      className="p-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-500 gap-1.5">
            <span className="font-semibold text-xs">No matching actions detected</span>
            <p className="text-[10px] text-slate-600 font-mono">Try adjusting your filters or triggering simulated transactions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
