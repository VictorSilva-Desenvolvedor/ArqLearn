import { ApiError } from "../../http";
import { getMockQuestionBank, xpForDifficulty, type MockQuestionEntry } from "./questions";
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

  const correct = entry.correctOptionId === answerOptionId;
  if (!correct) {
    session.heartsRemaining = Math.max(0, session.heartsRemaining - 1);
  }

  const xp_ganho = correct ? xpForDifficulty(entry.question.difficulty as QuestionDifficulty) : 0;

  return {
    correct,
    xp_ganho,
    xp_daily_cap_reached: false,
    vidas_restantes: session.heartsRemaining,
    streak_atual: session.streak,
    explicacao: entry.explanation,
  };
}
