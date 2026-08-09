"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  gamificationForAccount,
  getAccountById,
  type MockAccountId,
} from "@/lib/api/mocks/fixtures/accounts";
import { levelForXp } from "@/lib/api/mocks/fixtures/levelCurve";
import { clearAccountCookie, setAccountCookie } from "@/lib/auth/clientSession";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, setAccessTokenProvider } from "@/lib/api/http";
import type { GamificationProfile, User } from "@/types/api";

interface MeResponse {
  user: User;
  gamification: GamificationProfile;
}

function landingPathForRole(role: User["role"]): string {
  if (role === "teacher") return "/painel";
  if (role === "admin") return "/admin";
  return "/";
}

export interface AuthContextValue {
  user: User | null;
  gamification: GamificationProfile;
  updateGamification: (patch: Partial<GamificationProfile>) => void;
  updateUser: (patch: Partial<User>) => void;
  // GamificationProfile (contrato real) não tem esse campo — só aparece na resposta de
  // POST /v1/gamification/streak/freeze. Rastreado à parte, igual ao patch de User.
  streakFreezesAvailable: number;
  adjustStreakFreezes: (delta: number) => void;
  // Sessão real (Supabase Auth) — usar isto pro login de verdade (Maria/Marina/Admin, todas
  // contas reais agora). error null = deu certo; landingPath é pra onde a página de login deve
  // navegar em caso de sucesso (varia por papel — teacher/admin não caem no "/" do aluno).
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; landingPath: string }>;
  isRealSession: boolean;
  // Modo demonstração (sem Supabase) — só pra professor/admin, que ainda não têm conta real.
  switchAccount: (accountId: MockAccountId) => void;
  logout: () => void;
  // Spec §6: celebração dedicada ao subir de nível. Null quando não há level-up pendente.
  justLeveledUpTo: number | null;
  dismissLevelUp: () => void;
}

// Duas fontes de sessão coexistem nesta fase (ver Docs/PENDENCIAS_IA.md e CLAUDE.md): sessão real
// via Supabase Auth (única fonte de verdade pra contas de aluno reais, ex.: Maria) e a conta
// mockada por cookie arqlearn_mock_account (única forma de ver as telas de professor/admin, que
// ainda não têm conta real — ver login page). Sessão real tem prioridade sobre a mockada quando
// as duas existem. `initialAccountId` vem do cookie lido no servidor em app/layout.tsx, pra SSR e
// primeira renderização do cliente concordarem no caminho mockado (evita flash/hydration
// mismatch); o caminho real não tem essa otimização ainda — a primeira renderização mostra
// `user: null` até o useEffect resolver a sessão do Supabase e buscar o perfil real.
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
  const [isRealSession, setIsRealSession] = useState(false);
  const [realUser, setRealUser] = useState<User | null>(null);
  const [gamification, setGamification] = useState<GamificationProfile>(
    gamificationForAccount(initialAccount?.id),
  );
  // Patch local sobre o User da sessão ativa (nome/fuso editados em Configurações) — não muta
  // fixture/perfil compartilhado, só a sessão atual; reseta ao trocar de conta/sessão.
  const [userPatch, setUserPatch] = useState<Partial<User>>({});
  const [streakFreezesAvailable, setStreakFreezesAvailable] = useState(0);
  const [justLeveledUpTo, setJustLeveledUpTo] = useState<number | null>(null);

  // Evita aplicar a resposta de uma sessão antiga se o usuário trocar de sessão rápido demais
  // (ex.: logout seguido de login) — só a chamada mais recente pode atualizar o estado.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();

    async function syncFromSession(session: { access_token: string } | null) {
      const requestId = ++requestIdRef.current;
      if (!session) {
        setAccessTokenProvider(() => null);
        setIsRealSession(false);
        setRealUser(null);
        return;
      }

      setAccessTokenProvider(() => session.access_token);
      setIsRealSession(true);
      try {
        const me = await apiFetch<MeResponse>("/v1/users/me");
        if (requestIdRef.current !== requestId) return; // sessão trocou de novo enquanto buscava
        setRealUser(me.user);
        setGamification(me.gamification);
        setUserPatch({});
      } catch {
        // Sessão real válida mas GET /v1/users/me falhou (backend fora do ar, etc) — mantém a
        // sessão marcada como real (não cai pro mock) e deixa o perfil null, em vez de mostrar
        // dado inventado pra uma pessoa real.
        if (requestIdRef.current === requestId) setRealUser(null);
      }
    }

    supabase.auth.getSession().then(({ data }) => syncFromSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { error: error?.message ?? "Falha no login.", landingPath: "/" };
    }

    // Busca o papel aqui (não só espera o onAuthStateChange do efeito acima) porque a página de
    // login precisa saber pra onde navegar assim que o login der certo — teacher/admin não devem
    // cair no "/" do aluno. O efeito acima roda de qualquer forma em paralelo (evento SIGNED_IN)
    // e deixa o estado consistente; essa segunda leitura aqui é redundante mas inofensiva.
    setAccessTokenProvider(() => data.session.access_token);
    try {
      const me = await apiFetch<MeResponse>("/v1/users/me");
      return { error: null, landingPath: landingPathForRole(me.user.role) };
    } catch {
      return { error: "Login feito, mas não foi possível carregar seu perfil.", landingPath: "/" };
    }
  }, []);

  const switchAccount = useCallback((id: MockAccountId) => {
    setAccountCookie(id);
    setAccountId(id);
    setGamification(gamificationForAccount(id));
    setUserPatch({});
    setStreakFreezesAvailable(0);
    setJustLeveledUpTo(null);
  }, [setAccountId, setGamification, setUserPatch, setStreakFreezesAvailable, setJustLeveledUpTo]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUserPatch((current) => ({ ...current, ...patch }));
  }, []);

  const adjustStreakFreezes = useCallback((delta: number) => {
    setStreakFreezesAvailable((current) => Math.max(0, current + delta));
  }, []);

  const logout = useCallback(() => {
    // Desloga dos dois jeitos possíveis, mesmo que só um esteja ativo — mais simples e seguro do
    // que rastrear qual modo está ligado antes de decidir o que limpar.
    void createClient().auth.signOut();
    clearAccountCookie();
    setAccountId(null);
    setIsRealSession(false);
    setRealUser(null);
    router.push("/login");
  }, [router, setAccountId, setIsRealSession, setRealUser]);

  const updateGamification = useCallback((patch: Partial<GamificationProfile>) => {
    setGamification((current) => {
      // xp_total muda -> recalcula o nível como o servidor faria (nunca no componente
      // consumidor). Se o caller já mandou `level` explícito, respeita e não recalcula.
      const nextLevel =
        patch.xp_total !== undefined && patch.level === undefined
          ? levelForXp(patch.xp_total)
          : (patch.level ?? current.level);
      if (nextLevel > current.level) {
        setJustLeveledUpTo(nextLevel);
      }
      return { ...current, ...patch, level: nextLevel };
    });
  }, []);

  const dismissLevelUp = useCallback(() => {
    setJustLeveledUpTo(null);
  }, []);

  const mockAccount = accountId ? getAccountById(accountId) : null;
  const baseUser = isRealSession ? realUser : (mockAccount?.user ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: baseUser ? { ...baseUser, ...userPatch } : null,
      gamification,
      updateGamification,
      updateUser,
      streakFreezesAvailable,
      adjustStreakFreezes,
      loginWithPassword,
      isRealSession,
      switchAccount,
      logout,
      justLeveledUpTo,
      dismissLevelUp,
    }),
    [
      baseUser,
      userPatch,
      gamification,
      updateGamification,
      updateUser,
      streakFreezesAvailable,
      adjustStreakFreezes,
      loginWithPassword,
      isRealSession,
      switchAccount,
      logout,
      justLeveledUpTo,
      dismissLevelUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
