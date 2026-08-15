import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { AchievementBadge } from "./AchievementBadge";
import type { Achievement } from "@/types/api";

export function AchievementGrid({ unlocked }: { unlocked: Achievement[] }) {
  const unlockedAtByType = new Map(unlocked.map((a) => [a.type, a.unlocked_at]));

  return (
    <div>
      <h2 className="font-display text-headline-md text-on-surface mb-sm">Conquistas</h2>
      <div className="grid grid-cols-3 gap-md">
        {Object.entries(achievementCatalog).map(([type, entry]) => (
          <AchievementBadge
            key={type}
            entry={entry}
            unlocked={unlockedAtByType.has(type)}
            unlockedAt={unlockedAtByType.get(type)}
          />
        ))}
      </div>
    </div>
  );
}
