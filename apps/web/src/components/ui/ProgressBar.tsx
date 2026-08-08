import { cn } from "@/lib/utils/cn";

type ProgressBarVariant = "tube" | "thin";
type ProgressBarTone = "primary" | "secondary";

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: ProgressBarVariant;
  tone?: ProgressBarTone;
  className?: string;
}

const trackHeight: Record<ProgressBarVariant, string> = {
  tube: "h-3",
  thin: "h-1.5",
};

const fillTone: Record<ProgressBarTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
};

export function ProgressBar({
  value,
  max,
  variant = "tube",
  tone = "secondary",
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "w-full rounded-full bg-surface-gray overflow-hidden",
        trackHeight[variant],
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", fillTone[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
