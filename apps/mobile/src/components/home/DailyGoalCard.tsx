import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { colors, type } from "@/theme/tokens";

interface DailyGoalCardProps {
  xpToday: number;
  goal: number;
}

export function DailyGoalCard({ xpToday, goal }: DailyGoalCardProps) {
  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Text style={[type.questionSm, { color: colors.onSurface, marginBottom: 8 }]}>Meta Diária</Text>
        <View style={styles.progressRow}>
          <ProgressBar value={xpToday} max={goal} variant="tube" tone="secondary" style={styles.progressBar} />
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            {xpToday} / {goal} XP
          </Text>
        </View>
      </View>
      <Button variant="primary" size="md">
        Revisar Erros
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  info: {
    flex: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
  },
});
