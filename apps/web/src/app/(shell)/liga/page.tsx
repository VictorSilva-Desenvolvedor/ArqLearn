import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";
import { getLeague } from "@/lib/api/resources/gamification";
import { LeagueHeader } from "@/components/features/league/LeagueHeader";
import { LeagueRankingList } from "@/components/features/league/LeagueRankingList";

export default async function LeaguePage() {
  const accessToken = await getServerAccessToken();
  const [{ user }, league] = await Promise.all([getMe(accessToken), getLeague(accessToken)]);

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-md">
      <LeagueHeader league={league} currentUserId={user.id} />
      <p className="font-label text-body-sm text-on-surface-variant">
        Encerra em: <span className="font-bold text-primary">2d 14h 32m</span>
      </p>
      <LeagueRankingList ranking={league.ranking} currentUserId={user.id} />
    </div>
  );
}
