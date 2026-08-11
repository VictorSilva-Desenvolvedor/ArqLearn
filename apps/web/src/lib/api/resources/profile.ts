import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import type { User } from "@/types/api";

// Client-safe (sem next/headers) — diferente de users.ts, que só pode ser importado por Server
// Components. updateMe/deleteMe são chamados da tela de Configurações (client component), que já
// tem o User atual via useAuth(), então não precisam resolver a conta a partir do cookie.
//
// Gating deliberadamente separado do resource "users": GET /v1/users/me é real, mas PATCH/DELETE
// continuam 501 stub no backend (ver Docs/PENDENCIAS_WEB_REAL.md) — usar isResourceReal("users")
// aqui quebraria Configurações pra sessão real assim que ela existisse. Só passa a chamar de
// verdade quando "users-write" for adicionado a NEXT_PUBLIC_API_REAL_RESOURCES (depois que o
// backend implementar as duas rotas).
export interface UpdateMePayload {
  name?: string;
  timezone?: string;
  notifications_enabled?: boolean;
}

export async function updateMe(current: User, patch: UpdateMePayload): Promise<User> {
  if (isResourceReal("users-write")) {
    return apiFetch<User>("/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }
  const updated: User = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
  };
  return mockDelay(updated, 300);
}

export interface DeleteMeResponse {
  deletion_scheduled_at: string;
}

const LGPD_DELETION_GRACE_DAYS = 30;

export async function deleteMe(): Promise<DeleteMeResponse> {
  if (isResourceReal("users-write")) {
    return apiFetch<DeleteMeResponse>("/v1/users/me", { method: "DELETE" });
  }
  const scheduledAt = new Date(Date.now() + LGPD_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return mockDelay({ deletion_scheduled_at: scheduledAt }, 300);
}
