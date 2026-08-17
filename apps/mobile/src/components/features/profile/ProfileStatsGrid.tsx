import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { StatInfoDialog } from "./StatInfoDialog";
import { progressoDoNivel, xpParaProximoNivel } from "@/lib/gamification/level";
import { colors } from "@/theme/tokens";

interface ProfileStatsGridProps {
  xpTotal: number;
  level: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// Espelha apps/web/src/components/features/profile/ProfileStatsGrid.tsx — os 4 cards reagem ao
// toque: XP Total abre um modal explicando nível/progresso (StatInfoDialog), Sequência e Máximo
// reaproveitam o mesmo StreakDialog do TopAppBar (ele já mostra streak atual E recorde), Gemas
// reaproveita a navegação já existente pra Loja.
export function ProfileStatsGrid({ xpTotal, level, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  const router = useRouter();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const xpFaltam = xpParaProximoNivel(level, xpTotal);
  const progresso = progressoDoNivel(level, xpTotal);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          icon={<Icon name="bolt" size={24} color={colors.secondary} />}
          label="XP Total"
          value={`${xpTotal}`}
          onPress={() => setXpDialogOpen(true)}
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
          onPress={() => setStreakDialogOpen(true)}
        />
        <StatCard
          icon={<Icon name="gems" size={24} color={colors.primary} />}
          label="Gemas"
          value={`${gems}`}
          onPress={() => router.push("/loja" as never)}
        />
      </View>
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
      <StatInfoDialog
        open={xpDialogOpen}
        onOpenChange={setXpDialogOpen}
        icon="bolt"
        tone="secondary"
        title={`${xpTotal} XP no total`}
        description={`Você está no Nível ${level}. Faltam ${xpFaltam} XP para o Nível ${level + 1} — ganhe XP completando lições e mantendo sua sequência.`}
        footer={
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progresso * 100)}%` }]} />
          </View>
        }
      />
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
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceGray,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
});
