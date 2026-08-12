import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockAchievementUnlocks, mockGamificationProfile } from "../mocks/fixtures/gamification";
import type { Achievement, GamificationProfile } from "@/types/api";

export interface GamificationMeResponse extends GamificationProfile {
  achievements: Achievement[];
}

export async function getGamificationProfile(): Promise<GamificationMeResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<GamificationMeResponse>("/v1/gamification/me");
  }
  return mockDelay({ ...mockGamificationProfile, achievements: mockAchievementUnlocks });
}

// purchaseShopItem entra na Fase 1/5 (NoHeartsDialog/Loja), junto com o fixture do catálogo
// (mockShopCatalog) que ele depende — sem isso implementar o branch mock aqui seria só um
// stand-in raso, sem preço/item real pra validar contra.
