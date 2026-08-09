import { cookies } from "next/headers";
import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { gamificationForAccount, getAccountById, mockAccounts } from "../mocks/fixtures/accounts";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import type { GamificationProfile, User } from "@/types/api";

export interface MeResponse {
  user: User;
  gamification: GamificationProfile;
}

// ATENÇÃO: usa next/headers — só pode ser importado por Server Components (páginas em
// app/**/page.tsx), nunca por um arquivo "use client". Hoje só Home/Liga/Perfil chamam isto.
// accessToken vem de lib/supabase/server.ts#getServerAccessToken (sessão real da requisição).
export async function getMe(accessToken?: string): Promise<MeResponse> {
  if (isResourceReal("users")) {
    return apiFetch<MeResponse>("/v1/users/me", undefined, accessToken);
  }
  const cookieStore = await cookies();
  const accountId = cookieStore.get(ACCOUNT_COOKIE)?.value;
  // Fallback pro aluno só por segurança de tipo — o middleware garante que toda rota aqui já
  // tem uma conta válida no cookie antes deste código rodar.
  const account = getAccountById(accountId) ?? mockAccounts[0];
  return mockDelay({ user: account.user, gamification: gamificationForAccount(account.id) });
}
