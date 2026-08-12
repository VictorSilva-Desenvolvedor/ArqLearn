import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { InfiniteModeActionBar } from "@/components/features/infiniteMode/InfiniteModeActionBar";
import { InfiniteModeHeader } from "@/components/features/infiniteMode/InfiniteModeHeader";
import { useInfiniteModeSession } from "@/components/features/infiniteMode/useInfiniteModeSession";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { useToast } from "@/hooks/useToast";
import { getThemeByTopic } from "@/lib/api/mocks/fixtures/themes";
import { colors, spacing, type } from "@/theme/tokens";

// Espelha apps/web/src/app/(lesson)/infinito/[topic]/sessao/page.tsx.
export default function InfiniteModeSessionScreen() {
  const router = useRouter();
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const infinite = useInfiniteModeSession(topic);
  const themeLabel = getThemeByTopic(topic).label;
  const { showToast } = useToast();

  useEffect(() => {
    if (infinite.levelUpTo === null) return;
    showToast(`Nível ${infinite.levelUpTo} desbloqueado! Perguntas novas liberadas.`, "success");
    infinite.dismissLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite.levelUpTo]);

  if (infinite.notAvailable) {
    return (
      <View style={styles.centerScreen}>
        <Icon name="construction" size={48} color={colors.outline} />
        <Text style={[type.headlineMd, styles.notAvailableTitle]}>
          Modo Infinito de {themeLabel} ainda não está pronto
        </Text>
        <Text style={[type.bodyMd, styles.notAvailableCaption]}>
          Estamos preparando as perguntas deste tema. Escolha outro tema ou tente de novo mais tarde.
        </Text>
        <Button variant="primary" onPress={() => router.push("/explorar")}>
          Voltar para Explorar
        </Button>
      </View>
    );
  }

  if (infinite.loading || !infinite.question) {
    return (
      <View style={styles.centerScreen}>
        <Text style={[type.bodyLg, styles.loadingText]}>Carregando desafio…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <InfiniteModeHeader
        topicLabel={themeLabel}
        current={infinite.levelProgress}
        total={infinite.levelProgressTotal}
        level={infinite.level}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <QuestionCard
          prompt={infinite.question.prompt}
          type={infinite.question.type}
          difficulty={infinite.question.difficulty}
          imageUrl={infinite.question.image_url}
          options={infinite.question.options}
          selectedOptionId={infinite.selectedOptionId}
          revealed={infinite.revealed}
          verifying={infinite.verifying}
          isSelectedCorrect={infinite.lastResult?.correct ?? false}
          onSelect={infinite.selectOption}
        />
      </ScrollView>
      <InfiniteModeActionBar
        revealed={infinite.revealed}
        xpDailyCapReached={infinite.lastResult?.xp_daily_cap_reached ?? false}
        canConfirm={Boolean(infinite.selectedOptionId?.trim())}
        verifying={infinite.verifying}
        onGiveUp={infinite.giveUp}
        onConfirm={infinite.verify}
        onContinue={infinite.continueNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  notAvailableTitle: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  notAvailableCaption: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
  },
});
