"use client";

import { useParams, useRouter } from "next/navigation";
import { QuizHeader } from "@/components/features/quiz/QuizHeader";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { QuizActionBar } from "@/components/features/quiz/QuizActionBar";
import { useQuizSession } from "@/components/features/quiz/useQuizSession";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";

export default function LessonSessionPage() {
  const router = useRouter();
  const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();
  const quiz = useQuizSession(trackId, lessonId);
  // Vidas zeraram após responder — a lição para aqui, igual ao clique num nó sem vidas na Home.
  const noHeartsOpen = quiz.revealed && quiz.noHearts;

  if (quiz.loading || !quiz.currentQuestion) {
    return <LoadingBlueprint variant="fullscreen" size={160} label="Carregando lição…" />;
  }

  return (
    <>
      <QuizHeader
        currentIndex={quiz.currentIndex}
        total={quiz.totalQuestions}
        hearts={quiz.hearts}
        gems={quiz.gems}
        lessonId={lessonId}
      />
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
    </>
  );
}
