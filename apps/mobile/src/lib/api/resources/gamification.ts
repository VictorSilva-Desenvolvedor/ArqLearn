import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockAchievementUnlocks, mockGamificationProfile } from "../mocks/fixtures/gamification";
import { mockShopCatalog } from "../mocks/fixtures/shopCatalog";
import type { Achievement, GamificationProfile, PurchaseResult } from "@/types/api";

export interface GamificationMeResponse extends GamificationProfile {
  achievements: Achievement[];
}

export async function getGamificationProfile(): Promise<GamificationMeResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<GamificationMeResponse>("/v1/gamification/me");
  }
  return mockDelay({ ...mockGamificationProfile, achievements: mockAchievementUnlocks });
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

export interface FreezeStreakResponse {
  streak_freezes_available: number;
}

// GamificationProfile não expõe "quantos freezes tenho" — só esta resposta e o item da loja. O
// caller (client, já tem a contagem via useAuth()) passa o valor atual; o mock só valida/consome.
export async function freezeStreak(currentFreezesAvailable: number): Promise<FreezeStreakResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<FreezeStreakResponse>("/v1/gamification/streak/freeze", { method: "POST" });
  }
  if (currentFreezesAvailable <= 0) {
    throw new ApiError(409, {
      error_code: "NO_STREAK_FREEZE_AVAILABLE",
      message: "Você não tem nenhum bloqueio de ofensiva disponível.",
      trace_id: "mock-trace",
    });
  }
  return mockDelay({ streak_freezes_available: currentFreezesAvailable - 1 }, 300);
}
