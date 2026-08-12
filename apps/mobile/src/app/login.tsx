import { useContext, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AuthContext } from "@/contexts/AuthContext";
import { colors, type } from "@/theme/tokens";

export default function LoginScreen() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await auth?.loginWithPassword(email, password);
    setSubmitting(false);
    if (!result || result.error) {
      // Espelha apps/web/src/app/login/page.tsx: só traduz pro texto genérico quando a
      // Supabase de fato disse "credenciais inválidas" — qualquer outro erro (rate limit, rede,
      // provedor fora do ar) aparece como veio.
      const raw = result?.error ?? "";
      setError(raw === "Invalid login credentials" || !raw ? "E-mail ou senha inválidos." : raw);
      return;
    }
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          />
        </View>
        {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
        <Button fullWidth onPress={handleSubmit}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
});
