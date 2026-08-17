import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { colors, spacing, type } from "@/theme/tokens";

interface InfiniteModeActionBarProps {
  revealed: boolean;
  xpDailyCapReached: boolean;
  canConfirm: boolean;
  verifying?: boolean;
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
  onGiveUp,
  onConfirm,
  onContinue,
}: InfiniteModeActionBarProps) {
  return (
    <View style={styles.bar}>
      {revealed && xpDailyCapReached && (
        <View style={styles.xpCapRow}>
          <Icon name="bolt" size={16} color={colors.secondary} />
          <Text style={[type.bodySm, styles.xpCapText]}>
            Você atingiu o limite diário de XP — o XP extra de hoje não conta.
          </Text>
        </View>
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

const styles = StyleSheet.create({
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
