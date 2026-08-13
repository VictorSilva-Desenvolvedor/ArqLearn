import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, type } from "@/theme/tokens";

interface InfiniteModePromptCardProps {
  topic: string;
  themeLabel: string;
}

// Espelha apps/web/src/components/features/explore/InfiniteModePromptCard.tsx.
export function InfiniteModePromptCard({ topic, themeLabel }: InfiniteModePromptCardProps) {
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
      <Button variant="gamification" onPress={() => router.push(`/infinito/${topic}/sessao` as never)}>
        Desafiar-se
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
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
