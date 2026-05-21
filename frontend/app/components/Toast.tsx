"use client";

import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-neon-cyan shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-emerald-950/20",
    error: "border-rose-500/30 bg-rose-950/20",
    warning: "border-amber-500/30 bg-amber-950/20",
    info: "border-neon-cyan/30 bg-neon-cyan/5",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${borders[toast.type as keyof typeof borders]}`}
    >
      {icons[toast.type as keyof typeof icons]}
      <div className="flex-1 text-sm font-medium text-slate-200">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
