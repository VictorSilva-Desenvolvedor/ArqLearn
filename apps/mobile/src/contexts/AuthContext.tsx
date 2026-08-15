import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { nivelDoXp } from "@/lib/gamification/level";
import { createSupabaseClient } from "@/lib/supabase/client";
import { apiFetch, setAccessTokenProvider } from "@/lib/api/http";
import { isResourceReal } from "@/lib/api/config";
import { getGamificationProfile } from "@/lib/api/resources/gamification";
import type { GamificationProfile, User } from "@/types/api";

// TDD §5.4 — mesmo intervalo/teto do backend, usado aqui só como stand-in de mock (nunca no
// componente que consome useAuth()).
const HEARTS_MAX = 5;
const HEARTS_REGEN_INTERVAL_MS = 3 * 60 * 60 * 1000;

interface MeResponse {
  user: User;
  gamification: GamificationProfile;
}

export interface AuthContextValue {
  user: User | null;
  gamification: GamificationProfile;
  updateGamification: (patch: Partial<GamificationProfile>) => void;
  updateUser: (patch: Partial<User>) => void;
  streakFreezesAvailable: number;
  adjustStreakFreezes: (delta: number) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  // Sempre true depois do primeiro efeito de sessão resolver (com ou sem usuário) — telas usam
  // isso pra decidir entre mostrar um loading e navegar pro login/app.
  isResolved: boolean;
  justLeveledUpTo: number | null;
  dismissLevelUp: () => void;
}

// Sessão real via Supabase Auth é a única fonte de usuário no mobile (sem o modo demonstração
// por cookie mockado que o web usa pra professor/admin — fora de escopo aqui, ver plano). Sem
// SSR/pré-fetch de servidor: todo o estado começa vazio e é resolvido no primeiro efeito.
export const AuthContext = createContext<AuthContextValue | null>(null);

const emptyGamification: GamificationProfile = {
  xp_total: 0,
  xp_today: 0,
  level: 1,
  streak_current: 0,
  streak_best: 0,
  streak_freezes_available: 0,
  streak_at_risk: false,
  hearts_current: HEARTS_MAX,
  hearts_next_at: null,
  gems: 0,
  league_tier: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [gamification, setGamification] = useState<GamificationProfile>(emptyGamification);
  const [justLeveledUpTo, setJustLeveledUpTo] = useState<number | null>(null);

  // Evita aplicar a resposta de uma sessão antiga se o usuário trocar de sessão rápido demais.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const supabase = createSupabaseClient();

    async function syncFromSession(session: { access_token: string } | null) {
      const requestId = ++requestIdRef.current;
      if (!session) {
        setAccessTokenProvider(() => null);
        setUser(null);
        setIsResolved(true);
        return;
      }

      setAccessTokenProvider(() => session.access_token);
      try {
        const me = await apiFetch<MeResponse>("/v1/users/me");
        if (requestIdRef.current !== requestId) return;
        setUser(me.user);
        setGamification(me.gamification);
      } catch {
        // Sessão real válida mas GET /v1/users/me falhou (backend fora do ar etc.) — não
        // inventa dado pra uma pessoa real, só deixa sem perfil.
        if (requestIdRef.current === requestId) setUser(null);
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

    // Sem proxy/middleware server-side renovando o token por fora (não há SSR no RN) — o SDK
    // já renova sozinho enquanto o app está em primeiro plano, mas precisa ser pausado/retomado
    // manualmente conforme o app entra/sai de background (padrão oficial Supabase pra RN),
    // senão o timer de refresh continua rodando com o app fechado sem necessidade.
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    // O onAuthStateChange do efeito acima cuida de popular user/gamification — aqui só
    // reporta sucesso/falha pra tela de login decidir quando navegar.
    return { error: null };
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  // streak_freezes_available agora vem no próprio GamificationProfile (GET /v1/users/me e
  // /v1/gamification/me) — ajusta ali em vez de manter um contador solto e desincronizado.
  const adjustStreakFreezes = useCallback((delta: number) => {
    setGamification((current) => ({
      ...current,
      streak_freezes_available: Math.max(0, current.streak_freezes_available + delta),
    }));
  }, []);

  const logout = useCallback(async () => {
    await createSupabaseClient().auth.signOut();
    // Sem o hack de window.location.href do web (não há SSR/root-layout a resincronizar) — o
    // onAuthStateChange acima já limpa user/gamification; a tela que chama logout() navega
    // depois (router.replace("/login")).
  }, []);

  const updateGamification = useCallback((patch: Partial<GamificationProfile>) => {
    setGamification((current) => {
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

  // Regeneração de vidas (TDD §5.4) — mesma lógica de apps/web/src/contexts/AuthContext.tsx.
  useEffect(() => {
    if (!gamification.hearts_next_at || gamification.hearts_current >= HEARTS_MAX) return;

    const targetMs = new Date(gamification.hearts_next_at).getTime();
    const msLeft = targetMs - Date.now();

    const resolve = async () => {
      if (user && isResourceReal("gamification")) {
        try {
          const fresh = await getGamificationProfile();
          setGamification((current) => ({
            ...current,
            hearts_current: fresh.hearts_current,
            hearts_next_at: fresh.hearts_next_at,
          }));
        } catch {
          // Falha de rede momentânea — a próxima leitura de perfil tenta de novo.
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
  }, [gamification.hearts_next_at, gamification.hearts_current, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      gamification,
      updateGamification,
      updateUser,
      streakFreezesAvailable: gamification.streak_freezes_available,
      adjustStreakFreezes,
      loginWithPassword,
      logout,
      isResolved,
      justLeveledUpTo,
      dismissLevelUp,
    }),
    [
      user,
      gamification,
      updateGamification,
      updateUser,
      adjustStreakFreezes,
      loginWithPassword,
      logout,
      isResolved,
      justLeveledUpTo,
      dismissLevelUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
