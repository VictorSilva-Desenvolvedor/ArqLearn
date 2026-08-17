"use client";

import { useContext } from "react";
import { ToastContext } from "@/contexts/ToastContext";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

// Montado uma vez no root layout (dentro do ToastProvider) — qualquer tela chama useToast() pra
// disparar. prefers-reduced-motion já encurta a animação via a regra global em globals.css.
export function Toast() {
  const ctx = useContext(ToastContext);
  const toast = ctx?.toast ?? null;
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60]",
        // shadow-lg é intencional aqui (exceção documentada, não drift): sem borda própria,
        // flutuando sobre conteúdo real sem overlay atrás — precisa da sombra pra se separar.
        "flex items-center gap-xs px-lg py-sm rounded-full shadow-lg font-body-md text-body-md font-bold",
        "animate-[toast-in_200ms_ease-out]",
        toast.tone === "success"
          ? "bg-tertiary text-on-tertiary"
          : "bg-error text-on-error",
      )}
    >
      <Icon name={toast.tone === "success" ? "check_circle" : "error"} filled />
      {toast.message}
    </div>
  );
}
