import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, type } from "@/theme/tokens";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

// Espelha apps/web/src/components/features/lessonSummary/StatCard.tsx.
export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card padding="md" radius="lg" style={styles.card}>
      {icon}
      <Text style={[type.statsNum, styles.value]}>{value}</Text>
      <Text style={[type.labelCaps, styles.label]}>{label}</Text>
    </Card>
  );
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
