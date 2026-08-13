import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { useToast } from "@/hooks/useToast";
import { colors } from "@/theme/tokens";

interface ProfileStatsGridProps {
  xpTotal: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// Espelha apps/web/src/components/features/profile/ProfileStatsGrid.tsx — lá nenhum dos 4 cards
// reage ao clique; aqui XP Total e Máximo mostram um toast informativo (não existe tela dedicada
// pra eles), Sequência reaproveita o mesmo StreakDialog do TopAppBar e Gemas reaproveita a
// navegação já existente pra Loja.
export function ProfileStatsGrid({ xpTotal, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          icon={<Icon name="bolt" size={24} color={colors.secondary} />}
          label="XP Total"
          value={`${xpTotal}`}
          onPress={() => showToast(`Você já acumulou ${xpTotal} XP no total!`, "success")}
        />
        <StatCard
          icon={<Icon name="streak" size={24} color={colors.secondary} />}
          label="Sequência"
          value={`${streakCurrent} dias`}
          onPress={() => setStreakDialogOpen(true)}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          icon={<Icon name="militaryTech" size={24} color={colors.primary} />}
          label="Máximo"
          value={`${streakBest} dias`}
          onPress={() => showToast(`Seu recorde de sequência é ${streakBest} dias!`, "success")}
        />
        <StatCard
          icon={<Icon name="gems" size={24} color={colors.primary} />}
          label="Gemas"
          value={`${gems}`}
          onPress={() => router.push("/loja" as never)}
        />
      </View>
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
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
