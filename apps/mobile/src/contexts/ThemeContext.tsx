import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME_TOPIC, getThemeByTopic, type ThemeDefinition, type ThemeTopic } from "@/lib/api/mocks/fixtures/themes";

export interface ThemeContextValue {
  theme: ThemeDefinition;
  setTopic: (topic: ThemeTopic) => void;
}

const STORAGE_KEY = "arqlearn_theme_topic";

// Tema/tópico "principal" escolhido pelo aluno — não é claro/escuro, é qual assunto (Fundamentos,
// História, Urbanismo, Sistemas Construtivos...) fica em destaque na Home, no Explorar e no Modo
// Infinito. Espelha apps/web/src/contexts/ThemeContext.tsx — sem cookie/SSR/router.refresh (não
// existe aqui): persiste em AsyncStorage e hidrata de forma assíncrona depois do primeiro render
// (mesmo padrão de lib/offline/downloadedLessons.ts), começando com DEFAULT_THEME_TOPIC enquanto
// isso, já que não há como ler storage de forma síncrona no primeiro render do RN.
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [topic, setTopicState] = useState<ThemeTopic>(DEFAULT_THEME_TOPIC);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!cancelled && stored) setTopicState(getThemeByTopic(stored).topic);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTopic = useCallback((next: ThemeTopic) => {
    setTopicState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme: getThemeByTopic(topic), setTopic }), [topic, setTopic]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
