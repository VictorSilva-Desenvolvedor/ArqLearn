import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type StatPillTone = "primary" | "secondary" | "tertiary" | "error";

interface StatPillProps {
  icon: ReactNode;
  value: number | string;
  tone: StatPillTone;
  className?: string;
}

const toneTextClasses: Record<StatPillTone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error-red",
};

// Nota: a cor de cada stat (streak/vida/gema) varia por tela nos mockups de referência —
// o `tone` é passado explicitamente por quem usa o componente, não fixo aqui.
export function StatPill({ icon, value, tone, className }: StatPillProps) {
  return (
    <div className={cn("flex items-center gap-1", toneTextClasses[tone], className)}>
      {icon}
      <span className="font-label text-stats-num font-bold">{value}</span>
    </div>
  );
}
