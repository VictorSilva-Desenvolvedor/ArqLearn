import type { ChestOpenResult, ChestRewardType, DailyChestStatus, DailyGoalLevel, DailyGoalStatus } from "@/types/api";
import { dailyGoalCatalog, metaDiariaAtingida } from "@/lib/gamification/dailyGoalCatalog";

// Baú Diário (v1.18) + Meta Diária (v1.30, TDD §13) simulados em modo mock: sem conceito de "dia"
// aqui (não há backend real), então é só estado em memória que soma toda resposta
// (bumpMockChestQuestions/bumpMockStudySeconds, chamados por quizSessions.ts e
// infiniteModeSessions.ts — os contadores reais também somam lição + Modo Infinito juntos), sem
// reset diário (não faz sentido simular isso sem um relógio de verdade). As duas rotas reais
// (GET .../daily-chest e GET/PATCH .../daily-goal) resolvem o alvo pela mesma fonte no backend
// (internal/gamification.LoadDailyChestStatus) — este arquivo espelha essa mesma junção em vez de
// duplicar o estado em dois arquivos de mock (evita import circular entre eles também). Espelha
// apps/mobile/.../fixtures/dailyChest.ts.
let questionsToday = 0;
let studySecondsToday = 0;
let level: DailyGoalLevel = "regular";
let claimedToday = false;

export function bumpMockChestQuestions(): void {
  questionsToday += 1;
}

// timeMs opcional (default 60s) — o mock de sessão de quiz não tem um relógio real por trás de
// cada resposta; um valor fixo plausível é honesto o suficiente pra demonstrar a lógica OU sem
// inventar uma simulação de cronômetro que ninguém vai olhar.
export function bumpMockStudySeconds(timeMs = 60_000): void {
  studySecondsToday += Math.max(0, Math.round(timeMs / 1000));
}

function target() {
  return dailyGoalCatalog[level];
}

export function mockChestQuestionsToday(): number {
  return questionsToday;
}

export function mockStudyMinutesToday(): number {
  return Math.floor(studySecondsToday / 60);
}

export function mockChestAvailable(): boolean {
  return metaDiariaAtingida(questionsToday, mockStudyMinutesToday(), level) && !claimedToday;
}

export function getMockDailyChestStatus(): DailyChestStatus {
  return {
    questions_today: questionsToday,
    questions_required: target().questionsTarget,
    study_minutes_today: mockStudyMinutesToday(),
    study_minutes_required: target().studyMinutesTarget,
    available: mockChestAvailable(),
    claimed_today: claimedToday,
  };
}

export function getMockDailyGoalLevel(): DailyGoalLevel {
  return level;
}

export function setMockDailyGoalLevel(newLevel: DailyGoalLevel): void {
  level = newLevel;
}

export function getMockDailyGoalStatus(): DailyGoalStatus {
  return {
    level,
    questions_target: target().questionsTarget,
    study_minutes_target: target().studyMinutesTarget,
    questions_today: questionsToday,
    study_minutes_today: mockStudyMinutesToday(),
    achieved: metaDiariaAtingida(questionsToday, mockStudyMinutesToday(), level),
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

// Benefício VIP "resetar o Baú Diário mais uma vez por dia" — em modo mock, sem relógio de
// verdade, resetar só volta claimedToday pra false (questions_today já está acima do teto e não
// precisa ser refeito, mesma ideia do backend real).
export function mockResetDailyChest(): void {
  claimedToday = false;
}
