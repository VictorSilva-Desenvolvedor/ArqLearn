import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockGamificationProfile, mockUser } from "@/mocks/fixtures";
import type { GamificationProfile, User } from "@/types/api";

export interface AuthContextValue {
  user: User;
  gamification: GamificationProfile;
  updateGamification: (patch: Partial<GamificationProfile>) => void;
}

// Sessão mockada, mesmo padrão de apps/web/src/contexts/AuthContext.tsx — a auth real
// (Supabase) entra depois trocando só este provider.
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [gamification, setGamification] = useState<GamificationProfile>(mockGamificationProfile);

  const updateGamification = useCallback((patch: Partial<GamificationProfile>) => {
    setGamification((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: mockUser, gamification, updateGamification }),
    [gamification, updateGamification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
