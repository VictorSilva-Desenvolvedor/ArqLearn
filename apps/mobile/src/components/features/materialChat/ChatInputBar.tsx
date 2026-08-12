import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { colors, radius, spacing, type } from "@/theme/tokens";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

// Espelha apps/web/src/components/features/materialChat/ChatInputBar.tsx.
export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <View style={styles.bar}>
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
        <IconButton icon={<Icon name="send" color={colors.primary} />} label="Enviar pergunta" onPress={submit} disabled={disabled} />
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
