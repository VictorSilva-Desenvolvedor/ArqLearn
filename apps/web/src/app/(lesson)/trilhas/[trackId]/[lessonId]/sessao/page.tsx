"use client";

import { useParams, useRouter } from "next/navigation";
import { QuizHeader } from "@/components/features/quiz/QuizHeader";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { QuizActionBar } from "@/components/features/quiz/QuizActionBar";
import { useQuizSession } from "@/components/features/quiz/useQuizSession";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";

export default function LessonSessionPage() {
  const router = useRouter();
  const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();
  const quiz = useQuizSession(trackId, lessonId);
  // Vidas zeraram após responder — a lição para aqui, igual ao clique num nó sem vidas na Home.
  const noHeartsOpen = quiz.revealed && quiz.noHearts;

  if (quiz.loading || !quiz.currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Carregando lição…</p>
      </div>
    );
  }

  return (
    <>
      <QuizHeader
        currentIndex={quiz.currentIndex}
        total={quiz.totalQuestions}
        hearts={quiz.hearts}
        gems={quiz.gems}
      />
      <QuestionCard
        prompt={quiz.currentQuestion.prompt}
        options={quiz.currentQuestion.options}
        selectedOptionId={quiz.selectedOptionId}
        revealed={quiz.revealed}
        isSelectedCorrect={quiz.lastResult?.correct ?? false}
        onSelect={quiz.selectOption}
      />
      {!noHeartsOpen && (
        <QuizActionBar
          revealed={quiz.revealed}
          isCorrect={quiz.lastResult?.correct ?? false}
          explanation={quiz.lastResult?.explicacao ?? ""}
          canVerify={quiz.selectedOptionId !== null}
          onSkip={quiz.skip}
          onVerify={quiz.verify}
          onContinue={quiz.continueNext}
        />
      )}
      <NoHeartsDialog open={noHeartsOpen} onOpenChange={() => router.push("/")} />
    </>
  );
}
