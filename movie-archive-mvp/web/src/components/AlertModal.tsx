import { useEffect } from "react";
import type { AlertPayload } from "../hooks/useAlert";

interface AlertModalProps {
  alert: AlertPayload | null;
  onDismiss: () => void;
}

export default function AlertModal({ alert, onDismiss }: AlertModalProps) {
  useEffect(() => {
    if (!alert?.time) return;
    const timer = setTimeout(onDismiss, alert.time * 1000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {alert.title}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {alert.text}
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onDismiss}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-xl shadow-glow hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
