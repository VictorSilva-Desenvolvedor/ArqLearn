"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  gamificationForAccount,
  getAccountById,
  type MockAccountId,
} from "@/lib/api/mocks/fixtures/accounts";
import { clearAccountCookie, setAccountCookie } from "@/lib/auth/clientSession";
import type { GamificationProfile, User } from "@/types/api";

export interface AuthContextValue {
  user: User | null;
  gamification: GamificationProfile;
  updateGamification: (patch: Partial<GamificationProfile>) => void;
  switchAccount: (accountId: MockAccountId) => void;
  logout: () => void;
}

// Sessão mockada, agora com troca de conta real (aluno/professor/admin) — sem Supabase, o
// cookie arqlearn_mock_account é só o que o middleware usa pra proteger rota por papel.
// `initialAccountId` vem do cookie lido no servidor em app/layout.tsx, pra SSR e primeira
// renderização do cliente concordarem (evita flash/hydration mismatch).
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialAccountId,
}: {
  children: ReactNode;
  initialAccountId: string | null;
}) {
  const router = useRouter();
  const initialAccount = getAccountById(initialAccountId);

  const [accountId, setAccountId] = useState<MockAccountId | null>(initialAccount?.id ?? null);
  const [gamification, setGamification] = useState<GamificationProfile>(
    gamificationForAccount(initialAccount?.id),
  );

  const switchAccount = useCallback(
    (id: MockAccountId) => {
      setAccountCookie(id);
      setAccountId(id);
      setGamification(gamificationForAccount(id));
    },
    [setAccountId, setGamification],
  );

  const logout = useCallback(() => {
    clearAccountCookie();
    setAccountId(null);
    router.push("/login");
  }, [router, setAccountId]);

  const updateGamification = useCallback((patch: Partial<GamificationProfile>) => {
    setGamification((current) => ({ ...current, ...patch }));
  }, []);

  const account = accountId ? getAccountById(accountId) : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: account?.user ?? null,
      gamification,
      updateGamification,
      switchAccount,
      logout,
    }),
    [account, gamification, updateGamification, switchAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
