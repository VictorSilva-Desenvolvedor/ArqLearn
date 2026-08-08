import { ApiError } from "../../http";
import { getInfiniteModeBank, type InfiniteModeQuestionEntry } from "./infiniteModeQuestions";
import type { InfiniteModeAnswerResult, InfiniteModeEndResult, InfiniteModeSession } from "@/types/api";

// Sessão de Modo Infinito em memória do lado do cliente — mesmo padrão de quizSessions.ts.
// O banco de perguntas é curto no mock; ciclamos por ele até MAX_QUESTIONS e então tratamos
// como "banco esgotado" (next_question ausente), igual ao comportamento real descrito no spec.
const MAX_QUESTIONS = 9;

interface MockInfiniteSessionState {
  topic: string;
  bank: InfiniteModeQuestionEntry[];
  cursor: number;
  questionsAnswered: number;
  correctCount: number;
  totalTimeMs: number;
  xpEarned: number;
}

const sessions = new Map<string, MockInfiniteSessionState>();
let sessionCounter = 0;

function nextEntry(state: MockInfiniteSessionState): InfiniteModeQuestionEntry | null {
  if (state.questionsAnswered >= MAX_QUESTIONS) return null;
  const entry = state.bank[state.cursor % state.bank.length];
  state.cursor += 1;
  return entry;
}

export function startInfiniteModeSessionMock(topic: string): InfiniteModeSession {
  const bank = getInfiniteModeBank(topic);
  sessionCounter += 1;
  const sessionId = `mock-infinite-${sessionCounter}`;

  const state: MockInfiniteSessionState = {
    topic,
    bank,
    cursor: 0,
    questionsAnswered: 0,
    correctCount: 0,
    totalTimeMs: 0,
    xpEarned: 0,
  };
  sessions.set(sessionId, state);

  const first = nextEntry(state);
  if (!first) {
    throw new ApiError(404, {
      error_code: "SESSION_NOT_FOUND",
      message: "Banco de perguntas vazio para este tópico.",
      trace_id: "mock-trace",
    });
  }

  return { session_id: sessionId, topic, question: first.question };
}

function getSession(sessionId: string): MockInfiniteSessionState {
  const state = sessions.get(sessionId);
  if (!state) {
    throw new ApiError(404, {
      error_code: "SESSION_NOT_FOUND",
      message: `Sessão ${sessionId} não encontrada.`,
      trace_id: "mock-trace",
    });
  }
  return state;
}

export function answerInfiniteModeSessionMock(
  sessionId: string,
  questionId: string,
  answerOptionId: string,
  timeMs: number,
): InfiniteModeAnswerResult {
  const state = getSession(sessionId);
  const entry = state.bank.find((e) => e.question.id === questionId) ?? null;
  const correct = entry?.correctOptionId === answerOptionId;

  state.questionsAnswered += 1;
  state.totalTimeMs += timeMs;
  if (correct) {
    state.correctCount += 1;
    state.xpEarned += 25; // perguntas do Modo Infinito são todas "hard" — XP fixo mais alto que o loop padrão
  }

  const next = nextEntry(state);

  return {
    correct,
    xp_ganho: correct ? 25 : 0,
    xp_daily_cap_reached: false,
    questions_answered: state.questionsAnswered,
    correct_count: state.correctCount,
    next_question: next?.question,
  };
}

export function endInfiniteModeSessionMock(sessionId: string): InfiniteModeEndResult {
  const state = getSession(sessionId);
  const accuracy =
    state.questionsAnswered > 0 ? Math.round((state.correctCount / state.questionsAnswered) * 100) : 0;
  const avgTime = state.questionsAnswered > 0 ? Math.round(state.totalTimeMs / state.questionsAnswered) : 0;

  return {
    questions_answered: state.questionsAnswered,
    correct_count: state.correctCount,
    accuracy_rate: accuracy,
    xp_earned: state.xpEarned,
    avg_time_ms: avgTime,
  };
}
