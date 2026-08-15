import type { ChestOpenResult, ChestRewardType, DailyChestStatus } from "@/types/api";

// Baú Diário (v1.18) simulado em modo mock: sem conceito de "dia" aqui (não há backend real),
// então é só um contador em memória que soma toda resposta (bumpMockChestQuestions, chamado por
// quizSessions.ts e mockInfiniteMode.ts — o contador real também soma lição + Modo Infinito
// juntos) até bater 10, sem reset diário (não faz sentido simular isso sem um relógio de
// verdade). Espelha apps/mobile/.../fixtures/dailyChest.ts.
let questionsToday = 0;
let claimedToday = false;

export function bumpMockChestQuestions(): void {
  questionsToday += 1;
}

export function mockChestAvailable(): boolean {
  return questionsToday >= 10 && !claimedToday;
}

export function mockChestQuestionsToday(): number {
  return questionsToday;
}

export function getMockDailyChestStatus(): DailyChestStatus {
  return {
    questions_today: questionsToday,
    questions_required: 10,
    available: mockChestAvailable(),
    claimed_today: claimedToday,
  };
}

// Mesma distribuição do backend (internal/gamification.RolarRecompensaBau: 75% gemas 1-5, 25%
// item), mas sem RNG de verdade — determinístico (sempre "gemas") pra não variar a cada render em
// modo mock, igual ao resto deste diretório de fixtures.
export function mockOpenDailyChest(): ChestOpenResult {
  claimedToday = true;
  const rewardType: ChestRewardType = "gems";
  return { reward_type: rewardType, gems_earned: 3, gems: 343 };
}
