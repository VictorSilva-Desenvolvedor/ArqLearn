import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockNotifications } from "../mocks/fixtures/notifications";
import type { AppNotification, Paginated } from "@/types/api";

// accessToken opcional — a página de Notificações é Server Component e passa o token da própria
// requisição, mesmo motivo de getMe (resources/users.ts).
export async function listNotifications(accessToken?: string): Promise<Paginated<AppNotification>> {
  if (isResourceReal("notifications")) {
    return apiFetch<Paginated<AppNotification>>("/v1/notifications", undefined, accessToken);
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
