import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-md text-xs transition-all animate-slide-in ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
                : isError
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}

            <div className="flex-1 font-medium leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-0.5 text-slate-400 hover:text-white rounded shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
