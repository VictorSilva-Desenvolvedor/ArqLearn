import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockAchievementUnlocks, mockGamificationProfile, mockLeague, mockLeagueByTier } from "../mocks/fixtures/gamification";
import { getMockDailyChestStatus, getMockDailyGoalStatus, mockOpenDailyChest, setMockDailyGoalLevel } from "../mocks/fixtures/dailyChest";
import { getMockWeeklyChestStatus, mockOpenWeeklyChest } from "../mocks/fixtures/weeklyChest";
import { dailyGoalCatalog } from "@/lib/gamification/dailyGoalCatalog";
import { mockShopCatalog } from "../mocks/fixtures/shopCatalog";
import type { LeagueTierName } from "@/lib/gamification/leagueTiers";
import type {
  Achievement,
  ChestOpenResult,
  DailyChestStatus,
  DailyGoalLevel,
  DailyGoalStatus,
  GamificationProfile,
  League,
  PurchaseResult,
  WeeklyChestStatus,
} from "@/types/api";

export interface GamificationMeResponse extends GamificationProfile {
  achievements: Achievement[];
}

export async function getGamificationProfile(): Promise<GamificationMeResponse> {
  if (isResourceReal("gamification")) {
    return apiFetch<GamificationMeResponse>("/v1/gamification/me");
  }
  return mockDelay({ ...mockGamificationProfile, achievements: mockAchievementUnlocks });
}

// Sem `tier`: liga/divisão do próprio usuário (matricula automaticamente, inclui viewer_position/
// xp_to_promotion). Com `tier` (e opcionalmente `division`, default 1): navega o ranking de outra
// liga (pra tela de todas as ligas), sem matricular o usuário nela.
export async function getLeague(tier?: LeagueTierName, division?: number): Promise<League> {
  if (isResourceReal("gamification")) {
    if (!tier) return apiFetch<League>("/v1/gamification/league");
    const query = `tier=${tier}${division ? `&division=${division}` : ""}`;
    return apiFetch<League>(`/v1/gamification/league?${query}`);
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

// Baú Diário (v1.18, a pedido do usuário) — 1 abertura por dia local ao bater a Meta Diária
// escolhida (v1.30, TDD §13 — perguntas certas OU minutos estudados, lição + Modo Infinito
// somados, ver AnswerResult/InfiniteModeAnswerResult). Status/abertura são dois endpoints porque
// o corpo aceita re-consulta livre (GET) sem gastar a abertura em si.
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

// Meta Diária (v1.30, TDD §13) — nível de intensidade escolhido pelo usuário entre 4 presets
// (dailyGoalCatalog.ts), medido em perguntas certas OU minutos estudados no dia. É o que decide o
// gatilho do Baú Diário acima (questions_required/study_minutes_required de DailyChestStatus vêm
// do mesmo nível).
export async function getDailyGoalStatus(): Promise<DailyGoalStatus> {
  if (isResourceReal("gamification")) {
    return apiFetch<DailyGoalStatus>("/v1/gamification/daily-goal");
  }
  return mockDelay(getMockDailyGoalStatus());
}

export async function updateDailyGoalLevel(level: DailyGoalLevel): Promise<DailyGoalStatus> {
  if (isResourceReal("gamification")) {
    return apiFetch<DailyGoalStatus>("/v1/gamification/daily-goal", {
      method: "PATCH",
      body: JSON.stringify({ level }),
    });
  }
  if (!dailyGoalCatalog[level]) {
    throw new ApiError(400, {
      error_code: "INVALID_DAILY_GOAL_LEVEL",
      message: "Nível de meta diária inválido — use leve, regular, consistente ou intensa.",
      trace_id: "mock-trace",
    });
  }
  setMockDailyGoalLevel(level);
  return mockDelay(getMockDailyGoalStatus(), 300);
}

// Baú Semanal (v1.19, a pedido do usuário) — mesmo padrão do Baú Diário acima, mas 1 abertura por
// ciclo rolante de 7 dias ao responder 50 perguntas dentro do ciclo (ver §8.2 da API Spec).
export async function getWeeklyChestStatus(): Promise<WeeklyChestStatus> {
  if (isResourceReal("gamification")) {
    return apiFetch<WeeklyChestStatus>("/v1/gamification/weekly-chest");
  }
  return mockDelay(getMockWeeklyChestStatus());
}

export async function openWeeklyChest(): Promise<ChestOpenResult> {
  if (isResourceReal("gamification")) {
    return apiFetch<ChestOpenResult>("/v1/gamification/weekly-chest/open", { method: "POST" });
  }
  if (!getMockWeeklyChestStatus().available) {
    throw new ApiError(409, {
      error_code: "CHEST_NOT_AVAILABLE",
      message: "Nenhum Baú Semanal disponível pra abrir agora.",
      trace_id: "mock-trace",
    });
  }
  return mockDelay(mockOpenWeeklyChest(), 400);
}
