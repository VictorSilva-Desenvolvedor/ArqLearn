import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, type } from "@/theme/tokens";
import type { UploadSummaryKeyPoint } from "@/types/api";

interface KeyPointsChecklistProps {
  points: UploadSummaryKeyPoint[];
}

// Espelha apps/web/src/components/features/materialSummary/KeyPointsChecklist.tsx.
export function KeyPointsChecklist({ points }: KeyPointsChecklistProps) {
  return (
    <View style={styles.container}>
      <Text style={[type.headlineMd, styles.title]}>O que você precisa saber</Text>
      {points.map((point) => (
        <View key={point.title} style={styles.row}>
          <Icon name="success" size={24} color={colors.tertiary} />
          <View style={styles.textBlock}>
            <Text style={[type.bodyLgBold, styles.pointTitle]}>{point.title}</Text>
            <Text style={[type.bodyMd, styles.explanation]}>{point.explanation}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.onSurface,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  pointTitle: {
    color: colors.onSurface,
  },
  explanation: {
    color: colors.onSurfaceVariant,
  },
});
