import { ApiError } from "../../http";
import { getAllInfiniteModeEntries, getInfiniteModeBank, type InfiniteModeQuestionEntry } from "./infiniteModeQuestions";
import { awardXp } from "./dailyXpCap";
import { bumpMockChestQuestions, mockChestAvailable, mockChestQuestionsToday } from "./dailyChest";
import { bumpMockWeeklyChestQuestions } from "./weeklyChest";
import { mockGamificationProfile } from "./gamification";
import type { InfiniteModeAnswerResult, InfiniteModeEndResult, InfiniteModeSession } from "@/types/api";

// Sessão de Modo Infinito em memória do lado do cliente — mesmo padrão de quizSessions.ts.
// O banco de perguntas é curto no mock; ciclamos por ele até MAX_QUESTIONS e então tratamos
// como "banco esgotado" (next_question ausente), igual ao comportamento real descrito no spec.
const MAX_QUESTIONS = 9;

// Mesma conta que o backend real faz em handleInfiniteModeAnswer (API Spec §6.1 v1.3): a cada 20
// perguntas respondidas, sobe um "nível" — só o tópico "maquetes" de fato gera lição nova por trás
// disso (services/monolith/internal/learning/infinitemode_generation.go), mas o número em si é
// exibido pra qualquer tópico, cliente não distingue.
const LEVEL_BATCH_SIZE = 20;
function levelFor(questionsAnswered: number): number {
  return Math.floor(questionsAnswered / LEVEL_BATCH_SIZE) + 1;
}

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
  if (!bank) {
    // Código só do mock — não existe no catálogo real do spec porque no backend de verdade
    // todo tema publicado teria perguntas; aqui simula um tema da grade sem conteúdo gerado ainda.
    throw new ApiError(404, {
      error_code: "TOPIC_NOT_AVAILABLE",
      message: `Ainda não há perguntas de Modo Infinito para o tema "${topic}".`,
      trace_id: "mock-trace",
    });
  }

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

  return { session_id: sessionId, topic, is_review: false, question: first.question };
}

// Fila de revisão do SRS (mock de "Revisar agora", TDD §10.3) — cruza todos os tópicos, mesmo
// pool "hard" de InfiniteModeQuestionEntry, só pra ter algo plausível pra responder no modo mock
// (sem backend real, não há SRS de verdade calculado pra saber o que está "vencido").
export function startReviewSessionMock(): InfiniteModeSession {
  const bank = getAllInfiniteModeEntries();

  sessionCounter += 1;
  const sessionId = `mock-review-${sessionCounter}`;

  const state: MockInfiniteSessionState = {
    topic: "",
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
      error_code: "REVIEW_QUEUE_EMPTY",
      message: "Nenhum item vencido pra revisar agora.",
      trace_id: "mock-trace",
    });
  }

  return { session_id: sessionId, topic: "", is_review: true, question: first.question };
}

// Valor fixo plausível pro card "Revisar agora" aparecer no modo mock (sem backend real não há
// SRS calculado de verdade, então não tem como derivar isto de nenhum estado existente).
const MOCK_REVIEW_DUE_COUNT = 4;

export function getReviewSummaryMock(): { due_count: number } {
  return { due_count: MOCK_REVIEW_DUE_COUNT };
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
  // perguntas do Modo Infinito são todas "hard" — XP-base fixo mais alto que o loop padrão,
  // mas ainda sujeito ao mesmo teto diário compartilhado (spec §6.1: "mesmo comportamento de §6").
  const { xp_ganho, xp_daily_cap_reached } = awardXp(correct ? 25 : 0);
  if (correct) {
    state.correctCount += 1;
    state.xpEarned += xp_ganho;
  }

  const next = nextEntry(state);
  bumpMockChestQuestions();
  bumpMockWeeklyChestQuestions();

  return {
    correct,
    xp_ganho,
    xp_daily_cap_reached,
    xp_boost_active: false,
    // Modo Infinito conta pra streak agora (TDD §5.1, revisado) — mock estático, mesmo
    // simplificação já usada em quizSessions.ts (não simula o incremento real de 1x/dia).
    streak_atual: mockGamificationProfile.streak_current,
    questions_answered: state.questionsAnswered,
    correct_count: state.correctCount,
    level: levelFor(state.questionsAnswered),
    next_question: next?.question,
    daily_chest_available: mockChestAvailable(),
    daily_chest_questions: mockChestQuestionsToday(),
    // Mock não simula desbloqueio real de conquista/recorde — sempre vazio.
    achievements_unlocked: [],
    personal_records_broken: [],
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
