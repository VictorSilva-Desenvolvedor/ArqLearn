import type { Achievement, GamificationProfile, League, LeagueRankingEntry, PersonalRecord } from "@/types/api";
import { mockUser } from "./user";
import { tierDivisionToRank, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { COMPASSO_DOURADO_ID } from "./shopCatalog";

// mockPersonalRecords: valores plausíveis, alguns acima do estado atual do mock (streak_current=12
// mas streak_dias=24 = streak_best; liga_alcancada acima do rank atual de mockGamificationProfile,
// bronze/2 — melhor liga já alcançada não precisa ser a liga corrente, só >= ela).
export const mockPersonalRecords: PersonalRecord[] = [
  { metric: "streak_dias", value: 24 },
  { metric: "infinito_sem_erros", value: 18 },
  { metric: "xp_dia", value: 145 },
  { metric: "liga_alcancada", value: 10 }, // prata/3 — ver rankToTierDivision em leagueTiers.ts
];

export const mockGamificationProfile: GamificationProfile = {
  xp_total: 520,
  xp_today: 30,
  level: 3, // nivel(520) = floor(sqrt(520/100))+1 = 3, curva real (algorithms.go Nivel)
  streak_current: 12,
  streak_best: 24,
  streak_freezes_available: 2,
  streak_at_risk: false,
  hearts_current: 5,
  hearts_next_at: null,
  gems: 340,
  league_tier: "bronze",
  // Compasso Dourado já comprado no mock (moldura de avatar dourada) — demonstra o inventário
  // de cosméticos sem precisar gastar gemas no fluxo de demonstração.
  cosmetics: [
    { item_id: COMPASSO_DOURADO_ID, name: "Compasso Dourado", equipped: true, acquired_at: "2026-07-10T10:00:00Z" },
  ],
  is_vip: false,
  vip_expires_at: null,
  xp_boost_active: false,
  xp_boost_active_until: null,
  personal_records: mockPersonalRecords,
};

export const mockAchievementUnlocks: Achievement[] = [
  { type: "primeira_licao", unlocked_at: "2026-06-01T10:00:00Z" },
  { type: "licao_perfeita", unlocked_at: "2026-06-01T10:05:00Z" },
  { type: "licoes_completas_1", unlocked_at: "2026-06-05T10:00:00Z" },
  { type: "licoes_completas_2", unlocked_at: "2026-06-15T10:00:00Z" },
  { type: "streak_dias_1", unlocked_at: "2026-06-20T10:00:00Z" },
];

// Espelha apps/mobile/.../fixtures/gamification.ts e o valor real de
// services/monolith/internal/gamification/gamification.go (PromotionSlots/DemotionSlots).
export const LEAGUE_PROMOTION_SLOTS = 3;
export const LEAGUE_DEMOTION_SLOTS = 3;

// Liga/divisão do usuário mockado (bate com mockGamificationProfile.league_tier acima).
const MOCK_USER_TIER: LeagueTierName = "bronze";
const MOCK_USER_DIVISION = 2;

export const mockLeagueRanking: LeagueRankingEntry[] = [
  { user_id: "u-ana", name: "Ana Souza", xp_this_week: 2450, position: 1 },
  { user_id: "u-bruno", name: "Bruno Alves", xp_this_week: 2180, position: 2 },
  { user_id: "u-carla", name: "Carla Nunes", xp_this_week: 1990, position: 3 },
  { user_id: "u-diego", name: "Diego Ramos", xp_this_week: 1750, position: 4 },
  { user_id: "u-elisa", name: "Elisa Prado", xp_this_week: 1600, position: 5 },
  { user_id: "u-fabio", name: "Fábio Lima", xp_this_week: 1420, position: 6 },
  { user_id: mockUser.id, name: mockUser.name, xp_this_week: 1280, position: 7 },
  { user_id: "u-hugo", name: "Hugo Castro", xp_this_week: 940, position: 8 },
  { user_id: "u-ines", name: "Inês Rocha", xp_this_week: 820, position: 9 },
  { user_id: "u-joao", name: "João Pires", xp_this_week: 610, position: 10 },
];

const promotionCutoffXp = mockLeagueRanking[LEAGUE_PROMOTION_SLOTS - 1].xp_this_week;
const viewerXp = mockLeagueRanking.find((e) => e.user_id === mockUser.id)!.xp_this_week;

export const mockLeague: League = {
  league_id: `liga-${MOCK_USER_TIER}-${MOCK_USER_DIVISION}-2026-w32`,
  tier: MOCK_USER_TIER,
  division: MOCK_USER_DIVISION,
  week_reference: "2026-W32",
  ranking: mockLeagueRanking,
  promotion_slots: LEAGUE_PROMOTION_SLOTS,
  demotion_slots: LEAGUE_DEMOTION_SLOTS,
  viewer_position: 7,
  xp_to_promotion: Math.max(0, promotionCutoffXp - viewerXp + 1),
};

const OTHER_NAME_POOL = [
  "Otávio Bezerra",
  "Paula Martins",
  "Quésia Farias",
  "Rafael Costa",
  "Sofia Andrade",
  "Tiago Freitas",
  "Vitória Lopes",
  "Wagner Teixeira",
  "Yasmin Duarte",
  "Zeca Moraes",
  "Beatriz Cardoso",
  "Caio Nascimento",
];

// Gera um ranking crível (não é dado real — só pras outras 29 ligas/divisões terem algo pra
// mostrar na navegação "todas as ligas" quando gamification está mockado) — determinístico (sem
// Math.random, evita mismatch de hidratação SSR) — XP base cresce com o rank (ligas mais altas
// têm competidores mais fortes).
function buildMockRanking(tier: LeagueTierName, division: number): LeagueRankingEntry[] {
  const rank = tierDivisionToRank(tier, division);
  const baseXp = 200 + rank * 220;
  const count = 10;
  return Array.from({ length: count }, (_, i) => ({
    user_id: `u-${tier}-${division}-${i + 1}`,
    name: OTHER_NAME_POOL[(i + rank) % OTHER_NAME_POOL.length],
    xp_this_week: Math.max(0, baseXp - i * Math.round(baseXp / (count + 2))),
    position: i + 1,
  }));
}

// Substitui o antigo Record<LeagueTierName, League> (só fazia sentido com 5 ligas sem divisão) —
// com 30 combinações liga+divisão, gerar sob demanda é mais simples que declarar as 30 na mão.
// Retorna exatamente mockLeague quando liga+divisão bate com a do usuário mockado.
export function mockLeagueByTier(tier: LeagueTierName, division: number): League {
  if (tier === MOCK_USER_TIER && division === MOCK_USER_DIVISION) return mockLeague;
  return {
    league_id: `liga-${tier}-${division}-2026-w32`,
    tier,
    division,
    week_reference: "2026-W32",
    ranking: buildMockRanking(tier, division),
    promotion_slots: LEAGUE_PROMOTION_SLOTS,
    demotion_slots: LEAGUE_DEMOTION_SLOTS,
    viewer_position: null,
    xp_to_promotion: null,
  };
}
