import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Espelha apps/web/src/components/features/profile/LogoutMenuLink.tsx. Sem hack de reload de
// página (não há SSR aqui) — router.replace("/login") depois do signOut basta, o guard de
// _layout.tsx faria isso de qualquer forma assim que onAuthStateChange disparar.
export function LogoutMenuLink() {
  const { logout } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  const handlePress = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Sair">
      <Card padding="md" radius="lg" style={styles.row}>
        <Icon name="logout" size={24} color={colors.error} />
        <Text style={[type.bodyLg, styles.label]}>Sair</Text>
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    label: {
      flex: 1,
      color: colors.error,
    },
  });
