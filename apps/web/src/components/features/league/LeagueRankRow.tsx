import { cn } from "@/lib/utils/cn";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
}

export function LeagueRankRow({ entry, isCurrentUser }: LeagueRankRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-md px-md py-sm border-b border-outline-variant",
        isCurrentUser && "border-l-4 border-l-primary bg-primary-fixed",
      )}
    >
      <span className="w-6 font-label text-body-sm font-bold text-on-surface-variant">{entry.position}</span>
      <span className="flex-1 font-body-lg text-body-lg text-on-surface truncate">
        {isCurrentUser ? "Você" : entry.name}
      </span>
      <span className="font-label text-body-sm font-bold text-primary">{entry.xp_this_week} XP</span>
    </div>
  );
}
