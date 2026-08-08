import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export type LessonNodeVariant = "completed" | "current" | "locked" | "checkpoint";

interface LessonNodeProps {
  variant: Exclude<LessonNodeVariant, "current">;
  icon: string;
  href?: string;
}

export function LessonNode({ variant, icon, href }: LessonNodeProps) {
  if (variant === "checkpoint") {
    return (
      <Link
        href={href ?? "#"}
        className="w-20 h-20 rounded-xl bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-sm rotate-45"
      >
        <Icon name={icon} filled className="text-4xl -rotate-45" />
      </Link>
    );
  }

  if (variant === "completed") {
    return (
      <Link
        href={href ?? "#"}
        className="w-16 h-16 rounded-full bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
      >
        <Icon name={icon} filled className="text-3xl" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full bg-surface-gray text-outline border-2 border-outline-variant flex items-center justify-center cursor-not-allowed",
      )}
      aria-disabled
    >
      <Icon name={icon} className="text-3xl" />
    </div>
  );
}
