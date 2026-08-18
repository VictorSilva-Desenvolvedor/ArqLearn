import { StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

type StatPillTone = "primary" | "secondary" | "error";

interface StatPillProps {
  icon: IconName;
  value: number | string;
  tone: StatPillTone;
}

const createToneColor = (colors: ColorTokens): Record<StatPillTone, string> => ({
  primary: colors.primary,
  secondary: colors.secondary,
  error: colors.errorRed,
});

export function StatPill({ icon, value, tone }: StatPillProps) {
  const colors = useColors();
  const toneColor = createToneColor(colors);
  const color = toneColor[tone];
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={color} />
      <Text style={[type.statsNum, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
