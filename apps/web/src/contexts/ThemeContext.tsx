"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_THEME_TOPIC, getThemeByTopic, type ThemeDefinition, type ThemeTopic } from "@/lib/api/mocks/fixtures/themes";
import { setThemeCookie } from "@/lib/theme/clientTheme";

export interface ThemeContextValue {
  theme: ThemeDefinition;
  setTopic: (topic: ThemeTopic) => void;
}

// Tema/tópico "principal" escolhido pelo aluno — não é claro/escuro, é qual assunto (Fundamentos,
// História, Urbanismo, Sistemas Construtivos...) fica em destaque na Home, no Explorar e no Modo
// Infinito. `initialTopic` vem do cookie lido no servidor em app/layout.tsx (mesmo motivo do
// AuthProvider: SSR e primeira renderização do cliente precisam concordar).
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTopic,
}: {
  children: ReactNode;
  initialTopic: string | null;
}) {
  const router = useRouter();
  const [topic, setTopicState] = useState<ThemeTopic>(
    () => getThemeByTopic(initialTopic).topic ?? DEFAULT_THEME_TOPIC,
  );

  const setTopic = useCallback(
    (next: ThemeTopic) => {
      setThemeCookie(next);
      setTopicState(next);
      // Home/(shell) leem o tema via cookie em Server Components — sem isso a troca só
      // apareceria depois de uma navegação, não na hora que o aluno escolhe no dropdown.
      router.refresh();
    },
    [setTopicState, router],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: getThemeByTopic(topic), setTopic }),
    [topic, setTopic],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
