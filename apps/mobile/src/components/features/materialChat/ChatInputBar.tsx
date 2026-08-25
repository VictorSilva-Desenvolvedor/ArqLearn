import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { radius, spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ChatInputBarProps {
  // Retorna (ou resolve para) `false` em caso de falha — o rascunho só é limpo em caso de
  // sucesso (mesmo achado do ChatInputBar.tsx do web).
  onSend: (message: string) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
}

// Espelha apps/web/src/components/features/materialChat/ChatInputBar.tsx.
export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [value, setValue] = useState("");
  // P1 do /impeccable audit (18/08/2026): mesmo achado do QuizActionBar.tsx — barra ancorada no
  // rodapé sem o inset inferior do Android edge-to-edge.
  const insets = useSafeAreaInsets();
  // O botão precisa parecer o que ele é: antes ficava sempre habilitado e o toque com o campo
  // vazio caía num early-return silencioso (auditoria de 25/08/2026, rodada 4 — mesmo achado do
  // web, onde foi medido com `isDisabled() === false` no Playwright).
  const canSend = value.trim().length > 0 && !disabled;

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    const result = await onSend(trimmed);
    if (result !== false) setValue("");
  };

  return (
    <View style={[styles.bar, { paddingBottom: spacing.sm + insets.bottom }]}>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          placeholder="Pergunte algo sobre o material..."
          placeholderTextColor={colors.onSurfaceVariant}
          editable={!disabled}
          style={[type.bodyLg, styles.input]}
        />
        <IconButton
          icon={<Icon name="send" color={canSend ? colors.primary : colors.outline} />}
          label="Enviar pergunta"
          onPress={submit}
          disabled={!canSend}
        />
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
      paddingVertical: spacing.sm,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surfaceGray,
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      borderRadius: radius.xl,
      paddingLeft: spacing.sm,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sm,
      color: colors.onSurface,
    },
  });
