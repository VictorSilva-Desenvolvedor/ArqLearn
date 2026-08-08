import { Card } from "@/components/ui/Card";
import { LEAGUE_DEMOTION_SLOTS } from "@/lib/api/mocks/fixtures/gamification";
import { LeagueRankRow } from "./LeagueRankRow";
import { LeagueZoneBanner } from "./LeagueZoneBanner";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankingListProps {
  ranking: LeagueRankingEntry[];
  currentUserId: string;
}

export function LeagueRankingList({ ranking, currentUserId }: LeagueRankingListProps) {
  const demotionStartsAt = ranking.length - LEAGUE_DEMOTION_SLOTS + 1;

  return (
    <Card padding="sm" radius="lg" className="!p-0 overflow-hidden">
      {ranking.map((entry, index) => (
        <div key={entry.user_id}>
          {index === 0 && <LeagueZoneBanner kind="promotion" />}
          {entry.position === demotionStartsAt && <LeagueZoneBanner kind="demotion" />}
          <LeagueRankRow entry={entry} isCurrentUser={entry.user_id === currentUserId} />
        </div>
      ))}
    </Card>
  );
}
