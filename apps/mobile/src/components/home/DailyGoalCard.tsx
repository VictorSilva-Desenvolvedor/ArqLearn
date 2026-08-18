import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/hooks/useToast";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";

interface DailyGoalCardProps {
  xpToday: number;
  goal: number;
}

// "Revisar Erros" não tem tela/endpoint próprio ainda em nenhum dos dois apps (web também não
// tem onClick aqui, apps/web/src/components/features/home/DailyGoalCard.tsx) — sem isso o toque
// não dava feedback nenhum. Toast informativo até a funcionalidade existir de verdade.
export function DailyGoalCard({ xpToday, goal }: DailyGoalCardProps) {
  const { showToast } = useToast();
  const colors = useColors();

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Text style={[type.questionSm, { color: colors.onSurface, marginBottom: 8 }]}>Meta Diária</Text>
        <View style={styles.progressRow}>
          <ProgressBar value={xpToday} max={goal} variant="tube" tone="secondary" style={styles.progressBar} />
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            {xpToday} / {goal} XP
          </Text>
        </View>
      </View>
      {/* Ghost, não primary — a feature ainda não existe (ver nota acima); um botão sólido
          treinaria o usuário a confiar num toque que não faz nada de verdade. */}
      <Button
        variant="ghost"
        size="md"
        onPress={() => showToast("Revisão de erros ainda não está disponível — em breve!")}
      >
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
