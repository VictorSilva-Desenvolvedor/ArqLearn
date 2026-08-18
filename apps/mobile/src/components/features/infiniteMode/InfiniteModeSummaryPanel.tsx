import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { formatMinutesSeconds } from "@/lib/utils/format";
import { radius, spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface InfiniteModeSummaryPanelProps {
  questionsAnswered: number;
  correctCount: number;
  accuracy: number;
  xpEarned: number;
  avgTimeMs: number;
  chestAvailable?: boolean;
}

// Espelha apps/web/src/components/features/infiniteMode/InfiniteModeSummaryPanel.tsx.
export function InfiniteModeSummaryPanel({
  questionsAnswered,
  correctCount,
  accuracy,
  xpEarned,
  avgTimeMs,
  chestAvailable = false,
}: InfiniteModeSummaryPanelProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const title = accuracy >= 90 ? "Nota Máxima Alcançada!" : "Sessão Concluída!";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={[type.displayLg, styles.title]}>{title}</Text>
          <Text style={[type.bodyLg, styles.subtitle]}>Modo Infinito</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="factCheck" size={28} color={colors.primary} />} label="Questões" value={`${questionsAnswered}`} />
          </View>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="target" size={28} color={colors.tertiary} />} label="Precisão" value={`${accuracy}%`} />
          </View>
          <View style={styles.gridItem}>
            <StatCard icon={<Icon name="bolt" size={28} color={colors.secondary} />} label="XP Ganho" value={`+${xpEarned}`} />
          </View>
        </View>

        <View style={styles.analysisBox}>
          <Text style={[type.questionSm, styles.analysisTitle]}>Análise de Desempenho</Text>
          <View style={styles.analysisRow}>
            <Text style={[type.bodyMd, styles.analysisLabel]}>Tempo médio por questão</Text>
            <Text style={[type.bodyMdBold, styles.analysisValue]}>
              {formatMinutesSeconds(avgTimeMs / 1000)}
            </Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={[type.bodyMd, styles.analysisLabel]}>Acertos</Text>
            <Text style={[type.bodyMdBold, styles.analysisValue]}>{correctCount}</Text>
          </View>
        </View>

        <View style={styles.actions}>
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
          <Button variant="primary" fullWidth onPress={() => router.push("/")}>
            Voltar ao Mapa
          </Button>
          <Button variant="ghost" fullWidth onPress={() => router.push("/explorar")}>
            Tentar Outro Tema
          </Button>
        </View>
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
      gap: spacing.sm,
    },
    gridItem: {
      flex: 1,
    },
    analysisBox: {
      width: "100%",
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
    },
    analysisTitle: {
      color: colors.onSurface,
      fontWeight: "700",
      marginBottom: 4,
    },
    analysisRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    analysisLabel: {
      color: colors.onSurfaceVariant,
    },
    analysisValue: {
      color: colors.onSurface,
    },
    actions: {
      width: "100%",
      gap: spacing.sm,
    },
  });
