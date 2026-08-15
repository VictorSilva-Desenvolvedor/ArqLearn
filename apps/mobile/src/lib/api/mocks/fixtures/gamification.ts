import { mockUser } from "./user";
import { LEAGUE_TIERS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import type { Achievement, GamificationProfile, League, LeagueRankingEntry } from "@/types/api";

export const mockGamificationProfile: GamificationProfile = {
  xp_total: 520,
  xp_today: 30,
  level: 8,
  streak_current: 12,
  streak_best: 24,
  hearts_current: 5,
  hearts_next_at: null,
  gems: 340,
  league_tier: "prata",
};

export const mockAchievementUnlocks: Achievement[] = [
  { type: "primeira_licao", unlocked_at: "2026-06-01T10:00:00Z" },
  { type: "licao_perfeita", unlocked_at: "2026-06-01T10:05:00Z" },
  { type: "licoes_completas_1", unlocked_at: "2026-06-05T10:00:00Z" },
  { type: "licoes_completas_2", unlocked_at: "2026-06-15T10:00:00Z" },
  { type: "streak_dias_1", unlocked_at: "2026-06-20T10:00:00Z" },
];

// Espelha apps/web/src/lib/api/mocks/fixtures/gamification.ts e o valor real de
// services/monolith/internal/gamification/gamification.go (PromotionSlots/DemotionSlots, TDD §6).
export const LEAGUE_PROMOTION_SLOTS = 5;
export const LEAGUE_DEMOTION_SLOTS = 5;

export const mockLeagueRanking: LeagueRankingEntry[] = [
  { user_id: "u-ana", name: "Ana Souza", xp_this_week: 2450, position: 1 },
  { user_id: "u-bruno", name: "Bruno Alves", xp_this_week: 2180, position: 2 },
  { user_id: "u-carla", name: "Carla Nunes", xp_this_week: 1990, position: 3 },
  { user_id: "u-diego", name: "Diego Ramos", xp_this_week: 1750, position: 4 },
  { user_id: "u-elisa", name: "Elisa Prado", xp_this_week: 1600, position: 5 },
  { user_id: "u-fabio", name: "Fábio Lima", xp_this_week: 1420, position: 6 },
  { user_id: "u-gabi", name: "Gabriela Melo", xp_this_week: 1280, position: 7 },
  { user_id: mockUser.id, name: mockUser.name, xp_this_week: 1100, position: 8 },
  { user_id: "u-hugo", name: "Hugo Castro", xp_this_week: 940, position: 9 },
  { user_id: "u-ines", name: "Inês Rocha", xp_this_week: 820, position: 10 },
  { user_id: "u-joao", name: "João Pires", xp_this_week: 610, position: 11 },
  { user_id: "u-karen", name: "Karen Dias", xp_this_week: 450, position: 12 },
  { user_id: "u-luis", name: "Luís Fontes", xp_this_week: 380, position: 13 },
  { user_id: "u-patricia", name: "Patrícia Nogueira", xp_this_week: 290, position: 14 },
  { user_id: "u-nicolas", name: "Nicolas Reis", xp_this_week: 150, position: 15 },
];

export const mockLeague: League = {
  league_id: "liga-prata-2026-w32",
  tier: "prata",
  week_reference: "2026-W32",
  ranking: mockLeagueRanking,
  promotion_slots: LEAGUE_PROMOTION_SLOTS,
  demotion_slots: LEAGUE_DEMOTION_SLOTS,
  viewer_position: 8,
  xp_to_promotion: mockLeagueRanking[LEAGUE_PROMOTION_SLOTS - 1].xp_this_week - 1100 + 1,
};

const OTHER_TIER_NAME_POOL = [
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

// Gera um ranking crível (não é dado real — só pras outras 4 ligas terem algo pra mostrar na
// navegação "top 50 de cada liga" quando gamification está mockado) pra uma tier que não seja a
// do usuário — determinístico (sem Math.random) pra não variar a cada render.
function buildMockRankingForTier(tier: LeagueTierName, baseXp: number): LeagueRankingEntry[] {
  const count = 12;
  return Array.from({ length: count }, (_, i) => ({
    user_id: `u-${tier}-${i + 1}`,
    name: OTHER_TIER_NAME_POOL[(i + LEAGUE_TIERS.indexOf(tier)) % OTHER_TIER_NAME_POOL.length],
    xp_this_week: Math.max(0, baseXp - i * Math.round(baseXp / (count + 2))),
    position: i + 1,
  }));
}

const OTHER_TIER_BASE_XP: Record<Exclude<LeagueTierName, "prata">, number> = {
  bronze: 900,
  ouro: 3400,
  platina: 5200,
  diamante: 8000,
};

export const mockLeagueByTier: Record<LeagueTierName, League> = {
  prata: mockLeague,
  bronze: {
    league_id: "liga-bronze-2026-w32",
    tier: "bronze",
    week_reference: "2026-W32",
    ranking: buildMockRankingForTier("bronze", OTHER_TIER_BASE_XP.bronze),
    promotion_slots: LEAGUE_PROMOTION_SLOTS,
    demotion_slots: LEAGUE_DEMOTION_SLOTS,
    viewer_position: null,
    xp_to_promotion: null,
  },
  ouro: {
    league_id: "liga-ouro-2026-w32",
    tier: "ouro",
    week_reference: "2026-W32",
    ranking: buildMockRankingForTier("ouro", OTHER_TIER_BASE_XP.ouro),
    promotion_slots: LEAGUE_PROMOTION_SLOTS,
    demotion_slots: LEAGUE_DEMOTION_SLOTS,
    viewer_position: null,
    xp_to_promotion: null,
  },
  platina: {
    league_id: "liga-platina-2026-w32",
    tier: "platina",
    week_reference: "2026-W32",
    ranking: buildMockRankingForTier("platina", OTHER_TIER_BASE_XP.platina),
    promotion_slots: LEAGUE_PROMOTION_SLOTS,
    demotion_slots: LEAGUE_DEMOTION_SLOTS,
    viewer_position: null,
    xp_to_promotion: null,
  },
  diamante: {
    league_id: "liga-diamante-2026-w32",
    tier: "diamante",
    week_reference: "2026-W32",
    ranking: buildMockRankingForTier("diamante", OTHER_TIER_BASE_XP.diamante),
    promotion_slots: LEAGUE_PROMOTION_SLOTS,
    demotion_slots: LEAGUE_DEMOTION_SLOTS,
    viewer_position: null,
    xp_to_promotion: null,
  },
};
