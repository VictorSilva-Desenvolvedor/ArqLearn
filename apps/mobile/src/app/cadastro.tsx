import { useContext, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AuthContext } from "@/contexts/AuthContext";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

const MIN_PASSWORD_LENGTH = 6;

// Tela de criação de conta — não existia antes (só login.tsx). Alcançável a partir de
// app/welcome.tsx ("Começar agora"); espelha a estrutura de login.tsx (mesmos campos/estilo).
export default function CadastroScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const result = await auth?.signUp(email, password);
    if (!result || result.error) {
      setSubmitting(false);
      setError(result?.error ?? "Não foi possível criar sua conta.");
      return;
    }
    if (result.needsEmailConfirmation) {
      // Sem sessão ainda (confirmação de e-mail exigida pelo projeto Supabase) — o guard de
      // app/_layout.tsx não navega sozinho nesse caso, então avisa e manda pro login.
      setSubmitting(false);
      setConfirmationMessage("Conta criada! Verifique seu e-mail para confirmar antes de entrar.");
      return;
    }
    // Com sessão já criada, `submitting` fica true até o <Stack.Protected> (app/_layout.tsx)
    // reagir sozinho ao AuthContext populado e navegar pra dentro do app — mesma lógica de
    // login.tsx, sem router.replace manual aqui.
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
              autoComplete="password-new"
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              accessibilityLabel="Senha"
            />
          </View>
          <View style={styles.field}>
            <Text style={[type.bodySm, styles.label]}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              accessibilityLabel="Confirmar senha"
            />
          </View>
          {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
          {confirmationMessage && <Text style={[type.bodySm, styles.confirmationMessage]}>{confirmationMessage}</Text>}
          <Button fullWidth onPress={handleSubmit}>
            {submitting ? "Criando conta..." : "Criar conta"}
          </Button>
          <Pressable
            onPress={() => router.push("/login")}
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[type.bodySm, styles.loginLink]}>Já tenho uma conta</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      // Transparente de propósito (mesma convenção de login.tsx): deixa o fundo animado
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
    confirmationMessage: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    loginLink: {
      color: colors.primary,
      textAlign: "center",
      paddingVertical: 10,
    },
  });
