import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { InfiniteModeActionBar } from "@/components/features/infiniteMode/InfiniteModeActionBar";
import { InfiniteModeHeader } from "@/components/features/infiniteMode/InfiniteModeHeader";
import { useInfiniteModeSession } from "@/components/features/infiniteMode/useInfiniteModeSession";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { useToast } from "@/hooks/useToast";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Espelha apps/web/src/app/(lesson)/revisao/sessao/page.tsx — "Revisar agora" (TDD §10.3),
// reaproveita o mesmo hook/loop de resposta do Modo Infinito (useInfiniteModeSession), só
// trocando o parâmetro pra { review: true }. Sem [topic] na rota: a fila cruza todos os tópicos
// já praticados, não é de um tema só.
export default function ReviewSessionScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const infinite = useInfiniteModeSession({ review: true });
  const { showToast } = useToast();

  useEffect(() => {
    if (infinite.levelUpTo === null) return;
    showToast(`Nível ${infinite.levelUpTo} desbloqueado! Perguntas novas liberadas.`, "success");
    infinite.dismissLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite.levelUpTo]);

  if (infinite.notAvailable) {
    return (
      <SafeAreaView style={styles.centerScreen} edges={["top"]}>
        <Icon name="taskAlt" size={48} color={colors.outline} />
        <Text style={[type.headlineMd, styles.notAvailableTitle]}>Nada pra revisar agora</Text>
        <Text style={[type.bodyMd, styles.notAvailableCaption]}>
          Você está em dia com tudo que já praticou. Volte mais tarde ou pratique um tema novo.
        </Text>
        <Button variant="primary" onPress={() => router.push("/explorar")}>
          Voltar para Explorar
        </Button>
      </SafeAreaView>
    );
  }

  if (infinite.sessionError) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ErrorBanner
          message="Não foi possível carregar a revisão. Verifique sua conexão e tente novamente."
          onRetry={infinite.retrySession}
        />
      </SafeAreaView>
    );
  }

  if (infinite.loading || !infinite.question) {
    return <LoadingBlueprint variant="fullscreen" size={160} label="Carregando revisão…" />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <InfiniteModeHeader
        variant="review"
        topicLabel=""
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
        verifyError={infinite.verifyError}
        onGiveUp={infinite.giveUp}
        onConfirm={infinite.verify}
        onContinue={infinite.continueNext}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
  });
