import { useContext, useEffect } from "react";
import { HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toast } from "@/components/ui/Toast";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

// Sem proxy/middleware server-side no RN (não há SSR) — este é o equivalente client-side de
// apps/web/src/proxy.ts: redireciona pro login quando não há sessão, e do login pro app quando
// já existe uma. Roda depois de isResolved (primeiro efeito de sessão do AuthContext já
// terminou), senão redirecionaria todo mundo pro login por uma fração de segundo a cada abertura
// do app.
function RootNavigator() {
  const auth = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!auth?.isResolved) return;
    const onLoginScreen = pathname === "/login";
    if (!auth.user && !onLoginScreen) {
      router.replace("/login");
    } else if (auth.user && onLoginScreen) {
      router.replace("/");
    }
  }, [auth?.isResolved, auth?.user, pathname, router]);

  if (!auth?.isResolved) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
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
        <ToastProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <Toast />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
