import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  mockAchievementUnlocks,
  mockGamificationProfile,
  mockLeague,
  mockLeagueByTier,
} from "../mocks/fixtures/gamification";
import { getMockDailyChestStatus, mockOpenDailyChest } from "../mocks/fixtures/dailyChest";
import { mockShopCatalog } from "../mocks/fixtures/shopCatalog";
import type { LeagueTierName } from "@/lib/gamification/leagueTiers";
import type {
  Achievement,
  ChestOpenResult,
  DailyChestStatus,
  GamificationProfile,
  League,
  PurchaseResult,
} from "@/types/api";

export interface GamificationMeResponse extends GamificationProfile {
  achievements: Achievement[];
}

// accessToken é opcional pra manter chamadas client-side funcionando (fetch pega o token do
// provider global, ver setAccessTokenProvider em http.ts) — Server Components (Perfil/Liga)
// passam explicitamente o token da própria requisição, mesmo motivo de getMe (resources/users.ts).
export async function getGamificationProfile(accessToken?: string): Promise<GamificationMeResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<GamificationMeResponse>("/v1/gamification/me", undefined, accessToken);
  }
  return mockDelay({ ...mockGamificationProfile, achievements: mockAchievementUnlocks });
}

// Sem `tier`: liga/divisão do próprio usuário (matricula automaticamente, inclui viewer_position/
// xp_to_promotion). Com `tier` (e opcionalmente `division`, default 1): navega o ranking de outra
// liga, sem matricular o usuário nela — usado do client (LeagueTiersDialog), por isso accessToken
// vem do provider global nesse caso (ver comentário de getGamificationProfile acima).
export async function getLeague(accessToken?: string, tier?: LeagueTierName, division?: number): Promise<League> {
  if (isResourceReal("gamification")) {
    if (!tier) return apiFetch<League>("/v1/gamification/league", undefined, accessToken);
    const query = `tier=${tier}${division ? `&division=${division}` : ""}`;
    return apiFetch<League>(`/v1/gamification/league?${query}`, undefined, accessToken);
  }
  return mockDelay(tier ? mockLeagueByTier(tier, division ?? 1) : mockLeague);
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

// Resposta dedicada (em vez de reusar GamificationProfile.streak_freezes_available) porque este
// endpoint só devolve a contagem atualizada, não o perfil inteiro. O caller (client, já tem a
// contagem via useAuth()) passa o valor atual; o mock só valida/consome.
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

// Baú Diário (v1.18, a pedido do usuário) — 1 abertura por dia local ao responder 10 perguntas no
// dia (lição + Modo Infinito somados, ver AnswerResult/InfiniteModeAnswerResult). Status/abertura
// são dois endpoints porque o corpo aceita re-consulta livre (GET) sem gastar a abertura em si.
export async function getDailyChestStatus(): Promise<DailyChestStatus> {
  if (isResourceReal("gamification")) {
    return apiFetch<DailyChestStatus>("/v1/gamification/daily-chest");
  }
  return mockDelay(getMockDailyChestStatus());
}

export async function openDailyChest(): Promise<ChestOpenResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<ChestOpenResult>("/v1/gamification/daily-chest/open", { method: "POST" });
  }
  if (!getMockDailyChestStatus().available) {
    throw new ApiError(409, {
      error_code: "CHEST_NOT_AVAILABLE",
      message: "Nenhum Baú Diário disponível pra abrir agora.",
      trace_id: "mock-trace",
    });
  }
  return mockDelay(mockOpenDailyChest(), 400);
}
