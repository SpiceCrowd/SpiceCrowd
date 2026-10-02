"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "warning" | "info";
type Toast = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { show: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.filter((toast) => toast.message !== message), { id, kind, message }].slice(-3));
    if (kind !== "error") window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:max-w-sm" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => <div key={toast.id} role={toast.kind === "error" ? "alert" : "status"} className={`pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${toast.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : toast.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : toast.kind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-800"}`}>{toast.message}</div>)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
