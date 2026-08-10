import React from "react";
import { useRouter } from "next/navigation";
import { Zap, X, ShieldAlert } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  subtitle?: string;
}

export function UpgradeModal({ isOpen, onClose, title, message, subtitle }: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#090A0F]/80 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#15161C] border border-[#22252F] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 flex flex-col gap-6 animate-slide-in select-none">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-lg tracking-tight">{title}</span>
              <span className="text-[10px] text-slate-500 font-mono">{subtitle ?? "Quota Exceeded / Policy Violation"}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#22252F] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#090A0F]/50 border border-[#22252F] rounded-xl p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="w-full py-3 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            View Upgrade Plans
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-[#22252F] bg-transparent text-slate-400 font-semibold text-xs flex items-center justify-center cursor-pointer hover:bg-[#22252F]/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
