"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ToastContainer from "./Toast";
import { Loader2 } from "lucide-react"; // kept for potential future use

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Pages that don't get the app layout chrome (sidebar, navbar)
  const isMarketingPage = pathname === "/" || pathname === "/onboarding";

  useEffect(() => {
    if (ready && !authenticated && !isMarketingPage) {
      router.push("/onboarding");
    }
  }, [ready, authenticated, isMarketingPage, router]);

  if (!ready) {
    return (
      <div className="min-h-[100dvh] bg-background text-slate-100 flex flex-col justify-center items-center relative w-full overflow-hidden">
        {/* Ambient glow bloom — bounded, HyperFrames css adapter */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/6 rounded-full blur-[100px] pointer-events-none animate-glow-bloom" />
        
        <div className="flex flex-col gap-5 text-center items-center relative z-10 animate-spring-pop">
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-[#090A0F] border border-neon-blue/20">
            <Image src="/blockgent.png" alt="BlockGENT" width={56} height={56} className="object-contain" priority />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white tracking-tight">Initializing Session</h2>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Setting up your secure cryptography environment...
            </p>
          </div>
          {/* Stagger-dot loader — CSS waterfall pattern */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-neon-blue"
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 200}ms infinite`,
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated && !isMarketingPage) {
    return (
      <div className="min-h-[100dvh] bg-background text-slate-100 flex flex-col justify-center items-center relative w-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/6 rounded-full blur-[100px] pointer-events-none animate-glow-bloom" />
        <div className="flex flex-col gap-5 text-center items-center relative z-10 animate-spring-pop">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-[#090A0F] border border-neon-blue/20">
            <Image src="/blockgent.png" alt="BlockGENT" width={56} height={56} className="object-contain" priority />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white tracking-tight">Redirecting to Login</h2>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Please authenticate to access your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-neon-blue"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 200}ms infinite`, opacity: 0.5 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMarketingPage) {
    return (
      <div className="min-h-[100dvh] bg-background text-slate-100 flex flex-col relative w-full overflow-x-hidden">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background text-slate-100 flex w-full overflow-hidden">
      {/* Mobile backdrop overlay — closes sidebar when tapped */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Dynamic page contents */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 relative">
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
