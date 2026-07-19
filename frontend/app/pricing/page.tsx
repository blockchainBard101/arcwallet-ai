"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Check, ArrowRight, Zap, Shield, Bot, CreditCard } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const { getAccessToken, authenticated, login } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async (tier: string) => {
    if (!authenticated) {
      login();
      return;
    }

    setLoading(true);
    try {
      // In a real app, we'd trigger a Circle App Kit USDC payment transaction here
      // For the MVP, we just mock the upgrade directly.
      const token = await getAccessToken();
      const res = await fetch("http://localhost:3001/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/settings");
        }, 2000);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-12 px-4 max-w-5xl mx-auto min-h-[calc(100vh-6rem)]">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Automate DeFi with <span className="text-neon-blue">BlockGENT</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Scale your autonomous trading strategies. Pay only for what you use, or unlock unlimited potential with our premium plans.
        </p>
      </div>

      {success && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 font-bold flex items-center justify-center w-full max-w-2xl">
          Upgrade successful! Redirecting to your settings...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* Free Tier */}
        <div className="flex flex-col p-6 rounded-2xl border border-[#22252F] bg-[#090A0F] glass-panel relative">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$0</span>
              <span className="text-slate-500 text-sm">/ forever</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            Perfect for exploring autonomous agents and testing strategies on Arc Testnet.
          </p>
          
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              1 AI Agent
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Up to 3 active automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              50 LLM actions / month
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-500">
              <Check className="w-4 h-4 text-slate-700 shrink-0" />
              No Nanopayment (x402) access
            </li>
          </ul>

          <button 
            disabled
            className="w-full py-3 rounded-xl border border-[#22252F] text-slate-500 font-bold text-xs bg-[#15161C] cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Tier (Recommended) */}
        <div className="flex flex-col p-6 rounded-2xl border border-neon-blue bg-[#090A0F]/80 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative scale-105 z-10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-blue text-slate-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Most Popular
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neon-blue mb-2">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$20</span>
              <span className="text-slate-500 text-sm">/ month</span>
            </div>
            <span className="text-[10px] text-neon-blue/60 mt-1 block">Paid natively in USDC on Arc</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            For active traders needing sophisticated multi-agent setups and live data.
          </p>
          
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              Up to 3 AI Agents
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              Unlimited automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              500 LLM actions / month
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              $5.00 monthly Nanopayments budget
            </li>
          </ul>

          <button 
            onClick={() => handleUpgrade("pro")}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Processing..." : "Upgrade to Pro"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Power Tier */}
        <div className="flex flex-col p-6 rounded-2xl border border-[#22252F] bg-[#090A0F] relative">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Power</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$99</span>
              <span className="text-slate-500 text-sm">/ month</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            Unlimited automation potential for serious DeFi power users.
          </p>
          
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Up to 10 AI Agents
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Unlimited automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Unlimited LLM actions
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              $25.00 monthly Nanopayments budget
            </li>
          </ul>

          <button 
            onClick={() => handleUpgrade("power")}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-[#22252F] text-white hover:border-white transition-colors font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Processing..." : "Upgrade to Power"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
}
