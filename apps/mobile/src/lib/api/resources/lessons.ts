import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockLessonsByTrack } from "../mocks/fixtures/lessons";
import type { Paginated, TrackLesson } from "@/types/api";

export async function listTrackLessons(trackId: string): Promise<Paginated<TrackLesson>> {
  if (isResourceReal("lessons")) {
    return apiFetch<Paginated<TrackLesson>>(`/v1/tracks/${trackId}/lessons`);
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

// startLessonSession/submitAnswer entram na Fase 1 junto com useQuizSession.
