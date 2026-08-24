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
      <Button variant="ghost" size="md" fullWidth onPress={() => router.push("/revisao/sessao")}>
        Revisar Erros
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 48,
    // Coluna, não linha: o card só é largo o bastante pra uma coluna num telefone (a Home limita
    // o conteúdo a 448px). Em `row`, o botão "Revisar Erros" disputava a largura com o bloco de
    // progresso e sobrava ~210px pro par barra+rótulo — a barra colapsava perto de zero e o
    // rótulo quebrava em 3 linhas (achado da auditoria visual da Home, 24/08/2026). É o mesmo
    // arranjo que apps/web já usa abaixo de `md` (flex-col md:flex-row).
    flexDirection: "column",
    alignItems: "stretch",
    gap: 16,
  },
  info: {
    width: "100%",
  },
  progressRow: {
    // Empilhado pelo mesmo motivo do web: o rótulo "0/10 perguntas · 0/12 min" não cabe ao lado
    // da barra numa largura de telefone sem espremer a barra até virar um toco ilegível.
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  progressBar: {
    width: "100%",
  },
});
