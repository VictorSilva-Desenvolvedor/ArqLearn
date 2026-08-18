"use client";

import { Icon } from "@/components/ui/Icon";
import { LEAGUE_TIERS, LEAGUE_TIER_ICONS, LEAGUE_TIER_LABELS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { cn } from "@/lib/utils/cn";

interface LeagueProgressionTrackProps {
  currentTier: LeagueTierName;
  onSelectTier?: (tier: LeagueTierName) => void;
}

// Espelha apps/mobile/.../LeagueProgressionTrack.tsx — trilha horizontal com as 10 ligas (Madeira
// → Diamante), a atual em destaque. Tocar numa liga abre o LeagueTiersDialog nela.
export function LeagueProgressionTrack({ currentTier, onSelectTier }: LeagueProgressionTrackProps) {
  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-sm">
      <div className="flex items-start gap-md overflow-x-auto pb-1">
        {LEAGUE_TIERS.map((tier, index) => {
          const active = tier === currentTier;
          return (
            <div key={tier} className="flex items-start gap-md shrink-0">
              {index > 0 && <div className="h-0.5 w-6 bg-outline-variant mt-5 shrink-0" />}
              <button
                type="button"
                onClick={() => onSelectTier?.(tier)}
                aria-label={`Ver Liga ${LEAGUE_TIER_LABELS[tier]}`}
                className="flex flex-col items-center gap-1 min-w-[56px]"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    active ? "bg-primary border-primary text-on-primary" : "bg-surface-gray border-outline-variant text-outline",
                  )}
                >
                  <Icon name={LEAGUE_TIER_ICONS[tier]} filled={active} className="text-lg" />
                </div>
                <span
                  className={cn(
                    "font-label text-label-caps truncate max-w-[60px]",
                    active ? "text-primary font-bold" : "text-outline",
                  )}
                >
                  {LEAGUE_TIER_LABELS[tier]}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
