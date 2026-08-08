import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { AchievementCatalogEntry } from "@/lib/gamification/achievementCatalog";

interface AchievementBadgeProps {
  entry: AchievementCatalogEntry;
  unlocked: boolean;
}

export function AchievementBadge({ entry, unlocked }: AchievementBadgeProps) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <div
        className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center rotate-45",
          unlocked
            ? "bg-secondary text-on-secondary shadow-sm"
            : "bg-surface-gray text-outline border-2 border-dashed border-outline-variant",
        )}
      >
        <Icon name={entry.icon} filled={unlocked} className="text-2xl -rotate-45" />
      </div>
      <span
        className={cn(
          "font-label-caps text-label-caps",
          unlocked ? "text-on-surface" : "text-outline",
        )}
      >
        {entry.title}
      </span>
    </div>
  );
}
