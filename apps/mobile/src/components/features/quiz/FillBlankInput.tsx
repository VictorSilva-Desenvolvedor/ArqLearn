import { StyleSheet, Text, TextInput, View } from "react-native";
import { radius, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface FillBlankInputProps {
  value: string;
  revealed: boolean;
  // Trava a edição sem mostrar a cor de certo/errado — usado enquanto a resposta está sendo
  // verificada no servidor (ainda não sabemos se acertou). `revealed` sozinho controla a cor.
  locked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  onChangeText: (value: string) => void;
}

// fill_blank não tem "opções pra tocar" — é a única variante de pergunta que precisa de um campo
// de texto de verdade em vez da lista de AnswerOption. Espelha
// apps/web/src/components/features/quiz/FillBlankInput.tsx (o workaround `readOnly` do web é
// específico de um bug de estilo do Chromium em `<input disabled>` — não existe em RN, então
// aqui `editable={!locked}` já basta).
export function FillBlankInput({
  value,
  revealed,
  locked = revealed,
  isCorrect,
  correctAnswer,
  onChangeText,
}: FillBlankInputProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const toneStyle = revealed
    ? isCorrect
      ? { borderColor: colors.tertiary, backgroundColor: colors.tertiaryFixed, color: colors.onTertiaryFixedVariant }
      : { borderColor: colors.error, backgroundColor: colors.errorContainer, color: colors.onErrorContainer }
    : { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceBright, color: colors.onSurface };

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        editable={!locked}
        onChangeText={onChangeText}
        placeholder="Digite sua resposta"
        placeholderTextColor={colors.outline}
        accessibilityLabel="Resposta"
        style={[type.bodyLg, styles.input, { borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor, color: toneStyle.color }]}
      />
      {revealed && !isCorrect && correctAnswer && (
        <Text style={[type.bodySm, styles.hint]}>
          Resposta esperada: <Text style={type.bodySmBold}>{correctAnswer}</Text>
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    input: {
      width: "100%",
      borderWidth: 2,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    hint: {
      color: colors.onSurfaceVariant,
    },
  });
