import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
}

export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-surface-gray transition-colors",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
