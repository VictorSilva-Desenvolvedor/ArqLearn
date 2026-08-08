"use client";

import { useParams } from "next/navigation";
import { InfiniteModeHeader } from "@/components/features/infiniteMode/InfiniteModeHeader";
import { InfiniteModeActionBar } from "@/components/features/infiniteMode/InfiniteModeActionBar";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { useInfiniteModeSession } from "@/components/features/infiniteMode/useInfiniteModeSession";

const topicLabels: Record<string, string> = {
  estruturas: "Sistemas Estruturais",
};

export default function InfiniteModeSessionPage() {
  const { topic } = useParams<{ topic: string }>();
  const infinite = useInfiniteModeSession(topic);

  if (infinite.loading || !infinite.question) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Carregando desafio…</p>
      </div>
    );
  }

  return (
    <>
      <InfiniteModeHeader
        topicLabel={topicLabels[topic] ?? topic}
        current={infinite.questionsAnswered}
        total={infinite.progressHintTotal}
      />
      <QuestionCard
        prompt={infinite.question.prompt}
        options={infinite.question.options}
        selectedOptionId={infinite.selectedOptionId}
        revealed={infinite.revealed}
        isSelectedCorrect={infinite.lastResult?.correct ?? false}
        onSelect={infinite.selectOption}
      />
      <InfiniteModeActionBar
        revealed={infinite.revealed}
        canConfirm={infinite.selectedOptionId !== null}
        onGiveUp={infinite.giveUp}
        onConfirm={infinite.verify}
        onContinue={infinite.continueNext}
      />
    </>
  );
}
