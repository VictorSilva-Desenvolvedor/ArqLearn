import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  answerInfiniteModeSessionMock,
  endInfiniteModeSessionMock,
  startInfiniteModeSessionMock,
} from "../mocks/fixtures/infiniteModeSessions";
import type { InfiniteModeAnswerResult, InfiniteModeEndResult, InfiniteModeSession } from "@/types/api";

export async function startInfiniteModeSession(topic: string): Promise<InfiniteModeSession> {
  if (isResourceReal("infinite-mode")) {
    return apiFetch<InfiniteModeSession>("/v1/infinite-mode/sessions", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });
  }
  return mockDelay(startInfiniteModeSessionMock(topic), 300);
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
