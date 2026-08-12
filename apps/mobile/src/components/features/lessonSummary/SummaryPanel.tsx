import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { colors, radius, spacing, type } from "@/theme/tokens";
import { StatCard } from "./StatCard";

interface SummaryPanelProps {
  xpEarned: number;
  accuracy: number;
  streak: number;
  hearts: number;
  moduleProgressPercent: number;
  gemsEarned?: number;
  nextHref: string;
}

// Espelha apps/web/src/components/features/lessonSummary/SummaryPanel.tsx.
export function SummaryPanel({
  xpEarned,
  accuracy,
  streak,
  hearts,
  moduleProgressPercent,
  gemsEarned = 0,
  nextHref,
}: SummaryPanelProps) {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={[type.displayLg, styles.title]}>Lição Concluída!</Text>
          <Text style={[type.bodyLg, styles.subtitle]}>Excelente progresso, Arquiteto!</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="bolt" size={28} color={colors.secondary} />} label="Total XP" value={`+${xpEarned}`} />
          </View>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="target" size={28} color={colors.tertiary} />} label="Precisão" value={`${accuracy}%`} />
          </View>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="streak" size={28} color={colors.secondary} />} label="Ofensiva" value={`${streak} Dias`} />
          </View>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="hearts" size={28} color={colors.errorRed} />} label="Vidas Restantes" value={`${hearts}`} />
          </View>
          {gemsEarned > 0 && (
            <View style={styles.gridItem}>
              <StatCard icon={<Icon name="gems" size={28} color={colors.primary} />} label="Gemas Ganhas" value={`+${gemsEarned}`} />
            </View>
          )}
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={[type.labelCaps, styles.progressLabel]}>Progresso do módulo</Text>
            <Text style={[type.labelCaps, styles.progressLabel]}>{moduleProgressPercent}%</Text>
          </View>
          <ProgressBar value={moduleProgressPercent} max={100} variant="thin" tone="primary" />
        </View>

        <Button variant="primary" fullWidth onPress={() => router.push(nextHref as never)}>
          Continuar para o Mapa
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  panel: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
  },
  title: {
    color: colors.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: "center",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridItem: {
    width: "47%",
    flexGrow: 1,
  },
  progressBlock: {
    width: "100%",
    gap: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.onSurfaceVariant,
  },
});
