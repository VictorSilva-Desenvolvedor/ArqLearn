import { StyleSheet, View } from "react-native";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

type ProgressBarVariant = "tube" | "thin";
type ProgressBarTone = "primary" | "secondary";

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: ProgressBarVariant;
  tone?: ProgressBarTone;
  style?: object;
}

const trackHeight: Record<ProgressBarVariant, number> = {
  tube: 12,
  thin: 6,
};

const createFillColor = (colors: ColorTokens): Record<ProgressBarTone, string> => ({
  primary: colors.primary,
  secondary: colors.secondary,
});

export function ProgressBar({ value, max, variant = "tube", tone = "secondary", style }: ProgressBarProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const fillColor = createFillColor(colors);
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View style={[styles.track, { height: trackHeight[variant] }, style]}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fillColor[tone] }]} />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    track: {
      width: "100%",
      borderRadius: 9999,
      backgroundColor: colors.surfaceGray,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 9999,
    },
  });
