import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

// Spec §7 ("Important UI states"): loading é skeleton, não spinner genérico. Pulso sutil via
// animate-pulse do Tailwind; prefers-reduced-motion já encurta isso globalmente (globals.css).
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-surface-gray", className)} />;
}
