import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockProgressSummary } from "../mocks/fixtures/progress";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/web/src/lib/api/resources/progress.ts — sem parâmetro de accessToken (ver
// http.ts, mobile sempre lê da sessão ativa via provider global).
export async function getProgressSummary(): Promise<ProgressSummary> {
  if (isResourceReal("progress")) {
    return apiFetch<ProgressSummary>("/v1/progress/summary");
  }
  return mockDelay(mockProgressSummary);
}
