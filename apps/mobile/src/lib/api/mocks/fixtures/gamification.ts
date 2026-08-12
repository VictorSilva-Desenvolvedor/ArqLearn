import type { Achievement, GamificationProfile } from "@/types/api";

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
