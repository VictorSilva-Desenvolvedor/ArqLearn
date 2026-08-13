import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, type } from "@/theme/tokens";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

// Espelha apps/web/src/components/features/lessonSummary/StatCard.tsx — lá o card nunca teve
// onClick; onPress é opcional aqui pra deixar quem usa (ProfileStatsGrid, ProgressSummaryCard)
// decidir dar alguma reação ao toque em vez de ficar mudo.
export function StatCard({ icon, label, value, onPress }: StatCardProps) {
  const content = (
    <Card padding="md" radius="lg" style={styles.card}>
      {icon}
      <Text style={[type.statsNum, styles.value]}>{value}</Text>
      <Text style={[type.labelCaps, styles.label]}>{label}</Text>
    </Card>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  value: {
    color: colors.onSurface,
  },
  label: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
});
