import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface InfiniteModePromptCardProps {
  topic: string;
  themeLabel: string;
  hasContent: boolean;
}

// Espelha apps/web/src/components/features/explore/InfiniteModePromptCard.tsx. hasContent:false
// desabilita "Desafiar-se" em vez de deixar cair no 404 TOPIC_HAS_NO_QUESTIONS do backend
// (POST /v1/infinite-mode/sessions só sorteia entre perguntas aprovadas do tópico — sem nenhuma,
// não tem o que sortear).
export function InfiniteModePromptCard({ topic, themeLabel, hasContent }: InfiniteModePromptCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Icon name="allInclusive" size={32} color={colors.secondary} />
        <View style={styles.textBlock}>
          <Text style={[type.questionSm, styles.title]}>Modo Infinito</Text>
          <Text style={[type.bodySm, styles.caption]}>
            Pratique sem limites com perguntas de dificuldade elevada sobre {themeLabel}.
          </Text>
        </View>
      </View>
      {hasContent ? (
        <Button variant="gamification" onPress={() => router.push(`/infinito/${topic}/sessao` as never)}>
          Desafiar-se
        </Button>
      ) : (
        <Badge tone="neutral">Em construção</Badge>
      )}
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
