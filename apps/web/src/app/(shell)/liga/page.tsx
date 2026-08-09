import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";
import { getLeague } from "@/lib/api/resources/gamification";
import { Icon } from "@/components/ui/Icon";
import { LeagueRankingList } from "@/components/features/league/LeagueRankingList";

const tierLabel: Record<string, string> = {
  bronze: "Liga Bronze",
  prata: "Liga Prata",
  ouro: "Liga Ouro",
  platina: "Liga Platina",
  diamante: "Liga Diamante",
};

export default async function LeaguePage() {
  const accessToken = await getServerAccessToken();
  // getLeague() continua mockado — /v1/gamification/league ainda é stub no backend (ver
  // Docs/CLAUDE.md), não dá pra ligar de verdade ainda.
  const [{ user }, league] = await Promise.all([getMe(accessToken), getLeague()]);

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <Icon name="trophy" filled className="text-4xl text-secondary" />
        <div>
          <h1 className="font-display text-display-lg font-bold text-on-surface">
            {tierLabel[league.tier ?? ""] ?? "Liga"}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Os {10} melhores avançam de liga. Os {5} piores caem para a liga anterior.
          </p>
        </div>
      </div>
      <p className="font-label text-body-sm text-on-surface-variant">
        Encerra em: <span className="font-bold text-primary">2d 14h 32m</span>
      </p>
      <LeagueRankingList ranking={league.ranking} currentUserId={user.id} />
    </div>
  );
}
