import { StyleSheet, Text, View } from "react-native";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

export type BadgeTone = "primary" | "secondary" | "tertiary" | "error" | "neutral" | "gold";

interface BadgeProps {
  tone?: BadgeTone;
  children: string;
}

const createToneStyles = (
  colors: ColorTokens,
): Record<BadgeTone, { bg: string; fg: string; border?: string }> => ({
  primary: { bg: colors.primaryFixed, fg: colors.primary },
  secondary: { bg: colors.secondaryFixed, fg: colors.secondary },
  tertiary: { bg: colors.tertiaryFixed, fg: colors.onTertiaryFixedVariant },
  error: { bg: colors.errorContainer, fg: colors.error },
  neutral: { bg: colors.surfaceGray, fg: colors.outline, border: colors.outlineVariant },
  // VIP "Mestre Arquiteto" (a pedido do usuário) — mais contraste que "secondary" pro selo de
  // perfil se destacar (bg cheio em vez do tom pastel fixed).
  gold: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
});

export function Badge({ tone = "neutral", children }: BadgeProps) {
  const colors = useColors();
  const toneStyles = createToneStyles(colors);
  const tones = toneStyles[tone];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: tones.bg },
        tones.border ? { borderWidth: 1, borderColor: tones.border } : null,
      ]}
    >
      <Text style={[styles.label, type.labelCaps, { color: tones.fg }]}>{children.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    letterSpacing: 0.6,
  },
});
