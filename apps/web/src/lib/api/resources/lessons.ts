import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockLessonsByTrack } from "../mocks/fixtures/lessons";
import { mockGamificationProfile } from "../mocks/fixtures/gamification";
import { answerMockSession, createMockSession } from "../mocks/fixtures/quizSessions";
import type { AnswerResult, LessonSession, Paginated, TrackLesson } from "@/types/api";

// accessToken (opcional) é pra chamadas server-side (ver lib/supabase/server.ts#getServerAccessToken).
export async function listTrackLessons(
  trackId: string,
  accessToken?: string,
): Promise<Paginated<TrackLesson>> {
  if (isResourceReal("lessons")) {
    return apiFetch<Paginated<TrackLesson>>(`/v1/tracks/${trackId}/lessons`, undefined, accessToken);
  }

  const lessons = mockLessonsByTrack[trackId];
  if (!lessons) {
    throw new ApiError(404, {
      error_code: "TRACK_NOT_FOUND",
      message: `Trilha ${trackId} não encontrada.`,
      trace_id: "mock-trace",
    });
  }
  return mockDelay({ data: lessons, next_cursor: null });
}

export async function startLessonSession(
  lessonId: string,
  heartsAvailable: number = mockGamificationProfile.hearts_current,
): Promise<LessonSession> {
  if (isResourceReal("lessons")) {
    return apiFetch<LessonSession>(`/v1/lessons/${lessonId}/session`, { method: "POST" });
  }
  const session = createMockSession(lessonId, heartsAvailable, mockGamificationProfile.streak_current);
  return mockDelay(session, 300);
}

export interface SubmitAnswerPayload {
  session_id: string;
  question_id: string;
  answer: string;
  time_ms: number;
}

export async function submitAnswer(
  lessonId: string,
  payload: SubmitAnswerPayload,
): Promise<AnswerResult> {
  if (isResourceReal("lessons")) {
    return apiFetch<AnswerResult>(`/v1/lessons/${lessonId}/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  const result = answerMockSession(payload.session_id, payload.question_id, payload.answer);
  return mockDelay(result, 300);
}
