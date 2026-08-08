import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  mockAchievementUnlocks,
  mockGamificationProfile,
  mockLeague,
} from "../mocks/fixtures/gamification";
import { mockShopCatalog } from "../mocks/fixtures/shopCatalog";
import type { Achievement, GamificationProfile, League, PurchaseResult } from "@/types/api";

export interface GamificationMeResponse extends GamificationProfile {
  achievements: Achievement[];
}

export async function getGamificationProfile(): Promise<GamificationMeResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<GamificationMeResponse>("/v1/gamification/me");
  }
  return mockDelay({ ...mockGamificationProfile, achievements: mockAchievementUnlocks });
}

export async function getLeague(): Promise<League> {
  if (isResourceReal("gamification")) {
    return apiFetch<League>("/v1/gamification/league");
  }
  return mockDelay(mockLeague);
}

export async function purchaseShopItem(itemId: string, idempotencyKey: string): Promise<PurchaseResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<PurchaseResult>("/v1/gamification/shop/purchase", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ item_id: itemId }),
    });
  }

  const item = mockShopCatalog.find((entry) => entry.id === itemId);
  if (!item) {
    throw new ApiError(404, {
      error_code: "ITEM_NOT_FOUND",
      message: `Item ${itemId} não encontrado na loja.`,
      trace_id: "mock-trace",
    });
  }
  if (mockGamificationProfile.gems < item.price_gems) {
    throw new ApiError(402, {
      error_code: "INSUFFICIENT_GEMS",
      message: "Gemas insuficientes para esta compra.",
      trace_id: "mock-trace",
    });
  }

  const gemsRestantes = mockGamificationProfile.gems - item.price_gems;
  return mockDelay({ gems_restantes: gemsRestantes, item: { id: item.id, tipo: item.tipo } }, 300);
}
