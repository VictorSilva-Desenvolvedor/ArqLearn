import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardPadding = "sm" | "md" | "lg";
type CardRadius = "md" | "lg" | "xl";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  radius?: CardRadius;
  bordered?: boolean;
  interactive?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
};

const radiusClasses: Record<CardRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export function Card({
  padding = "md",
  radius = "lg",
  bordered = true,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      // interactive não é usado por nenhum consumidor ainda, mas quando for, precisa ser
      // navegável por teclado de verdade — não só parecer clicável ao mouse.
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "bg-surface-bright",
        paddingClasses[padding],
        radiusClasses[radius],
        bordered && "border-2 border-outline-variant",
        interactive &&
          "transition-colors hover:border-primary cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
