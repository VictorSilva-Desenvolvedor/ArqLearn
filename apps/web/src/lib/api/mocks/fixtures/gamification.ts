import type { Achievement, GamificationProfile, League } from "@/types/api";
import { mockUser } from "./user";

export const mockGamificationProfile: GamificationProfile = {
  xp_total: 520,
  xp_today: 30,
  level: 8,
  streak_current: 12,
  streak_best: 24,
  hearts_current: 5,
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

// Regra da tela (Docs/stitch_app_visual_identity/liga_semanal/code.html): top 10 promovem,
// 5 piores caem — com 15 membros a zona de promoção (1-10) e a de rebaixamento (11-15) não se
// sobrepõem. Grupos pequenos (<15 ativos) são mesclados antes do fechamento (TDD §6), então 15
// é o tamanho mínimo plausível para mostrar as duas zonas sem conflito.
export const LEAGUE_PROMOTION_SLOTS = 10;
export const LEAGUE_DEMOTION_SLOTS = 5;

export const mockLeague: League = {
  league_id: "liga-prata-2026-w32",
  tier: "prata",
  week_reference: "2026-W32",
  ranking: [
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
  ],
};
