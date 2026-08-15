import type { ChestOpenResult, ChestRewardType, WeeklyChestStatus } from "@/types/api";

// Baú Semanal (v1.19) simulado em modo mock: mesmo espírito de dailyChest.ts, mas sem "ciclo de 7
// dias" pra simular sem um relógio de verdade — só um contador em memória que soma toda resposta
// (bumpMockWeeklyChestQuestions, chamado pelos mesmos call sites de bumpMockChestQuestions em
// quizSessions.ts/infiniteModeSessions.ts, já que o contador real também soma os dois) até bater
// 50. Espelha apps/web/.../fixtures/weeklyChest.ts.
let questionsThisCycle = 0;
let claimedThisCycle = false;

export function bumpMockWeeklyChestQuestions(): void {
  questionsThisCycle += 1;
}

export function mockWeeklyChestAvailable(): boolean {
  return questionsThisCycle >= 50 && !claimedThisCycle;
}

export function getMockWeeklyChestStatus(): WeeklyChestStatus {
  return {
    questions_this_cycle: questionsThisCycle,
    questions_required: 50,
    available: mockWeeklyChestAvailable(),
    claimed_this_cycle: claimedThisCycle,
  };
}

// Mesma distribuição do backend (internal/gamification.RolarRecompensaBauSemanal: 60% gemas 5-15,
// 40% item), mas determinístico (sempre "gemas") — igual ao resto deste diretório de fixtures.
export function mockOpenWeeklyChest(): ChestOpenResult {
  claimedThisCycle = true;
  const rewardType: ChestRewardType = "gems";
  return { reward_type: rewardType, gems_earned: 10, gems: 350 };
}
