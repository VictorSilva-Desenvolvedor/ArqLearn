import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { DailyGoalStatus } from "@/types/api";

interface DailyGoalCardProps {
  status: DailyGoalStatus;
}

// Meta Diária (TDD §13, v1.30) — antes deste componente lia xpToday/goal (constante hardcoded,
// nunca vinda do servidor); agora consome GET /v1/gamification/daily-goal de verdade. Meta batida
// assim que QUALQUER UMA das duas métricas (perguntas certas OU minutos estudados) atinge o alvo
// do nível escolhido — a barra mostra sempre a métrica mais perto de completar, nunca inventa um
// número só (progresso "inflado" destrói a confiança no indicador, princípio explícito do
// documento de metas diárias). "Revisar Erros" agora navega de verdade pra fila de revisão
// espaçada (TDD §10.3, mesmo destino que ReviewPromptCard já usa) — antes só mostrava um toast
// "em breve", sem nenhuma ação real atrás. Espelha apps/web/.../DailyGoalCard.tsx.
export function DailyGoalCard({ status }: DailyGoalCardProps) {
  const colors = useColors();
  const router = useRouter();

  const questionsProgress = status.questions_target > 0 ? status.questions_today / status.questions_target : 0;
  const minutesProgress = status.study_minutes_target > 0 ? status.study_minutes_today / status.study_minutes_target : 0;
  const leadingByQuestions = questionsProgress >= minutesProgress;

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Text style={[type.questionSm, { color: colors.onSurface, marginBottom: 8 }]}>Meta Diária</Text>
        <View style={styles.progressRow}>
          <ProgressBar
            value={leadingByQuestions ? status.questions_today : status.study_minutes_today}
            max={leadingByQuestions ? status.questions_target : status.study_minutes_target}
            variant="tube"
            tone="secondary"
            style={styles.progressBar}
          />
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            {status.questions_today}/{status.questions_target} perguntas · {status.study_minutes_today}/
            {status.study_minutes_target} min
          </Text>
        </View>
      </View>
      <Button variant="ghost" size="md" onPress={() => router.push("/revisao/sessao")}>
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
