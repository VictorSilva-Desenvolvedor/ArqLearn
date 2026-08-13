import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { colors } from "@/theme/tokens";

interface ProfileStatsGridProps {
  xpTotal: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// Espelha apps/web/src/components/features/profile/ProfileStatsGrid.tsx.
export function ProfileStatsGrid({ xpTotal, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard icon={<Icon name="bolt" size={24} color={colors.secondary} />} label="XP Total" value={`${xpTotal}`} />
        <StatCard
          icon={<Icon name="streak" size={24} color={colors.secondary} />}
          label="Sequência"
          value={`${streakCurrent} dias`}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          icon={<Icon name="militaryTech" size={24} color={colors.primary} />}
          label="Máximo"
          value={`${streakBest} dias`}
        />
        <StatCard icon={<Icon name="gems" size={24} color={colors.primary} />} label="Gemas" value={`${gems}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
