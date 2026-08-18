import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { radius, spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import { StatCard } from "./StatCard";

interface SummaryPanelProps {
  xpEarned: number;
  accuracy: number;
  streak: number;
  hearts: number;
  moduleProgressPercent: number;
  gemsEarned?: number;
  nextHref: string;
  chestAvailable?: boolean;
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
  chestAvailable = false,
}: SummaryPanelProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
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

        {/* CTA do Baú Diário (v1.18) — só aparece quando as 10 perguntas do dia já foram somadas
            (lição + Modo Infinito) e o baú de hoje ainda não foi aberto. */}
        {chestAvailable && (
          <Button
            variant="gamification"
            fullWidth
            onPress={() => router.push("/bau")}
            icon={<Icon name="chest" size={22} color={colors.onSecondaryContainer} />}
          >
            Abrir Baú Diário
          </Button>
        )}

        <Button variant="primary" fullWidth onPress={() => router.push(nextHref as never)}>
          Continuar para o Mapa
        </Button>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
