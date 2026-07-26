"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApp } from "../context/AppContext";
import {
  Compass,
  Store,
  LayoutDashboard,
  Bot,
  Briefcase,
  Activity,
  Settings,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { agents, rules, isLoadingAgents } = useApp();
  const { logout } = usePrivy();
  const { disconnectWallet } = useApp();


  const menuItems = [
    { name: "Explorer Chat", icon: Compass, path: "/chat" },
    { name: "Agent Marketplace", icon: Store, path: "/marketplace" },
    { name: "Dashboard Explorer", icon: LayoutDashboard, path: "/dashboard" },
    { name: "My Agents", icon: Bot, path: "/agents" },
    { name: "Portfolio Overview", icon: Briefcase, path: "/portfolio" },
    { name: "Activity Feed", icon: Activity, path: "/activity" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleRobotChat = () => {
    if (agents && agents.length > 0) {
      router.push(`/agents/${agents[0].id}`);
    } else {
      router.push("/agents");
    }
  };

  return (
    <aside
      className={[
        // Mobile: fixed overlay drawer, slides in/out from the left
        "fixed inset-y-0 left-0 z-50 w-72",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible, part of normal flow (not fixed)
        "lg:relative lg:translate-x-0 lg:w-66 lg:z-auto lg:inset-auto",
        // Shared visual styles
        "flex flex-col h-full bg-[#090A0F] border-r border-[#22252F] py-6 px-4 shrink-0 justify-between select-none",
      ].join(" ")}
    >
      <div className="flex flex-col gap-8">
        {/* Brand Logo + Mobile Close Button */}
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-[#090A0F] border border-neon-blue/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Image
                src="/blockgent.png"
                alt="BlockGENT"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight">BlockGENT</span>
              <span className="text-[10px] text-neon-cyan font-mono tracking-widest font-semibold uppercase">Circle Stack</span>
            </div>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                  isActive
                    ? "bg-neon-blue/10 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-neon-blue" />
                )}
                
                <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${isActive ? "text-neon-blue" : "text-slate-400 group-hover:text-slate-300"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="h-px bg-[#22252F] my-2" />

          <button
            onClick={async () => {
              await logout();
              disconnectWallet();
              router.push("/onboarding");
            }}
            className="flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all cursor-pointer w-full text-left"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout Workspace</span>
          </button>
        </nav>
      </div>

      {/* Telemetry Status Panel */}
      <div className="glass-panel p-4 relative overflow-hidden flex flex-col gap-3.5 border-[#22252F] bg-[#15161C]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-2.5 z-10">
          <div className="flex items-center justify-between border-b border-[#22252F] pb-2">
            <span className="font-semibold text-xs text-white tracking-wide">
              AI Engine Status
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Online</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[10px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>Active Agents:</span>
              <span className="text-white font-semibold">
                {isLoadingAgents ? (
                  <span className="skeleton w-8 h-3 rounded inline-block" />
                ) : (
                  `${agents.filter((a) => a.status === "active").length} / ${agents.length}`
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Active Rules:</span>
              <span className="text-white font-semibold">
                {isLoadingAgents ? (
                  <span className="skeleton w-12 h-3 rounded inline-block" />
                ) : (
                  `${Object.values(rules).reduce((acc, list) => acc + list.filter((r) => r.active).length, 0)} Running`
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Guardrails:</span>
              <span className="text-emerald-400 font-bold">
                {isLoadingAgents ? (
                  <span className="skeleton w-14 h-3 rounded inline-block" />
                ) : (
                  "Standard"
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRobotChat}
          className="w-full py-2 px-3 rounded-lg bg-neon-blue text-slate-950 font-bold text-xs transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer z-10"
        >
          Manage AI Agents
        </button>

        <button
          onClick={() => router.push("/pricing")}
          className="w-full py-2 px-3 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 font-bold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer z-10 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}
