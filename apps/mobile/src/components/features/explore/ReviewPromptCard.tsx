import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ReviewPromptCardProps {
  dueCount: number;
}

// "Revisar agora" (TDD §10.3) — só aparece quando GET /v1/review/summary diz que há algo vencido,
// entre todos os tópicos já praticados (não só o tema selecionado no momento). Espelha
// apps/web/src/components/features/explore/ReviewPromptCard.tsx / InfiniteModePromptCard, mas sem
// prop de tópico — a fila de revisão não é de um tema só.
export function ReviewPromptCard({ dueCount }: ReviewPromptCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();

  if (dueCount <= 0) return null;

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Icon name="replay" size={32} color={colors.tertiary} />
        <View style={styles.textBlock}>
          <Text style={[type.questionSm, styles.title]}>Revisar agora</Text>
          <Text style={[type.bodySm, styles.caption]}>
            {dueCount} {dueCount === 1 ? "item pronto" : "itens prontos"} pra revisão, de tudo que
            você já praticou.
          </Text>
        </View>
      </View>
      <Button variant="gamification" onPress={() => router.push("/revisao/sessao")}>
        Revisar
      </Button>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      flexWrap: "wrap",
      backgroundColor: colors.surfaceGray,
    },
    info: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    caption: {
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
  });
