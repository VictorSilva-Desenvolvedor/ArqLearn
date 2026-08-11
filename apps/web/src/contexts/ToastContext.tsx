"use client";

import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "success" | "error";

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastContextValue {
  toast: ToastState | null;
  showToast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// Spec §7: "Successful low-risk action: short toast, maximum 3 seconds." — nenhuma tela do app
// tinha isso antes (ex.: comprar na Loja atualizava o saldo de gemas em silêncio). Um único toast
// ativo por vez é suficiente pro escopo atual; uma fila só valeria a pena se surgisse um caso de
// dois toasts quase simultâneos.
const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, showToast }), [toast, showToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
