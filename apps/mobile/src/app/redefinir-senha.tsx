import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { createSupabaseClient } from "@/lib/supabase/client";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

const MIN_PASSWORD_LENGTH = 6;

type Status = "checking" | "ready" | "invalid-link" | "done";

// Destino do redirectTo em login.tsx (handleForgotPassword) — `arqlearn://redefinir-senha`
// (scheme registrado em app.json). Fora dos dois grupos `<Stack.Protected>` de _layout.tsx de
// propósito: precisa ficar alcançável tanto antes quanto depois do setSession() abaixo popular
// `user` no AuthContext (senão o guard troca de tela sozinho no meio da digitação da senha nova
// — mesma classe de corrida documentada pro fluxo web em apps/web/src/app/login/page.tsx).
//
// RN não tem URL bar nem `detectSessionInUrl` (ver lib/supabase/client.ts) — diferente do web,
// aqui é preciso capturar o deep link manualmente com expo-linking e trocar o token pela sessão
// à mão. Trata os dois formatos que a Supabase pode mandar: `?code=` (PKCE, exchangeCodeForSession)
// ou `#access_token=...&refresh_token=...` (implícito, setSession) — não dá pra saber qual sem
// testar contra o projeto real, então cobre os dois.
export default function ResetPasswordScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword;

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseClient();

    async function tryEstablishSession(url: string | null) {
      if (!url) return false;
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code;
      if (typeof code === "string") {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        return !exchangeError;
      }
      // expo-linking já separa query params de path, mas o fragmento (#access_token=...) do
      // link de recuperação da Supabase não é um query param — extrai na mão.
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return false;
      const fragment = new URLSearchParams(url.slice(hashIndex + 1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      if (!accessToken || !refreshToken) return false;
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return !sessionError;
    }

    Linking.getInitialURL().then(async (url) => {
      if (!mounted) return;
      const ok = await tryEstablishSession(url);
      if (mounted) setStatus(ok ? "ready" : "invalid-link");
    });

    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const ok = await tryEstablishSession(url);
      if (mounted) setStatus(ok ? "ready" : "invalid-link");
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!passwordValid) return;
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await createSupabaseClient().auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStatus("done");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.brand}>
          <Icon name="logo" size={32} color={colors.primary} />
          <Text style={[type.displayLg, styles.brandText]}>ArqLearn</Text>
        </View>

        {status === "checking" && (
          <Text style={[type.bodyMd, styles.message]}>Verificando seu link…</Text>
        )}

        {status === "invalid-link" && (
          <Text style={[type.bodyMd, styles.message]}>
            Este link de redefinição não é válido ou já expirou. Peça um novo em "Esqueci minha
            senha" na tela de login.
          </Text>
        )}

        {status === "ready" && (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[type.bodySm, styles.label]}>Nova senha</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
                placeholderTextColor={colors.outline}
                accessibilityLabel="Nova senha"
              />
            </View>
            <View style={styles.field}>
              <Text style={[type.bodySm, styles.label]}>Confirmar nova senha</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel="Confirmar nova senha"
              />
            </View>
            {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
            <Button fullWidth disabled={!passwordValid || submitting} onPress={handleSubmit}>
              {submitting ? "Salvando…" : "Redefinir senha"}
            </Button>
          </View>
        )}

        {status === "done" && (
          <Text style={[type.bodyMd, styles.message]}>
            Senha redefinida com sucesso! Volte pra tela de login e entre com a nova senha.
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 24,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandText: {
      color: colors.primary,
      fontWeight: "700",
    },
    message: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      maxWidth: 360,
    },
    form: {
      width: "100%",
      maxWidth: 420,
      gap: 12,
    },
    field: {
      gap: 4,
    },
    label: {
      color: colors.onSurfaceVariant,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.onSurface,
    },
    error: {
      color: colors.error,
    },
  });
