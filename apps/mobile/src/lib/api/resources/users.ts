import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockGamificationProfile } from "../mocks/fixtures/gamification";
import { mockUser } from "../mocks/fixtures/user";
import type { GamificationProfile, User } from "@/types/api";

export interface MeResponse {
  user: User;
  gamification: GamificationProfile;
}

// Sem equivalente ao getServerAccessToken do web aqui — mobile não tem SSR, então o único
// caminho é client-side, sempre pelo provider global de lib/api/http.ts.
export async function getMe(): Promise<MeResponse> {
  if (isResourceReal("users")) {
    return apiFetch<MeResponse>("/v1/users/me");
  }
  return mockDelay({ user: mockUser, gamification: mockGamificationProfile });
}
