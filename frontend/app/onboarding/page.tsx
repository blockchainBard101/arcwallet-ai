"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, getBackendUrl } from "../context/AppContext";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet, ArrowLeft, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { connectWallet, triggerToast } = useApp();
  const { login, authenticated, getAccessToken } = usePrivy();

  const [step, setStep] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Automatically trigger backend sync and redirect as soon as Privy login succeeds
  useEffect(() => {
    const syncWithBackend = async () => {
      if (authenticated) {
        setIsSyncing(true);
        setSyncError(null);
        setStep(2); // Ensure they are on the loading/syncing view

        try {
          const token = await getAccessToken();
          if (token) {
            // Dispatch to NestJS backend silently
            const response = await fetch(`${getBackendUrl()}/auth-test`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token.trim()}`,
                "Content-Type": "application/json",
              },
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to authenticate session on backend.");
            }

            if (data.user?.id) {
              setSyncSuccess(true);
              triggerToast("Secure workspace synchronized!", "success");
              
              // Smooth, instant redirect to the main app dashboard
              setTimeout(() => {
                router.push("/dashboard");
              }, 1000);
            }
          }
        } catch (err: any) {
          setSyncError(err.message || "Unable to sync with the backend. Please try again.");
          triggerToast("Backend synchronization failed.", "error");
        } finally {
          setIsSyncing(false);
        }
      }
    };
    syncWithBackend();
  }, [authenticated]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 relative min-h-screen bg-background">
      {/* Visual neon background glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel border-[#22252F] bg-[#15161C] max-w-md w-full p-8 shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && (
          <div className="flex flex-col gap-5 text-center items-center animate-slide-in">
            <div className="w-14 h-14 rounded-2xl bg-neon-blue flex items-center justify-center text-slate-950">
              <Sparkles className="w-7 h-7" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome to ArcWallet AI</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Connect your account to deploy your secure AI workspace. We will provision your human signer wallet and link your dedicated Circle autonomous agents.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-4 w-full py-3 px-6 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Onboarding Setup
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PRIVY AUTH & SILENT BACKEND SYNC */}
        {step === 2 && (
          <div className="flex flex-col gap-5 text-center items-center animate-slide-in">
            {!isSyncing && !syncSuccess && !syncError ? (
              // Initial Login Trigger View
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#15161C] border border-[#22252F] flex items-center justify-center text-slate-300 shrink-0">
                  <Wallet className="w-7 h-7" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Onboard with Privy ID</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Authenticate using your Google account or connect a Web3 wallet via Privy. No gas or transactions are required.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-2">
                  <button
                    onClick={login}
                    className="w-full py-3 px-4 rounded-xl border border-neon-blue/20 bg-neon-blue/5 hover:bg-neon-blue/10 transition-colors flex items-center justify-center gap-2.5 cursor-pointer text-xs font-bold text-slate-200"
                  >
                    <ShieldCheck className="w-5 h-5 text-neon-blue shrink-0" />
                    Connect with Privy (Google / Wallet)
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-3 px-4 rounded-xl border border-transparent text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </button>
                </div>
              </>
            ) : isSyncing ? (
              // Silent backend DB sync loader
              <>
                <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Synchronizing Workspace</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Linking your Privy credentials and registering your secure PostgreSQL database records...
                  </p>
                </div>
              </>
            ) : syncSuccess ? (
              // Success Screen just before instant redirect
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Setup Completed!</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Workspace successfully synced. Redirecting you to the dashboard...
                  </p>
                </div>
              </>
            ) : (
              // Sync Error view with simple retry trigger
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Synchronization Failed</h2>
                  <p className="text-xs text-rose-400 leading-relaxed max-w-xs mx-auto font-mono">
                    {syncError}
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-2">
                  <button
                    onClick={login}
                    className="w-full py-3 px-4 rounded-xl border border-neon-blue/20 bg-neon-blue/5 hover:bg-neon-blue/10 transition-colors flex items-center justify-center gap-2.5 cursor-pointer text-xs font-bold text-slate-200"
                  >
                    Retry Connection
                  </button>
                  <button
                    onClick={() => {
                      setSyncError(null);
                      setStep(1);
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-transparent text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
