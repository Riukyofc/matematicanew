"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "achievement";
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: Toast["type"], message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string, duration = 3500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);
  
  useEffect(() => {
    const handleAchievement = (e: any) => {
      if (e.detail) {
        addToast("achievement", `Conquista Épica: ${e.detail.emoji} ${e.detail.title}!\n+${e.detail.xpReward} XP`, 6000);
      }
    };
    window.addEventListener("achievement_unlocked", handleAchievement);
    return () => window.removeEventListener("achievement_unlocked", handleAchievement);
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success": return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
      );
      case "error": return (
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      );
      case "info": return (
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      );
      case "achievement": return (
        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0 text-lg">
          🏆
        </div>
      );
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                {toast.message}
              </p>
            </div>
            <button className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div
              className="toast-progress"
              style={{ animationDuration: `${toast.duration || 3500}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
