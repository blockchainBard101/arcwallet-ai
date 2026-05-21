"use client";

import React, { useState } from "react";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Activity } from "../context/AppContext";

export default function TransactionTable({ transactions }: { transactions: Activity[] }) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTxs = transactions.filter((tx) => {
    if (filterType === "all") return true;
    if (filterType === "swaps") return tx.type === "swap" || tx.type === "rule_trigger";
    if (filterType === "transfers") return tx.type === "transfer";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "swap":
      case "rule_trigger":
        return (
          <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        );
      case "transfer":
        return (
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[#15161C] border border-[#22252F] flex items-center justify-center text-slate-400 shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold bg-emerald-950/20 border border-emerald-500/20 py-1 px-2 rounded-full w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold bg-rose-950/20 border border-rose-500/20 py-1 px-2 rounded-full w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold bg-amber-950/20 border border-amber-500/20 py-1 px-2 rounded-full w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel border-[#22252F] bg-[#15161C] p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22252F] pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Transactions</span>
          <span className="text-[10px] text-slate-500 font-mono">Recent activity logs on the Arc blockchain</span>
        </div>
        
        {/* Table Filters */}
        <div className="flex items-center gap-1.5 bg-[#090A0F] p-1 rounded-lg border border-[#22252F] self-start sm:self-auto">
          {["all", "swaps", "transfers"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer transition-colors ${
                filterType === type ? "bg-neon-blue text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#22252F] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-2">Type</th>
              <th className="py-3 px-2">Transaction ID</th>
              <th className="py-3 px-2">Description</th>
              <th className="py-3 px-2 font-mono">Value</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#22252F]">
            {filteredTxs.length > 0 ? (
              filteredTxs.map((tx) => (
                <tr key={tx.id} className="text-xs text-slate-300 hover:bg-neon-blue/5 transition-colors group">
                  <td className="py-3.5 px-2">{getIcon(tx.type)}</td>
                  <td className="py-3.5 px-2 font-mono text-[11px] font-medium group-hover:text-neon-cyan transition-colors">
                    <span className="flex items-center gap-1 cursor-pointer">
                      {tx.id.replace("act-", "0x").slice(0, 10)}...{tx.id.slice(-4)}
                      <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-slate-200 max-w-[280px] font-medium leading-relaxed">
                    {tx.description}
                  </td>
                  <td className="py-3.5 px-2 font-mono font-bold text-slate-100">{tx.value || "—"}</td>
                  <td className="py-3.5 px-2">{getStatusBadge(tx.status)}</td>
                  <td className="py-3.5 px-2 text-slate-500 font-medium font-mono">{tx.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs font-semibold">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
