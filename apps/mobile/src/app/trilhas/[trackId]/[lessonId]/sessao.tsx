import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { QuizActionBar } from "@/components/features/quiz/QuizActionBar";
import { QuizHeader } from "@/components/features/quiz/QuizHeader";
import { useQuizSession } from "@/components/features/quiz/useQuizSession";
import { colors, type } from "@/theme/tokens";

// Espelha apps/web/src/app/(lesson)/trilhas/[trackId]/[lessonId]/sessao/page.tsx.
export default function LessonSessionScreen() {
  const router = useRouter();
  const { trackId, lessonId } = useLocalSearchParams<{ trackId: string; lessonId: string }>();
  const quiz = useQuizSession(trackId, lessonId);
  // Vidas zeraram após responder — a lição para aqui, igual ao clique num nó sem vidas na Home.
  const noHeartsOpen = quiz.revealed && quiz.noHearts;

  if (quiz.loading || !quiz.currentQuestion) {
    return (
      <View style={styles.loading}>
        <Text style={[type.bodyLg, styles.loadingText]}>Carregando lição…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <QuizHeader
        currentIndex={quiz.currentIndex}
        total={quiz.totalQuestions}
        hearts={quiz.hearts}
        gems={quiz.gems}
        lessonId={lessonId}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <QuestionCard
          prompt={quiz.currentQuestion.prompt}
          type={quiz.currentQuestion.type}
          difficulty={quiz.currentQuestion.difficulty}
          imageUrl={quiz.currentQuestion.image_url}
          options={quiz.currentQuestion.options}
          selectedOptionId={quiz.selectedOptionId}
          revealed={quiz.revealed}
          verifying={quiz.verifying}
          isSelectedCorrect={quiz.lastResult?.correct ?? false}
          onSelect={quiz.selectOption}
        />
      </ScrollView>
      {!noHeartsOpen && (
        <QuizActionBar
          revealed={quiz.revealed}
          isCorrect={quiz.lastResult?.correct ?? false}
          explanation={quiz.lastResult?.explicacao ?? ""}
          xpDailyCapReached={quiz.lastResult?.xp_daily_cap_reached ?? false}
          canVerify={Boolean(quiz.selectedOptionId?.trim())}
          verifying={quiz.verifying}
          onSkip={quiz.skip}
          onVerify={quiz.verify}
          onContinue={quiz.continueNext}
          deepExplanation={quiz.deepExplanation}
          explainLoading={quiz.explainLoading}
          explainError={quiz.explainError}
          onExplainMore={quiz.explainMore}
        />
      )}
      <NoHeartsDialog open={noHeartsOpen} onOpenChange={() => router.push("/")} />
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
  },
});
