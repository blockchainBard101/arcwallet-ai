"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ToastContainer from "./Toast";
import { Loader2 } from "lucide-react";

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  // Pages that don't get the app layout chrome (sidebar, navbar)
  const isMarketingPage = pathname === "/" || pathname === "/onboarding";

  useEffect(() => {
    if (ready && !authenticated && !isMarketingPage) {
      router.push("/onboarding");
    }
  }, [ready, authenticated, isMarketingPage, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center relative w-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col gap-4 text-center items-center relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-extrabold text-white tracking-tight">Initializing Session</h2>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Setting up your secure cryptography environment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated && !isMarketingPage) {
    // Return a clean loading state while the redirect happens to prevent layout/UI flashing
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center relative w-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col gap-4 text-center items-center relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-extrabold text-white tracking-tight">Redirecting to Login</h2>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Please authenticate to access your workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isMarketingPage) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col relative w-full overflow-x-hidden">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-slate-100 flex w-full overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main app body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic page contents */}
        <main className="flex-1 overflow-y-auto bg-transparent p-6 relative">
          <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col gap-6 animate-slide-in">
            {children}
          </div>
        </main>
      </div>

      {/* Dynamic Toast notifications */}
      <ToastContainer />
    </div>
  );
}

