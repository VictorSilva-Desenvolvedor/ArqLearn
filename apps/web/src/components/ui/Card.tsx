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
      className={cn(
        "bg-surface-bright",
        paddingClasses[padding],
        radiusClasses[radius],
        bordered && "border-2 border-outline-variant",
        interactive && "transition-colors hover:border-primary cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
