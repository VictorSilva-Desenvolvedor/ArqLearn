import { useContext, useEffect } from "react";
import { HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toast } from "@/components/ui/Toast";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { LevelUpCelebration } from "@/components/features/gamification/LevelUpCelebration";
import { StreakAtRiskPrompt } from "@/components/features/gamification/StreakAtRiskPrompt";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

// Sem proxy/middleware server-side no RN (não há SSR) — este é o equivalente client-side de
// apps/web/src/proxy.ts. Usa `<Stack.Protected guard={...}>` (expo-router, guarda declarativa de
// rota) em vez de um `useEffect` + `router.replace` imperativo: a versão imperativa tinha uma
// corrida real — o `<Stack/>` já montado não desmonta ao trocar de rota (é a mesma instância que
// só troca a tela ativa internamente, reagindo à navegação por conta própria, sem esperar o
// componente pai re-renderizar), então entre `router.replace("/")` no login e o efeito do pai
// redirecionar de volta, a rota protegida chegava a ficar ativa sem sessão e derrubava a tela com
// "useAuth chamado sem sessão ativa" (reproduzido ao vivo via `expo export --platform web` +
// Playwright). Com guarda declarativa, a tela protegida nem existe na árvore do navigator
// enquanto `guard` for falso — não tem frame intermediário pra derrubar.
function RootNavigator() {
  const auth = useContext(AuthContext);

  if (!auth?.isResolved) {
    return <LoadingBlueprint variant="fullscreen" size={160} />;
  }

  const isLoggedIn = Boolean(auth.user);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        {/* expo-router só reconhece o nome exato da rota folha aqui (sem _layout.tsx próprio
            nessas pastas, "trilhas"/"infinito"/"materiais" sozinhos não casam com nada — dá
            warning silencioso de rota inexistente e a tela nunca fica navegável). */}
        <Stack.Screen name="trilhas/[trackId]/[lessonId]/sessao" />
        <Stack.Screen name="trilhas/[trackId]/[lessonId]/resumo" />
        <Stack.Screen name="trilhas/[trackId]/[lessonId]/conquista" />
        <Stack.Screen name="bau" />
        <Stack.Screen name="infinito/[topic]/sessao" />
        <Stack.Screen name="infinito/[topic]/resumo" />
        <Stack.Screen name="materiais/[uploadId]/resumo" />
        <Stack.Screen name="materiais/[uploadId]/chat" />
        <Stack.Screen name="perfil/configuracoes" />
        <Stack.Screen name="loja" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="ajuda" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    Inter_400Regular,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <RootNavigator />
            <Toast />
            <LevelUpCelebration />
            <StreakAtRiskPrompt />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
