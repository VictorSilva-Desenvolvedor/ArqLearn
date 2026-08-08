import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "primary" | "secondary" | "tertiary" | "error" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  primary: "text-primary bg-primary-fixed",
  secondary: "text-secondary bg-secondary-fixed",
  tertiary: "text-on-tertiary-fixed-variant bg-tertiary-fixed",
  error: "text-error bg-error-container",
  neutral: "text-outline bg-surface-gray border border-outline-variant",
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-label-caps text-label-caps uppercase px-2 py-1",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
