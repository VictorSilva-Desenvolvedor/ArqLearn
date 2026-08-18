import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ErrorBannerProps {
  message?: string;
  onRetry: () => void;
}

// Espelha apps/web/src/components/ui/ErrorBanner.tsx — "Network error: non-blocking banner +
// retry" (Spec §7): não é um full-page takeover; o layout ao redor (tab bar) continua de pé.
export function ErrorBanner({
  message = "Não foi possível carregar esta página. Verifique sua conexão e tente novamente.",
  onRetry,
}: ErrorBannerProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <Icon name="wifiOff" size={48} color={colors.outline} />
      <Text style={[type.headlineMd, styles.title]}>Algo deu errado</Text>
      <Text style={[type.bodyMd, styles.message]}>{message}</Text>
      <Button variant="primary" onPress={onRetry}>
        Tentar novamente
      </Button>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    title: {
      color: colors.onSurface,
      textAlign: "center",
    },
    message: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
