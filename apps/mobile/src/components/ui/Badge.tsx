import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

export type BadgeTone = "primary" | "secondary" | "tertiary" | "error" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  children: string;
}

const toneStyles: Record<BadgeTone, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primaryFixed, fg: colors.primary },
  secondary: { bg: colors.secondaryFixed, fg: colors.secondary },
  tertiary: { bg: colors.tertiaryFixed, fg: colors.onTertiaryFixedVariant },
  error: { bg: colors.errorContainer, fg: colors.error },
  neutral: { bg: colors.surfaceGray, fg: colors.outline, border: colors.outlineVariant },
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
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
