import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { MascotPlaceholder } from "@/components/features/auth/MascotPlaceholder";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Primeiro acesso ao app (usuário sem sessão) — listada antes de "login" em app/_layout.tsx pra
// ser a rota inicial do grupo `Stack.Protected guard={!isLoggedIn}`. Logout continua indo direto
// pra "/login" (router.replace explícito em LogoutMenuLink.tsx/perfil/configuracoes.tsx), então
// essa tela só aparece no primeiro contato, não a cada vez que alguém desloga.
export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.mascotFrame}>
            <MascotPlaceholder size={120} />
          </View>
          <Text style={[type.displayLg, styles.title]}>ArqLearn</Text>
          <Text style={[type.bodyLg, styles.subtitle]}>
            Aprenda arquitetura de forma técnica e divertida. Para todos.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button fullWidth size="lg" onPress={() => router.push("/cadastro")}>
            Começar agora
          </Button>
          <Button fullWidth variant="ghost" size="lg" onPress={() => router.push("/login")}>
            Já tenho uma conta
          </Button>
        </View>
      </View>
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
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    hero: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      maxWidth: 340,
    },
    mascotFrame: {
      width: 176,
      height: 176,
      borderRadius: 88,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceContainer,
      borderWidth: 2,
      borderColor: colors.primaryContainer,
    },
    title: {
      color: colors.primary,
      fontWeight: "700",
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    actions: {
      width: "100%",
      maxWidth: 420,
      gap: spacing.sm,
    },
  });
