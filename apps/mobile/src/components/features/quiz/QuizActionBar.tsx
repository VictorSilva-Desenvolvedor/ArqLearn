import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface QuizActionBarProps {
  revealed: boolean;
  isCorrect: boolean;
  explanation: string;
  xpDailyCapReached: boolean;
  canVerify: boolean;
  verifying?: boolean;
  verifyError?: string | null;
  onSkip: () => void;
  onVerify: () => void;
  onContinue: () => void;
  // "Explique melhor" (API Spec §6, v1.6) — aprofunda a explicação curta acima sob demanda,
  // chamando IA de verdade (Groq). deepExplanation null = ainda não pedida nesta pergunta.
  deepExplanation?: string | null;
  explainLoading?: boolean;
  explainError?: string | null;
  onExplainMore?: () => void;
}

// Espelha apps/web/src/components/features/quiz/QuizActionBar.tsx.
export function QuizActionBar({
  revealed,
  isCorrect,
  explanation,
  xpDailyCapReached,
  canVerify,
  verifying = false,
  verifyError,
  onSkip,
  onVerify,
  onContinue,
  deepExplanation,
  explainLoading,
  explainError,
  onExplainMore,
}: QuizActionBarProps) {
  // P1 do /impeccable audit (18/08/2026): a barra ancorada no rodapé é a mais tocada do app
  // inteiro (Verificar/Continuar) e nenhuma tela aplicava o inset inferior do Android
  // edge-to-edge (SDK 57 não tem mais opt-out) — o botão primário desenhava sob a barra de
  // navegação do sistema.
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {revealed && (
        <Text
          style={[
            type.bodyMd,
            styles.explanation,
            { color: isCorrect ? colors.onTertiaryFixedVariant : colors.onErrorContainer },
          ]}
          accessibilityLiveRegion="polite"
        >
          {explanation}
        </Text>
      )}
      {revealed && onExplainMore && (
        <View style={styles.explainBlock}>
          {deepExplanation ? (
            <Text style={[type.bodySm, styles.deepExplanation]}>{deepExplanation}</Text>
          ) : (
            <Pressable
              style={styles.explainRow}
              onPress={onExplainMore}
              disabled={explainLoading}
              accessibilityRole="button"
              accessibilityLabel={explainLoading ? "Aprofundando explicação" : "Explique melhor"}
              accessibilityState={{ disabled: explainLoading }}
            >
              {explainLoading && <LoadingBlueprint size={16} />}
              <Text style={[type.bodySm, styles.explainLink, explainLoading && styles.explainLinkDisabled]}>
                {explainLoading ? "Aprofundando..." : "Explique melhor"}
              </Text>
            </Pressable>
          )}
          {explainError && <Text style={[type.bodySm, styles.explainError]}>{explainError}</Text>}
        </View>
      )}
      {revealed && xpDailyCapReached && (
        <View style={styles.xpCapRow}>
          <Icon name="bolt" size={16} color={colors.secondary} />
          <Text style={[type.bodySm, styles.xpCapText]}>
            Você atingiu o limite diário de XP — continue praticando, mas o XP extra de hoje não conta.
          </Text>
        </View>
      )}
      {!revealed && verifyError && (
        <Text
          accessibilityLiveRegion="polite"
          style={[type.bodySm, styles.explainError, styles.verifyError]}
        >
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
            <Button variant="ghost" disabled={verifying} onPress={onSkip}>
              Pular
            </Button>
            <Button
              variant="gamification"
              disabled={!canVerify || verifying}
              icon={verifying ? <LoadingBlueprint size={20} /> : undefined}
              onPress={onVerify}
            >
              {verifying ? "Verificando…" : "Verificar"}
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
    },
    explanation: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    explainBlock: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      gap: 4,
    },
    deepExplanation: {
      color: colors.onSurfaceVariant,
      backgroundColor: colors.surfaceContainer,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    explainRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
    },
    explainLink: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
    explainLinkDisabled: {
      opacity: 0.5,
    },
    explainError: {
      color: colors.error,
    },
    verifyError: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    xpCapRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
  });
