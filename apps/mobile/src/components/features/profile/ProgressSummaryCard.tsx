import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { useToast } from "@/hooks/useToast";
import { colors, type } from "@/theme/tokens";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/web/src/components/features/profile/ProgressSummaryCard.tsx — lá nenhum dos 4
// cards reage ao clique; aqui "Em Andamento" reaproveita a navegação pra Explorar (onde as
// trilhas em progresso aparecem) e os outros 3 mostram um toast informativo, já que não existe
// tela dedicada de "trilhas concluídas", "histórico de lições" ou "detalhe de precisão".
export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <View>
      <Text style={[type.headlineMd, styles.title]}>Progresso Geral</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            icon={<Icon name="school" size={24} color={colors.primary} />}
            label="Trilhas Concluídas"
            value={`${summary.tracks_completed}`}
            onPress={() =>
              showToast(
                summary.tracks_completed === 1
                  ? "Você concluiu 1 trilha até agora!"
                  : `Você concluiu ${summary.tracks_completed} trilhas até agora!`,
                "success",
              )
            }
          />
          <StatCard
            icon={<Icon name="menuBook" size={24} color={colors.secondary} />}
            label="Em Andamento"
            value={`${summary.tracks_in_progress}`}
            onPress={() => router.push("/explorar" as never)}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            icon={<Icon name="eventAvailable" size={24} color={colors.tertiary} />}
            label="Lições (7 dias)"
            value={`${summary.lessons_completed_last_7d}`}
            onPress={() =>
              showToast(`Você concluiu ${summary.lessons_completed_last_7d} lições nos últimos 7 dias.`, "success")
            }
          />
          <StatCard
            icon={<Icon name="target" size={24} color={colors.primary} />}
            label="Precisão"
            value={`${summary.accuracy_rate}%`}
            onPress={() => showToast(`Sua taxa de acerto geral é ${summary.accuracy_rate}%.`, "success")}
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
