import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "primary" | "secondary" | "tertiary" | "error" | "neutral" | "gold";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  primary: "text-primary bg-primary-fixed",
  secondary: "text-secondary bg-secondary-fixed",
  tertiary: "text-on-tertiary-fixed-variant bg-tertiary-fixed",
  error: "text-error bg-error-container",
  neutral: "text-outline bg-surface-gray border border-outline-variant",
  // VIP "Mestre Arquiteto" (a pedido do usuário) — mais contraste que "secondary" pro selo de
  // perfil se destacar (bg cheio em vez do tom pastel fixed).
  gold: "text-on-secondary-container bg-secondary-container",
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-label text-label-caps uppercase px-2 py-1",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
