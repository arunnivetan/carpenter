import React from 'react';
import { Check, X } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#4A3E3D] text-[#FDF6EE] px-4 py-2.5 rounded-full text-xs font-bold shadow-lg z-50 tracking-wide select-none animate-slide-up flex items-center space-x-1.5 min-w-[140px] justify-center border border-white/5">
      {toast.type === 'success' ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
      ) : (
        <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
