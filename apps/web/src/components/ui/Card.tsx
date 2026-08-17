import type { HTMLAttributes, KeyboardEvent } from "react";
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
  onKeyDown,
  ...rest
}: CardProps) {
  // interactive já tem 6 consumidores reais (TrackCard, ProfileMenuLink, LogoutMenuLink,
  // ShopCosmeticItem, NotificationItem, UploadedContentItem) — role="button"+tabIndex sozinhos só
  // tornam o card focável, não ativável por teclado (div não herda o Enter/Espaço nativo de
  // <button>). `.click()` dispara o onClick real de quem consome o Card, sem duplicar a lógica de
  // clique aqui (achado de /impeccable audit, 2026-08-17 — regressão do fix anterior de focus).
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (!interactive || e.defaultPrevented) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : onKeyDown}
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
