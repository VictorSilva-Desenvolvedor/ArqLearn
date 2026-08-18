import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockNotifications } from "../mocks/fixtures/notifications";
import type { AppNotification, Paginated } from "@/types/api";

// Espelha apps/web/src/lib/api/resources/notifications.ts — sem parâmetro de accessToken (mobile
// sempre lê da sessão ativa via provider global, ver lib/api/http.ts).
export async function listNotifications(): Promise<Paginated<AppNotification>> {
  if (isResourceReal("notifications")) {
    return apiFetch<Paginated<AppNotification>>("/v1/notifications");
  }
  return mockDelay({ data: mockNotifications, next_cursor: null });
}

export interface NotificationPreferences {
  push_enabled?: boolean;
  email_enabled?: boolean;
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  if (isResourceReal("notifications")) {
    return apiFetch<NotificationPreferences>("/v1/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
  }
  return mockDelay(prefs, 200);
}

// API Spec §9 v1.21 — registra/atualiza o token de push Expo do device atual. Sem mock: sem
// backend real não tem quem consumir o token mesmo (o gatilho de streak em risco só existe no
// backend), então em modo mock isso é um no-op silencioso em vez de fingir sucesso.
export async function registerPushToken(token: string, platform: "ios" | "android"): Promise<void> {
  if (!isResourceReal("notifications")) return;
  await apiFetch<{ registered: boolean }>("/v1/notifications/push-token", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}
