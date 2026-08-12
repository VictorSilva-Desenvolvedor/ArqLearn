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

// Espelha apps/web/src/contexts/ToastContext.tsx — um único toast ativo por vez.
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
