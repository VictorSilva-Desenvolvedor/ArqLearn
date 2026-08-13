import type { ProgressSummary } from "@/types/api";

// Consistente com o estado das trilhas em tracks.ts/lessons.ts. Espelha
// apps/web/src/lib/api/mocks/fixtures/progress.ts.
export const mockProgressSummary: ProgressSummary = {
  tracks_in_progress: 1,
  tracks_completed: 1,
  lessons_completed_last_7d: 4,
  accuracy_rate: 85,
};
