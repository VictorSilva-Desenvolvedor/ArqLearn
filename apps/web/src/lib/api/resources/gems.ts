import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  GEM_BET_MIN_STAKE,
  getMockActiveGemBet,
  getMockGemTransactionsPage,
  mockGemPackages,
  mockRedeemGemCoupon,
  startMockGemBet,
} from "../mocks/fixtures/gems";
import { mockGamificationProfile } from "../mocks/fixtures/gamification";
import type { GemBet, GemCouponRedeemResult, GemPackage, GemTransactionsPage } from "@/types/api";

// Moeda: Livro-Razão, Pacotes de Gemas e Double or Nothing (TDD §15) — mesmo padrão real/mock de
// resources/vip.ts (const que trava o checkout de verdade, cupom como caminho funcional hoje).

export async function getGemTransactions(cursor?: string, limit = 20, accessToken?: string): Promise<GemTransactionsPage> {
  if (isResourceReal("gamification")) {
    const query = new URLSearchParams();
    if (cursor) query.set("cursor", cursor);
    if (limit) query.set("limit", String(limit));
    const qs = query.toString();
    return apiFetch<GemTransactionsPage>(`/v1/gamification/gem-transactions${qs ? `?${qs}` : ""}`, undefined, accessToken);
  }
  const offset = cursor ? Number(cursor) || 0 : 0;
  return mockDelay(getMockGemTransactionsPage(offset, limit));
}

export async function getGemPackages(accessToken?: string): Promise<GemPackage[]> {
  if (isResourceReal("gamification")) {
    const { data } = await apiFetch<{ data: GemPackage[] }>("/v1/gamification/gem-packages", undefined, accessToken);
    return data;
  }
  return mockDelay(mockGemPackages);
}

// Compra por cartão ainda não está disponível (sem gateway de pagamento integrado, ver
// internal/gamification.GemPackagePurchasesEnabled) — o backend real sempre responde 501 aqui; o
// mock espelha o mesmo erro pra não fingir um caminho feliz que não existe.
export async function checkoutGemPackage(packageId: string): Promise<never> {
  if (isResourceReal("gamification")) {
    return apiFetch<never>(`/v1/gamification/gem-packages/${packageId}/checkout`, { method: "POST" });
  }
  throw new ApiError(501, {
    error_code: "GEM_PACKAGE_PURCHASE_UNAVAILABLE",
    message: "Compra de gemas por cartão ainda não está disponível — em breve. Use um cupom por enquanto.",
    trace_id: "mock-trace",
  });
}

export async function redeemGemCoupon(code: string): Promise<GemCouponRedeemResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<GemCouponRedeemResult>("/v1/gamification/gem-coupons/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }
  if (code.trim().length !== 10) {
    throw new ApiError(409, {
      error_code: "COUPON_INVALID",
      message: "Cupom inválido ou já resgatado.",
      trace_id: "mock-trace",
    });
  }
  return mockDelay(mockRedeemGemCoupon(code.trim()), 400);
}

export async function getActiveGemBet(accessToken?: string): Promise<GemBet | null> {
  if (isResourceReal("gamification")) {
    return apiFetch<GemBet | null>("/v1/gamification/bets/active", undefined, accessToken);
  }
  return mockDelay(getMockActiveGemBet());
}

export async function startGemBet(stakeGems: number): Promise<GemBet> {
  if (isResourceReal("gamification")) {
    return apiFetch<GemBet>("/v1/gamification/bets", {
      method: "POST",
      body: JSON.stringify({ stake_gems: stakeGems }),
    });
  }
  if (stakeGems < GEM_BET_MIN_STAKE) {
    throw new ApiError(400, {
      error_code: "INVALID_BODY",
      message: `stake_gems deve ser pelo menos ${GEM_BET_MIN_STAKE}.`,
      trace_id: "mock-trace",
    });
  }
  if (getMockActiveGemBet()) {
    throw new ApiError(409, {
      error_code: "BET_ALREADY_ACTIVE",
      message: "Você já tem uma aposta em andamento.",
      trace_id: "mock-trace",
    });
  }
  if (mockGamificationProfile.gems < stakeGems) {
    throw new ApiError(402, {
      error_code: "INSUFFICIENT_GEMS",
      message: "Gemas insuficientes para esta aposta.",
      trace_id: "mock-trace",
    });
  }
  return mockDelay(startMockGemBet(stakeGems), 300);
}
