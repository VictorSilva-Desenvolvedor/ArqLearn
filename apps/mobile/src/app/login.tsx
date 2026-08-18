import { useContext, useState } from "react";
import * as Linking from "expo-linking";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AuthContext } from "@/contexts/AuthContext";
import { createSupabaseClient } from "@/lib/supabase/client";
import { colors, type } from "@/theme/tokens";

export default function LoginScreen() {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // P2 do /impeccable critique (18/08/2026): sem caminho de recuperação de senha no mobile.
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await auth?.loginWithPassword(email, password);
    if (!result || result.error) {
      setSubmitting(false);
      // Espelha apps/web/src/app/login/page.tsx: só traduz pro texto genérico quando a
      // Supabase de fato disse "credenciais inválidas" — qualquer outro erro (rate limit, rede,
      // provedor fora do ar) aparece como veio.
      const raw = result?.error ?? "";
      setError(raw === "Invalid login credentials" || !raw ? "E-mail ou senha inválidos." : raw);
      return;
    }
    // Sem router.replace aqui de propósito: `<Stack.Protected>` (app/_layout.tsx) reage sozinho
    // assim que AuthContext popula `user` e navega pra fora desta tela — chamar router.replace
    // manualmente tentaria ir pra uma rota que ainda nem existe no navigator nesse instante
    // (guard ainda fechado), já que `user` só é setado depois que GET /v1/users/me resolver.
    // `submitting` fica true até lá de propósito, pra não reabrir o formulário clicável por uma
    // fração de segundo antes do redirect automático — a tela desmonta durante essa espera.
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setResetMessage("Digite seu e-mail no campo acima primeiro.");
      return;
    }
    setResetSubmitting(true);
    setResetMessage(null);
    await createSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL("redefinir-senha"),
    });
    setResetSubmitting(false);
    setResetMessage("Se esse e-mail tiver uma conta, enviamos um link pra redefinir a senha.");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.brand}>
          <Icon name="logo" size={32} color={colors.primary} />
          <Text style={[type.displayLg, styles.brandText]}>ArqLearn</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[type.bodySm, styles.label]}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="voce@exemplo.com"
              placeholderTextColor={colors.outline}
              accessibilityLabel="E-mail"
            />
          </View>
          <View style={styles.field}>
            <Text style={[type.bodySm, styles.label]}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              accessibilityLabel="Senha"
            />
          </View>
          {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
          <Button fullWidth onPress={handleSubmit}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <Text
            style={[type.bodySm, styles.forgotPassword]}
            onPress={resetSubmitting ? undefined : handleForgotPassword}
            accessibilityRole="button"
          >
            {resetSubmitting ? "Enviando…" : "Esqueci minha senha"}
          </Text>
          {resetMessage && (
            <Text style={[type.bodySm, styles.resetMessage]}>{resetMessage}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // Transparente de propósito (a pedido do usuário): deixa o fundo animado
    // (AnimatedBlueprintBackground, montado em app/_layout.tsx) aparecer atrás.
    backgroundColor: "transparent",
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
  forgotPassword: {
    color: colors.primary,
    textAlign: "center",
  },
  resetMessage: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
});
