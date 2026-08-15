import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StatInfoDialog } from "./StatInfoDialog";
import { colors, type } from "@/theme/tokens";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/web/src/components/features/profile/ProgressSummaryCard.tsx — "Em Andamento"
// reaproveita a navegação pra Explorar (onde as trilhas em progresso aparecem) e os outros 3
// abrem um StatInfoDialog explicando o número, já que não existe tela dedicada de "trilhas
// concluídas", "histórico de lições" ou "detalhe de precisão".
export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  const router = useRouter();
  const [tracksDialogOpen, setTracksDialogOpen] = useState(false);
  const [lessonsDialogOpen, setLessonsDialogOpen] = useState(false);
  const [accuracyDialogOpen, setAccuracyDialogOpen] = useState(false);

  return (
    <View>
      <Text style={[type.headlineMd, styles.title]}>Progresso Geral</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            icon={<Icon name="school" size={24} color={colors.primary} />}
            label="Trilhas Concluídas"
            value={`${summary.tracks_completed}`}
            onPress={() => setTracksDialogOpen(true)}
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
            onPress={() => setLessonsDialogOpen(true)}
          />
          <StatCard
            icon={<Icon name="target" size={24} color={colors.primary} />}
            label="Precisão"
            value={`${summary.accuracy_rate}%`}
            onPress={() => setAccuracyDialogOpen(true)}
          />
        </View>
      </View>
      <StatInfoDialog
        open={tracksDialogOpen}
        onOpenChange={setTracksDialogOpen}
        icon="school"
        tone="primary"
        title={
          summary.tracks_completed === 1 ? "1 trilha concluída" : `${summary.tracks_completed} trilhas concluídas`
        }
        description="Você concluiu todas as lições dessas trilhas. Continue explorando pra desbloquear mais conquistas e XP."
      />
      <StatInfoDialog
        open={lessonsDialogOpen}
        onOpenChange={setLessonsDialogOpen}
        icon="eventAvailable"
        tone="tertiary"
        title={`${summary.lessons_completed_last_7d} lições nos últimos 7 dias`}
        description="Contagem de lições concluídas na última semana corrida. Pratique todo dia pra manter o ritmo e sua sequência viva."
      />
      <StatInfoDialog
        open={accuracyDialogOpen}
        onOpenChange={setAccuracyDialogOpen}
        icon="target"
        tone="primary"
        title={`${summary.accuracy_rate}% de precisão`}
        description="Percentual de respostas certas em relação ao total de respostas dadas em todas as suas sessões de prática."
      />
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
