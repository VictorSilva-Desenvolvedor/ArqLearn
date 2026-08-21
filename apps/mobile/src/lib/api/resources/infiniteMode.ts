import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  answerInfiniteModeSessionMock,
  endInfiniteModeSessionMock,
  startInfiniteModeSessionMock,
  startReviewSessionMock,
} from "../mocks/fixtures/infiniteModeSessions";
import type { InfiniteModeAnswerResult, InfiniteModeEndResult, InfiniteModeSession } from "@/types/api";

// { topic } inicia uma sessão por tópico; { review: true } inicia a fila de revisão do SRS
// ("Revisar agora", TDD §10.3) — mutuamente exclusivos, mesmo contrato do backend
// (POST /v1/infinite-mode/sessions, API Spec §6.1 v1.24).
export type StartInfiniteModeParams = { topic: string } | { review: true };

export async function startInfiniteModeSession(params: StartInfiniteModeParams): Promise<InfiniteModeSession> {
  if (isResourceReal("infinite-mode")) {
    return apiFetch<InfiniteModeSession>("/v1/infinite-mode/sessions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
  if ("review" in params) {
    return mockDelay(startReviewSessionMock(), 300);
  }
  return mockDelay(startInfiniteModeSessionMock(params.topic), 300);
}

export interface InfiniteModeAnswerPayload {
  question_id: string;
  answer: string;
  time_ms: number;
}

// idempotencyKey (API Spec §2.6/§6, v1.22) — mesmo motivo/padrão de submitAnswer em resources/lessons.ts.
export async function submitInfiniteModeAnswer(
  sessionId: string,
  payload: InfiniteModeAnswerPayload,
  idempotencyKey: string,
): Promise<InfiniteModeAnswerResult> {
  if (isResourceReal("infinite-mode")) {
    return apiFetch<InfiniteModeAnswerResult>(`/v1/infinite-mode/sessions/${sessionId}/answers`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
  }
  return mockDelay(
    answerInfiniteModeSessionMock(sessionId, payload.question_id, payload.answer, payload.time_ms),
    300,
  );
}

export async function endInfiniteModeSession(sessionId: string): Promise<InfiniteModeEndResult> {
  if (isResourceReal("infinite-mode")) {
    return apiFetch<InfiniteModeEndResult>(`/v1/infinite-mode/sessions/${sessionId}/end`, {
      method: "POST",
    });
  }
  return mockDelay(endInfiniteModeSessionMock(sessionId), 200);
}
