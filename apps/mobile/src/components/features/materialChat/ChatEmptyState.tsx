import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { radius, spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Espelha apps/web/src/components/features/materialChat/ChatEmptyState.tsx — mesmas sugestões,
// mesma cópia. Não são decorativas: tocar envia a pergunta de verdade pelo mesmo caminho da
// barra de digitação.
export const CHAT_SUGGESTIONS = [
  "Resuma este material em 3 pontos",
  "Explique o conceito mais difícil deste documento",
  "Que erros comuns esse material ajuda a evitar?",
] as const;

interface ChatEmptyStateProps {
  title: string;
  onSuggestion: (question: string) => void;
  disabled?: boolean;
}

export function ChatEmptyState({ title, onSuggestion, disabled }: ChatEmptyStateProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Card padding="lg" radius="lg" style={styles.card}>
      <View style={styles.badge}>
        <Icon name="forum" size={32} color={colors.secondary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[type.headlineMd, styles.title]}>Pergunte à Arq</Text>
        <Text style={[type.bodyMd, styles.subtitle]}>
          Ela responde com base em <Text style={styles.material}>{title}</Text> e cita a página do
          documento em cada resposta.
        </Text>
      </View>
      <View style={styles.suggestions}>
        {CHAT_SUGGESTIONS.map((question) => (
          <Pressable
            key={question}
            accessibilityRole="button"
            accessibilityLabel={`Perguntar: ${question}`}
            disabled={disabled}
            onPress={() => onSuggestion(question)}
            style={({ pressed }) => [
              styles.suggestion,
              pressed && styles.suggestionPressed,
              disabled && styles.suggestionDisabled,
            ]}
          >
            <Text style={[type.bodyMd, styles.suggestionText]}>{question}</Text>
            <Icon name="arrowForward" size={20} color={colors.primary} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      gap: spacing.md,
    },
    badge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondaryFixed,
    },
    textBlock: {
      gap: 4,
    },
    title: {
      color: colors.onSurface,
      textAlign: "center",
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    material: {
      fontWeight: "700",
      color: colors.onSurface,
    },
    suggestions: {
      alignSelf: "stretch",
      gap: 4,
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    suggestionPressed: {
      backgroundColor: colors.surfaceContainer,
    },
    suggestionDisabled: {
      opacity: 0.5,
    },
    suggestionText: {
      flex: 1,
      color: colors.primary,
    },
  });
