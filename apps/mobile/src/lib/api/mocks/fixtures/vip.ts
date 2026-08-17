import type { VipChestResetResult, VipRedeemCouponResult, VipStatus } from "@/types/api";
import { mockResetDailyChest } from "./dailyChest";
import { mockResetWeeklyChest } from "./weeklyChest";

// VIP "Mestre Arquiteto" simulado em modo mock: estado em memória, mesmo espírito de
// dailyChest.ts/weeklyChest.ts. Começa sem VIP pra exercitar o fluxo de resgate de cupom na tela
// /vip; qualquer código de 10 dígitos "funciona" aqui (o backend real é quem valida de verdade).
let isVip = false;
let vipExpiresAt: string | null = null;
let dailyResetsUsed = 0;
let weeklyResetsUsed = 0;

const DAILY_RESETS_MAX = 1;
const WEEKLY_RESETS_MAX = 2;

export function getMockVipStatus(): VipStatus {
  return {
    is_vip: isVip,
    vip_expires_at: vipExpiresAt,
    daily_chest_resets_used: dailyResetsUsed,
    daily_chest_resets_max: DAILY_RESETS_MAX,
    weekly_chest_resets_used: weeklyResetsUsed,
    weekly_chest_resets_max: WEEKLY_RESETS_MAX,
  };
}

// Validação de formato (10 dígitos) fica no resource layer (resources/vip.ts), que decide se
// lança ApiError antes de chamar isto — esta função só aplica o grant, igual ao resto das
// fixtures deste diretório (mockOpenDailyChest/mockOpenWeeklyChest também não validam nada).
export function mockRedeemVipCoupon(): VipRedeemCouponResult {
  isVip = true;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  vipExpiresAt = expiry.toISOString();
  return { is_vip: isVip, vip_expires_at: vipExpiresAt };
}

export function mockResetDailyChestVip(): VipChestResetResult {
  dailyResetsUsed += 1;
  mockResetDailyChest();
  return { available: true, resets_used: dailyResetsUsed, resets_max: DAILY_RESETS_MAX, questions_required: 10 };
}

export function mockResetWeeklyChestVip(): VipChestResetResult {
  weeklyResetsUsed += 1;
  mockResetWeeklyChest();
  return { available: true, resets_used: weeklyResetsUsed, resets_max: WEEKLY_RESETS_MAX, questions_required: 50 };
}
