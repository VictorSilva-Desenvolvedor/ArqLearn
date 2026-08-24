import { ApiError } from "../../http";
import { getMockQuestionBank, xpForDifficulty, type MockQuestionEntry } from "./questions";
import { awardXp } from "./dailyXpCap";
import { bumpMockChestQuestions, bumpMockStudySeconds, mockChestAvailable, mockChestQuestionsToday, mockStudyMinutesToday } from "./dailyChest";
import { bumpMockWeeklyChestQuestions } from "./weeklyChest";
import type { AnswerResult, LessonSession, QuestionDifficulty } from "@/types/api";

interface MockSessionState {
  lessonId: string;
  heartsRemaining: number;
  streak: number;
  entries: Map<string, MockQuestionEntry>;
}

// Estado de sessão em memória do lado do cliente — simula o que o backend faria (decidir
// vidas_restantes/xp_ganho), o componente de quiz só exibe o resultado. Vive só na aba do
// navegador enquanto o quiz está aberto.
const sessions = new Map<string, MockSessionState>();

let sessionCounter = 0;

export function createMockSession(lessonId: string, heartsAvailable: number, streakCurrent: number): LessonSession {
  const bank = getMockQuestionBank(lessonId);
  sessionCounter += 1;
  const sessionId = `mock-session-${sessionCounter}`;

  sessions.set(sessionId, {
    lessonId,
    heartsRemaining: heartsAvailable,
    streak: streakCurrent,
    entries: new Map(bank.map((entry) => [entry.question.id, entry])),
  });

  return {
    session_id: sessionId,
    questions: bank.map((entry) => entry.question),
    hearts_available: heartsAvailable,
  };
}

export function answerMockSession(
  sessionId: string,
  questionId: string,
  answerOptionId: string,
  timeMs: number,
): AnswerResult {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new ApiError(404, {
      error_code: "SESSION_NOT_FOUND",
      message: `Sessão ${sessionId} não encontrada.`,
      trace_id: "mock-trace",
    });
  }

  const entry = session.entries.get(questionId);
  if (!entry) {
    throw new ApiError(404, {
      error_code: "SESSION_NOT_FOUND",
      message: `Pergunta ${questionId} não pertence à sessão ${sessionId}.`,
      trace_id: "mock-trace",
    });
  }

  // fill_blank não tem id de opção pra comparar exato — o usuário digita texto livre, então a
  // "resposta certa" (correctOptionId guarda o texto esperado nesse caso) precisa tolerar
  // diferença de maiúscula/minúscula e espaço nas pontas.
  const correct =
    entry.question.type === "fill_blank"
      ? entry.correctOptionId.trim().toLowerCase() === answerOptionId.trim().toLowerCase()
      : entry.correctOptionId === answerOptionId;
  if (!correct) {
    session.heartsRemaining = Math.max(0, session.heartsRemaining - 1);
  }

  const baseXp = correct ? xpForDifficulty(entry.question.difficulty as QuestionDifficulty) : 0;
  const { xp_ganho, xp_daily_cap_reached } = awardXp(baseXp);
  bumpMockChestQuestions();
  bumpMockWeeklyChestQuestions();
  // Tempo de estudo (TDD §13) soma em toda resposta, certa ou errada — mesma regra do backend
  // real (ClampAnswerStudyMs); mock não capa porque timeMs aqui já vem de um cronômetro real do
  // componente de quiz, não de um valor arbitrário do cliente como no backend.
  bumpMockStudySeconds(timeMs);

  return {
    correct,
    xp_ganho,
    xp_daily_cap_reached,
    xp_boost_active: false,
    vidas_restantes: session.heartsRemaining,
    streak_atual: session.streak,
    explicacao: entry.explanation,
    daily_chest_available: mockChestAvailable(),
    daily_chest_questions: mockChestQuestionsToday(),
    daily_chest_study_minutes: mockStudyMinutesToday(),
    // Mock não simula desbloqueio real de conquista/recorde — sempre vazio.
    achievements_unlocked: [],
    personal_records_broken: [],
  };
}
