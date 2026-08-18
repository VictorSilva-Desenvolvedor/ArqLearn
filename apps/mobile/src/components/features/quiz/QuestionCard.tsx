import { useEffect } from "react";
import { Image } from "expo-image";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { radius, spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { QuestionDifficulty, QuestionOption, QuestionType } from "@/types/api";
import { AnswerOption } from "./AnswerOption";
import { FillBlankInput } from "./FillBlankInput";

interface QuestionCardProps {
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  imageUrl?: string;
  options: QuestionOption[];
  selectedOptionId: string | null;
  revealed: boolean;
  verifying?: boolean;
  isSelectedCorrect: boolean;
  onSelect: (optionId: string) => void;
}

const difficultyPresentation: Record<QuestionDifficulty, { label: string; tone: BadgeTone }> = {
  easy: { label: "Fácil", tone: "tertiary" },
  medium: { label: "Médio", tone: "secondary" },
  hard: { label: "Difícil", tone: "error" },
  impossible: { label: "Impossível", tone: "primary" },
};

// Espelha apps/web/src/components/features/quiz/QuestionCard.tsx.
export function QuestionCard({
  prompt,
  type: questionType,
  difficulty,
  imageUrl,
  options,
  selectedOptionId,
  revealed,
  verifying = false,
  isSelectedCorrect,
  onSelect,
}: QuestionCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const difficultyInfo = difficultyPresentation[difficulty];

  // Web usa um nó sr-only role="status"/aria-live persistente; RN não tem DOM, então o anúncio
  // pro leitor de tela é imperativo, disparado quando o resultado é revelado.
  useEffect(() => {
    if (!revealed) return;
    AccessibilityInfo.announceForAccessibility(
      isSelectedCorrect ? "Resposta correta." : "Resposta incorreta.",
    );
  }, [revealed, isSelectedCorrect]);

  return (
    <View style={styles.container}>
      <View style={styles.promptBlock}>
        <Badge tone={difficultyInfo.tone}>{difficultyInfo.label}</Badge>
        <Text style={[type.questionLg, styles.prompt]}>{prompt}</Text>
      </View>
      {imageUrl && (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            // P2 do /impeccable critique (18/08/2026): antes repetia o prompt literalmente —
            // quem usa TalkBack ouvia a mesma frase duas vezes sem informação nova sobre o
            // diagrama em si. Mesmo achado corrigido no QuestionCard.tsx do web.
            accessibilityLabel="Diagrama de referência visual da questão"
          />
          <View style={styles.imageCaption}>
            <Text style={[type.labelCaps, styles.imageCaptionText]}>FIG. 1: ELEVAÇÃO</Text>
          </View>
        </View>
      )}
      {questionType === "fill_blank" ? (
        <FillBlankInput
          value={selectedOptionId ?? ""}
          revealed={revealed}
          locked={revealed || verifying}
          isCorrect={isSelectedCorrect}
          correctAnswer={options[0]?.label}
          onChangeText={onSelect}
        />
      ) : (
        <View
          style={[styles.optionsList, questionType === "matching" && styles.optionsGrid]}
          accessibilityRole="radiogroup"
        >
          {options.map((option) => (
            <View key={option.id} style={questionType === "matching" && styles.gridItem}>
              <AnswerOption
                label={option.label}
                selected={selectedOptionId === option.id}
                revealed={revealed}
                verifying={verifying}
                isCorrect={selectedOptionId === option.id ? isSelectedCorrect : undefined}
                disabled={revealed || verifying}
                onPress={() => onSelect(option.id)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    promptBlock: {
      gap: spacing.xs,
    },
    prompt: {
      color: colors.onSurface,
    },
    imageWrap: {
      width: "100%",
      height: 192,
      borderRadius: radius.xl,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceGray,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imageCaption: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: "rgba(248, 249, 255, 0.9)",
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    imageCaptionText: {
      fontSize: 10,
      lineHeight: 12,
      color: colors.outline,
    },
    optionsList: {
      gap: spacing.sm,
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    gridItem: {
      width: "48%",
    },
  });
