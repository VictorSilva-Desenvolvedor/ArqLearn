import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockProgressSummary } from "../mocks/fixtures/progress";
import type { ProgressSummary } from "@/types/api";

// accessToken opcional — Server Components (Perfil) passam o token da própria requisição, mesmo
// motivo de getMe (resources/users.ts).
export async function getProgressSummary(accessToken?: string): Promise<ProgressSummary> {
  if (isResourceReal("progress")) {
    return apiFetch<ProgressSummary>("/v1/progress/summary", undefined, accessToken);
  }
  return mockDelay(mockProgressSummary);
}
