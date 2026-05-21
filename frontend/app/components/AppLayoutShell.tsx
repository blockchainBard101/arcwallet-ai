"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ToastContainer from "./Toast";

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that don't get the app layout chrome (sidebar, navbar)
  const isMarketingPage = pathname === "/" || pathname === "/onboarding";

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
