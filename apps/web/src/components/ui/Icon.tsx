import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}

// Wrapper fino sobre Material Symbols Outlined (mesma fonte de ícones usada nos mockups
// Stitch). A folha de estilo é carregada uma vez em app/layout.tsx.
export function Icon({ name, filled = false, className, size }: IconProps) {
  const style: CSSProperties = {
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
    ...(size ? { fontSize: size } : {}),
  };
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined leading-none", className)}
      style={style}
    >
      {name}
    </span>
  );
}
