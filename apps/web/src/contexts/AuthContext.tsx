"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  gamificationForAccount,
  getAccountById,
  type MockAccountId,
} from "@/lib/api/mocks/fixtures/accounts";
import { nivelDoXp } from "@/lib/gamification/level";
import { clearAccountCookie, setAccountCookie } from "@/lib/auth/clientSession";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, setAccessTokenProvider } from "@/lib/api/http";
import { isResourceReal } from "@/lib/api/config";
import { getGamificationProfile } from "@/lib/api/resources/gamification";
import type { GamificationProfile, User } from "@/types/api";

// TDD §5.4 — mesmo intervalo/teto do backend, usado aqui só como stand-in de mock (nunca no
// componente que consome useAuth(); ver regra em Docs/CLAUDE.md sobre XP/vidas nunca calculados
// no cliente fora da camada de mock).
const HEARTS_MAX = 5;
const HEARTS_REGEN_INTERVAL_MS = 3 * 60 * 60 * 1000;

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
// as duas existem. `initialAccountId`/`initialMe` vêm do servidor (app/layout.tsx, que já lê o
// cookie mockado e busca o perfil real se houver sessão) — os dois casos concordam com SSR desde
// o primeiro render do cliente, sem janela de `user: null` (useAuth(), usado por TopAppBar e
// outros, parte do princípio de que uma rota protegida sempre tem usuário).
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialAccountId,
  initialMe,
}: {
  children: ReactNode;
  initialAccountId: string | null;
  initialMe: MeResponse | null;
}) {
  const pathname = usePathname();
  const initialAccount = getAccountById(initialAccountId);

  const [accountId, setAccountId] = useState<MockAccountId | null>(initialAccount?.id ?? null);
  const [isRealSession, setIsRealSession] = useState(Boolean(initialMe));
  const [realUser, setRealUser] = useState<User | null>(initialMe?.user ?? null);
  // true assim que sabemos de verdade se há sessão (real ou mockada) — sincronamente já true
  // quando o servidor entregou uma das duas via SSR (initialMe/initialAccount). Some por rede de
  // segurança pro caso (ainda não totalmente diagnosticado ao vivo) em que o servidor não vê a
  // mesma sessão que o cliente Supabase vê: enquanto isso, mostra um loading em vez de renderizar
  // useAuth() consumers com user ainda indefinido.
  const [isResolved, setIsResolved] = useState(Boolean(initialMe) || Boolean(initialAccount));
  const [gamification, setGamification] = useState<GamificationProfile>(
    initialMe?.gamification ?? gamificationForAccount(initialAccount?.id),
  );
  // Patch local sobre o User da sessão ativa (nome/fuso editados em Configurações) — não muta
  // fixture/perfil compartilhado, só a sessão atual; reseta ao trocar de conta/sessão.
  const [userPatch, setUserPatch] = useState<Partial<User>>({});
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
        setIsResolved(true);
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
      } finally {
        if (requestIdRef.current === requestId) setIsResolved(true);
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
    setJustLeveledUpTo(null);
  }, [setAccountId, setGamification, setUserPatch, setJustLeveledUpTo]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUserPatch((current) => ({ ...current, ...patch }));
  }, []);

  // streak_freezes_available agora vem no próprio GamificationProfile (GET /v1/users/me e
  // /v1/gamification/me) — ajusta ali em vez de manter um contador solto e desincronizado.
  const adjustStreakFreezes = useCallback((delta: number) => {
    setGamification((current) => ({
      ...current,
      streak_freezes_available: Math.max(0, current.streak_freezes_available + delta),
    }));
  }, []);

  const logout = useCallback(() => {
    // Desloga dos dois jeitos possíveis, mesmo que só um esteja ativo — mais simples e seguro do
    // que rastrear qual modo está ligado antes de decidir o que limpar.
    void createClient().auth.signOut();
    clearAccountCookie();
    // Navegação forçada (não router.push) — mesmo motivo do login (ver app/login/page.tsx): um
    // router.push reaproveita o layout raiz já renderizado, e a sessão real "morta" só some do
    // cookie, não do estado que o SSR já tinha capturado. Um reload completo garante que
    // app/layout.tsx rebusca do zero (sem sessão) e o app inteiro reflete o logout de verdade.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberado, ver comentário acima
    window.location.href = "/login";
  }, []);

  const updateGamification = useCallback((patch: Partial<GamificationProfile>) => {
    setGamification((current) => {
      // xp_total muda -> recalcula o nível como o servidor faria (nunca no componente
      // consumidor). Se o caller já mandou `level` explícito, respeita e não recalcula.
      const nextLevel =
        patch.xp_total !== undefined && patch.level === undefined
          ? nivelDoXp(patch.xp_total)
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

  // Resolve a regeneração de vidas (TDD §5.4) quando o relógio local bate o hearts_next_at
  // vigente: sessão real busca o perfil de novo (fonte da verdade é o backend, que já aplica a
  // regeneração preguiçosa em GET /v1/gamification/me); sessão mockada calcula localmente — é o
  // único lugar do cliente com permissão pra reimplementar a fórmula do servidor (mock stand-in,
  // ver Docs/CLAUDE.md). Roda para qualquer sessão (real ou mock) sempre que hearts_next_at
  // muda, não só quando um diálogo de vidas está aberto — o contador do TopAppBar também deve
  // atualizar sozinho.
  useEffect(() => {
    if (!gamification.hearts_next_at || gamification.hearts_current >= HEARTS_MAX) return;

    const targetMs = new Date(gamification.hearts_next_at).getTime();
    const msLeft = targetMs - Date.now();

    const resolve = async () => {
      if (isRealSession && isResourceReal("gamification")) {
        try {
          const fresh = await getGamificationProfile();
          setGamification((current) => ({
            ...current,
            hearts_current: fresh.hearts_current,
            hearts_next_at: fresh.hearts_next_at,
          }));
        } catch {
          // Falha de rede momentânea — mantém o estado atual; o próximo hearts_next_at (ou a
          // próxima leitura de perfil) tenta de novo, sem travar a UI numa promise rejeitada.
        }
        return;
      }
      setGamification((current) => {
        if (current.hearts_current >= HEARTS_MAX) return current;
        const nextHeartsCurrent = current.hearts_current + 1;
        const nextHeartsNextAt =
          nextHeartsCurrent >= HEARTS_MAX ? null : new Date(targetMs + HEARTS_REGEN_INTERVAL_MS).toISOString();
        return { ...current, hearts_current: nextHeartsCurrent, hearts_next_at: nextHeartsNextAt };
      });
    };

    if (msLeft <= 0) {
      void resolve();
      return;
    }
    const timer = setTimeout(() => void resolve(), msLeft);
    return () => clearTimeout(timer);
  }, [gamification.hearts_next_at, gamification.hearts_current, isRealSession]);

  const mockAccount = accountId ? getAccountById(accountId) : null;
  const baseUser = isRealSession ? realUser : (mockAccount?.user ?? null);

  // Rede de segurança: se depois de resolvido não há usuário nenhum (nem real nem mockado) numa
  // rota que não é /login, o proxy.ts deveria ter barrado antes — mas se por algum motivo o
  // cliente e o servidor discordarem sobre a sessão (cookie que o proxy validou mas o cliente
  // Supabase não reconhece, por exemplo), isso força a ida pro login em vez de deixar
  // useAuth() explodindo pra sempre numa página que nunca vai ter usuário.
  useEffect(() => {
    if (isResolved && !baseUser && pathname !== "/login") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberado, ver comentário acima
      window.location.href = "/login";
    }
  }, [isResolved, baseUser, pathname]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: baseUser ? { ...baseUser, ...userPatch } : null,
      gamification,
      updateGamification,
      updateUser,
      streakFreezesAvailable: gamification.streak_freezes_available,
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
      adjustStreakFreezes,
      loginWithPassword,
      isRealSession,
      switchAccount,
      logout,
      justLeveledUpTo,
      dismissLevelUp,
    ],
  );

  // /login nunca tem usuário mesmo resolvido — não faz sentido segurar ela atrás do loading.
  const shouldWait = !isResolved && pathname !== "/login";

  return (
    <AuthContext.Provider value={value}>
      {shouldWait ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse rounded-full h-10 w-10 bg-surface-container" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
