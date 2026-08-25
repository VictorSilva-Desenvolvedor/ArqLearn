import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "gamification" | "ghost" | "danger" | "danger-ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Sem shadow-sm: o sistema é flat-by-default, borda 2px já define a superfície (ver
  // DESIGN.md "The Flat-By-Default Rule" — shadow genérico do Tailwind não é vocabulário daqui).
  primary: "bg-primary text-on-primary hover:bg-primary-container border-2 border-primary",
  gamification:
    "bg-secondary-container text-on-secondary-container border-b-4 border-secondary active:translate-y-1 active:border-b-0",
  ghost: "bg-transparent text-primary border-2 border-primary hover:bg-surface-container",
  danger: "bg-error text-on-error hover:opacity-90 border-2 border-error",
  // Ação destrutiva que NÃO deve ser a mais pesada da tela — mesmo vocabulário do `ghost` (fundo
  // transparente + borda 2px), só que na cor de erro. Criado na auditoria de 25/08/2026 (rodada 3)
  // para a Revisão de Perguntas, onde "Rejeitar" em `danger` sólido era o botão mais chamativo do
  // card, acima de "Aprovar" — invertendo a hierarquia da ação esperada e divergindo da referência
  // do Stitch (revis_o_de_perguntas/screen.png), que usa rejeitar contornado. Variante nova: não
  // altera nenhum botão já existente no app.
  "danger-ghost": "bg-transparent text-error hover:bg-error-container border-2 border-error",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-body-sm py-xs px-md",
  md: "text-body-lg py-sm px-lg",
  lg: "text-headline-md py-sm px-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-xs rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
