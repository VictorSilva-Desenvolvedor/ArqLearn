import { mockGamificationProfile } from "./gamification";

// Simula o DAILY_XP_CAP do TDD §3.2 do lado do mock — a lição e o Modo Infinito consomem o
// mesmo teto diário (mesmo comportamento descrito no spec §6.1). É a "pretensa API" decidindo o
// corte, nunca o componente/hook — eles só exibem xp_ganho/xp_daily_cap_reached. Espelha
// apps/web/src/lib/api/mocks/fixtures/dailyXpCap.ts.
export const DAILY_XP_CAP = 50;

let xpEarnedToday = mockGamificationProfile.xp_today;

export function awardXp(amount: number): { xp_ganho: number; xp_daily_cap_reached: boolean } {
  const remaining = Math.max(0, DAILY_XP_CAP - xpEarnedToday);
  const granted = Math.max(0, Math.min(amount, remaining));
  xpEarnedToday += granted;
  return { xp_ganho: granted, xp_daily_cap_reached: xpEarnedToday >= DAILY_XP_CAP };
}
