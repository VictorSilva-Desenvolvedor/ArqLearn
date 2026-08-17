import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { getMockVipStatus, mockRedeemVipCoupon, mockResetDailyChestVip, mockResetWeeklyChestVip } from "../mocks/fixtures/vip";
import type { VipChestResetResult, VipRedeemCouponResult, VipStatus } from "@/types/api";

// VIP "Mestre Arquiteto" (a pedido do usuário) — mesmo padrão real/mock de resources/gamification.ts.

export async function getVipStatus(): Promise<VipStatus> {
  if (isResourceReal("gamification")) {
    return apiFetch<VipStatus>("/v1/vip/status");
  }
  return mockDelay(getMockVipStatus());
}

export async function redeemVipCoupon(code: string): Promise<VipRedeemCouponResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<VipRedeemCouponResult>("/v1/vip/coupons/redeem", {
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
  return mockDelay(mockRedeemVipCoupon(), 400);
}

// Assinatura recorrente ainda não está disponível (sem gateway de pagamento integrado, ver
// services/monolith/internal/gamification/vip.go VIPSubscriptionsEnabled) — o backend real sempre
// responde 501 aqui; o mock espelha o mesmo erro pra não fingir um caminho feliz que não existe.
export async function subscribeVip(): Promise<never> {
  if (isResourceReal("gamification")) {
    return apiFetch<never>("/v1/vip/subscribe", { method: "POST" });
  }
  throw new ApiError(501, {
    error_code: "VIP_SUBSCRIPTION_UNAVAILABLE",
    message: "Assinatura VIP por cartão ainda não está disponível — em breve. Use um cupom por enquanto.",
    trace_id: "mock-trace",
  });
}

export async function resetDailyChestVip(): Promise<VipChestResetResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<VipChestResetResult>("/v1/gamification/daily-chest/reset", { method: "POST" });
  }
  const status = getMockVipStatus();
  if (!status.is_vip) {
    throw new ApiError(403, { error_code: "VIP_REQUIRED", message: "Resetar o Baú Diário é um benefício exclusivo VIP.", trace_id: "mock-trace" });
  }
  if (status.daily_chest_resets_used >= status.daily_chest_resets_max) {
    throw new ApiError(409, { error_code: "CHEST_RESET_LIMIT_REACHED", message: "Você já usou seu reset de Baú Diário hoje.", trace_id: "mock-trace" });
  }
  return mockDelay(mockResetDailyChestVip(), 300);
}

export async function resetWeeklyChestVip(): Promise<VipChestResetResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<VipChestResetResult>("/v1/gamification/weekly-chest/reset", { method: "POST" });
  }
  const status = getMockVipStatus();
  if (!status.is_vip) {
    throw new ApiError(403, { error_code: "VIP_REQUIRED", message: "Resetar o Baú Semanal é um benefício exclusivo VIP.", trace_id: "mock-trace" });
  }
  if (status.weekly_chest_resets_used >= status.weekly_chest_resets_max) {
    throw new ApiError(409, { error_code: "CHEST_RESET_LIMIT_REACHED", message: "Você já usou seus 2 resets de Baú Semanal neste ciclo.", trace_id: "mock-trace" });
  }
  return mockDelay(mockResetWeeklyChestVip(), 300);
}
