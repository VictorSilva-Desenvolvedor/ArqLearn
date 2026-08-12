import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, type } from "@/theme/tokens";

interface AnswerOptionProps {
  label: string;
  selected: boolean;
  revealed: boolean;
  // Resposta enviada, aguardando o servidor confirmar certo/errado — mostra um spinner na opção
  // marcada em vez do ícone de certo/errado (ainda não sabemos qual dos dois é).
  verifying?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

// Espelha apps/web/src/components/features/quiz/AnswerOption.tsx.
export function AnswerOption({
  label,
  selected,
  revealed,
  verifying,
  isCorrect,
  disabled,
  onPress,
}: AnswerOptionProps) {
  const toneStyle = toneFor({ selected, revealed, verifying, isCorrect });
  // Nunca só cor pra indicar certo/errado — ícone dedicado some ambiguidade pra quem não
  // distingue verde/vermelho, e é o sinal equivalente ao aria-checked do web pra leitor de tela.
  const revealIcon = revealed && selected && !verifying ? (isCorrect ? "success" : "cancel") : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[styles.base, toneStyle]}
    >
      <Text style={[type.bodyLg, styles.label, toneStyle.text && { color: toneStyle.text }]}>{label}</Text>
      {selected && verifying && <ActivityIndicator size="small" color={colors.primary} />}
      {revealIcon && (
        <Icon name={revealIcon} size={20} color={isCorrect ? colors.tertiary : colors.error} />
      )}
    </Pressable>
  );
}

function toneFor({
  selected,
  revealed,
  verifying,
  isCorrect,
}: {
  selected: boolean;
  revealed: boolean;
  verifying?: boolean;
  isCorrect?: boolean;
}): { borderWidth: number; borderColor: string; backgroundColor: string; opacity?: number; text?: string } {
  if (revealed && selected) {
    return isCorrect
      ? { borderWidth: 2, borderColor: colors.tertiary, backgroundColor: colors.tertiaryFixed, text: colors.onTertiaryFixedVariant }
      : { borderWidth: 2, borderColor: colors.error, backgroundColor: colors.errorContainer, text: colors.onErrorContainer };
  }
  if (revealed && !selected) {
    return { borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceBright, opacity: 0.6 };
  }
  if (selected && verifying) {
    return { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryFixed, opacity: 0.8 };
  }
  if (selected) {
    return { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryFixed };
  }
  return { borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceBright };
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    flex: 1,
    color: colors.onSurface,
  },
});
