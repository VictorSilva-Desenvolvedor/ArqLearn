import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { colors, type } from "@/theme/tokens";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/web/src/components/features/profile/ProgressSummaryCard.tsx.
export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  return (
    <View>
      <Text style={[type.headlineMd, styles.title]}>Progresso Geral</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            icon={<Icon name="school" size={24} color={colors.primary} />}
            label="Trilhas Concluídas"
            value={`${summary.tracks_completed}`}
          />
          <StatCard
            icon={<Icon name="menuBook" size={24} color={colors.secondary} />}
            label="Em Andamento"
            value={`${summary.tracks_in_progress}`}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            icon={<Icon name="eventAvailable" size={24} color={colors.tertiary} />}
            label="Lições (7 dias)"
            value={`${summary.lessons_completed_last_7d}`}
          />
          <StatCard
            icon={<Icon name="target" size={24} color={colors.primary} />}
            label="Precisão"
            value={`${summary.accuracy_rate}%`}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    marginBottom: 8,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
