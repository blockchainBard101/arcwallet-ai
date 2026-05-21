"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />,
    info: <Info className="w-8 h-8 text-neon-blue/80 shrink-0" />,
    success: <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />,
  };

  const confirmColors = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    info: "bg-neon-blue text-slate-950 hover:opacity-90",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#090A0F]/80 backdrop-blur-md transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal Dialog */}
      <div className="relative glass-panel border-[#22252F] bg-[#15161C] max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-slide-in z-50">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-[#22252F] transition-colors cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="flex gap-4">
          <div className="p-2.5 rounded-xl bg-[#090A0F]/50 border border-[#22252F] self-start shrink-0">
            {icons[type]}
          </div>
          
          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#22252F] hover:bg-[#22252F] text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${confirmColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
