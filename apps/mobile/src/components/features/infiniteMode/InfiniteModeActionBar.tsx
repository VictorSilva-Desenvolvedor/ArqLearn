import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface InfiniteModeActionBarProps {
  revealed: boolean;
  xpDailyCapReached: boolean;
  canConfirm: boolean;
  verifying?: boolean;
  verifyError?: string | null;
  onGiveUp: () => void;
  onConfirm: () => void;
  onContinue: () => void;
}

// Espelha apps/web/src/components/features/infiniteMode/InfiniteModeActionBar.tsx — mais simples
// que QuizActionBar: sem bloco de explicação/"Explique melhor" (Modo Infinito não tem).
export function InfiniteModeActionBar({
  revealed,
  xpDailyCapReached,
  canConfirm,
  verifying = false,
  verifyError,
  onGiveUp,
  onConfirm,
  onContinue,
}: InfiniteModeActionBarProps) {
  // P1 do /impeccable audit (18/08/2026): mesmo achado do QuizActionBar.tsx — inset inferior do
  // Android edge-to-edge ausente na barra ancorada no rodapé.
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={[styles.bar, { paddingBottom: spacing.md + insets.bottom }]}>
      {revealed && xpDailyCapReached && (
        <View style={styles.xpCapRow}>
          <Icon name="bolt" size={16} color={colors.secondary} />
          <Text style={[type.bodySm, styles.xpCapText]}>
            Você atingiu o limite diário de XP — o XP extra de hoje não conta.
          </Text>
        </View>
      )}
      {!revealed && verifyError && (
        <Text accessibilityLiveRegion="polite" style={[type.bodySm, styles.verifyError]}>
          {verifyError}
        </Text>
      )}
      <View style={styles.footer}>
        {revealed ? (
          <Button variant="primary" fullWidth onPress={onContinue}>
            Continuar
          </Button>
        ) : (
          <>
            <Button variant="ghost" disabled={verifying} onPress={onGiveUp}>
              Desistir
            </Button>
            <Button
              variant="primary"
              disabled={!canConfirm || verifying}
              icon={verifying ? <LoadingBlueprint size={20} /> : undefined}
              onPress={onConfirm}
            >
              {verifying ? "Verificando…" : "Confirmar"}
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    bar: {
      borderTopWidth: 2,
      borderTopColor: colors.outlineVariant,
      backgroundColor: colors.surfaceBright,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    xpCapRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: spacing.sm,
    },
    xpCapText: {
      flex: 1,
      color: colors.secondary,
    },
    verifyError: {
      color: colors.error,
      marginBottom: spacing.sm,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
  });
