import { useContext, useEffect } from "react";
import { HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { AuthContext, AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toast } from "@/components/ui/Toast";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { AnimatedBlueprintBackground } from "@/components/layout/AnimatedBlueprintBackground";
import { LevelUpCelebration } from "@/components/features/gamification/LevelUpCelebration";
import { StreakAtRiskPrompt } from "@/components/features/gamification/StreakAtRiskPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";

SplashScreen.preventAutoHideAsync();

// O NavigationContainer interno do expo-router pinta o próprio tema padrão do React Navigation
// (colors.background = rgb(242,242,242)) numa camada abaixo de cada tela, ANTES de
// contentStyle/Stack.Screen entrarem em jogo — Stack.screenOptions.contentStyle="transparent"
// (ver RootNavigator) sozinho não bastava, o cinza padrão continuava aparecendo atrás do fundo
// animado (AnimatedBlueprintBackground). Sobrescreve só esse campo do tema; tema custom
// necessário só por causa disso, não por dark mode (o app não tem um ainda).
const navigationTheme: typeof DefaultTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

// Fica dentro do AuthProvider (junto de StreakAtRiskPrompt/LevelUpCelebration) porque
// usePushNotifications precisa do usuário logado pra registrar o token — não dá pra chamar o
// hook direto em RootLayout, que fica fora do provider na árvore.
function PushNotificationsBootstrap() {
  usePushNotifications();
  return null;
}

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
    // contentStyle transparente de propósito (a pedido do usuário, fundo animado — ver
    // AnimatedBlueprintBackground abaixo): só welcome.tsx, cadastro.tsx, login.tsx e as 5 abas de
    // (tabs) tornaram seu próprio fundo transparente pra deixá-lo aparecer; toda tela de sessão/
    // quiz/lição continua pintando seu próprio backgroundColor opaco (não tocadas), então não
    // fica exposta por engano — decisão deliberada de não distrair em telas de foco.
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
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
        {/* "welcome" primeiro de propósito: sem initialRouteName explícito, o Stack usa o
            primeiro <Stack.Screen> deste grupo como rota inicial — é o que faz o primeiro
            acesso (usuário nunca logado) cair na tela de boas-vindas em vez de direto no
            login. Logout continua indo direto pra "/login" via router.replace explícito
            (LogoutMenuLink.tsx, perfil/configuracoes.tsx), sem passar por aqui de novo. */}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
      {/* Fora dos dois grupos guardados de propósito: um link de recuperação de senha pode
          chegar com o app deslogado OU logado (outra conta), e o setSession() dentro da própria
          tela muda `isLoggedIn` no meio do fluxo — se estivesse dentro de um Stack.Protected, o
          guard trocaria de tela sozinho assim que a sessão de recuperação populasse `user`, antes
          da pessoa terminar de digitar a senha nova (mesma classe de corrida documentada acima
          pro guard normal). Ver apps/mobile/src/app/redefinir-senha.tsx. */}
      <Stack.Screen name="redefinir-senha" />
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
    <NavigationThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <AppearanceProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                {/* "auto": expo-status-bar acompanha o esquema de cor ativo (useColorScheme(),
                    que já reflete a preferência manual via Appearance.setColorScheme em
                    AppearanceContext) — ícones escuros no tema claro, claros no escuro. */}
                <StatusBar style="auto" />
                <AnimatedBlueprintBackground />
                <RootNavigator />
                <Toast />
                <LevelUpCelebration />
                <StreakAtRiskPrompt />
                <PushNotificationsBootstrap />
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </AppearanceProvider>
      </SafeAreaProvider>
    </NavigationThemeProvider>
  );
}
