import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance } from "react-native";

export type AppearancePreference = "light" | "dark";

export interface AppearanceContextValue {
  preference: AppearancePreference;
  setPreference: (next: AppearancePreference) => void;
}

const STORAGE_KEY = "arqlearn_appearance_preference";

// Padrão claro sempre, mesmo antes do AsyncStorage resolver (não dá pra ler storage de forma
// síncrona no primeiro render do RN) — sem isto, um celular com o sistema em modo escuro
// piscaria escuro por um instante até a preferência salva (ou o padrão) ser aplicada.
Appearance.setColorScheme("light");

// Alternância manual claro/escuro (a pedido explícito do usuário, 19/08/2026 — reverte o
// `userInterfaceStyle: "automatic"` do PR #125, que seguia só o tema do sistema sem opção
// própria no app). `Appearance.setColorScheme` sobrescreve o que `useColorScheme()` devolve em
// todo o app — nenhum componente precisa saber da preferência diretamente, todos já leem cor via
// `useColors()` → `useColorScheme()`. Duas opções só (claro/escuro), sem "seguir sistema": é
// exatamente o que foi pedido — padrão claro, alternável, não "automático".
export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("light");

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (cancelled || stored !== "dark") return;
      setPreferenceState("dark");
      Appearance.setColorScheme("dark");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    Appearance.setColorScheme(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({ preference, setPreference }), [preference, setPreference]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
