import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { getReviewSummaryMock } from "../mocks/fixtures/infiniteModeSessions";
import type { ReviewSummary } from "@/types/api";

// GET /v1/review/summary (API Spec §6.1 v1.24, TDD §10.3) — quantos itens estão vencidos agora,
// entre todos os tópicos. Chamado antes de oferecer "Revisar agora" (ReviewPromptCard), mesmo
// espírito de getDailyChestStatus/getWeeklyChestStatus.
export async function getReviewSummary(): Promise<ReviewSummary> {
  if (isResourceReal("infinite-mode")) {
    return apiFetch<ReviewSummary>("/v1/review/summary");
  }
  return mockDelay(getReviewSummaryMock(), 200);
}
