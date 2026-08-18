import { useContext, useEffect, useRef } from "react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { AuthContext } from "@/contexts/AuthContext";
import { registerPushToken } from "@/lib/api/resources/notifications";

// Pede permissão de notificação e registra o token Expo do device no backend (API Spec §9
// v1.21, POST /v1/notifications/push-token) — sem isso o gatilho de streak em risco
// (cmd/notify-streak-risk) calcula quem está em risco mas não tem pra onde mandar o push. Só
// roda com usuário logado (o endpoint precisa de um user_id pra associar o token). Um
// `hasRegisteredRef` por sessão evita repetir a chamada toda vez que `auth.user` for
// re-referenciado (ex.: updateUser trocando outro campo do objeto).
export function usePushNotifications() {
  const auth = useContext(AuthContext);
  const hasRegisteredRef = useRef(false);

  const isLoggedIn = Boolean(auth?.user);

  useEffect(() => {
    if (!isLoggedIn || hasRegisteredRef.current) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;

    const register = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      hasRegisteredRef.current = true;
      await registerPushToken(token, Platform.OS as "ios" | "android");
    };

    // Best-effort: falha de permissão negada, device sem suporte a push (emulador sem Google
    // Play Services) ou rede fora não pode derrubar o app — a pessoa só não recebe push, o
    // resto do app funciona igual.
    register().catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) hasRegisteredRef.current = false;
  }, [isLoggedIn]);
}
