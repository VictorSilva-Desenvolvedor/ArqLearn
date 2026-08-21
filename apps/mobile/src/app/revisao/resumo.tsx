import { useLocalSearchParams } from "expo-router";
import { InfiniteModeSummaryPanel } from "@/components/features/infiniteMode/InfiniteModeSummaryPanel";

// Espelha apps/web/src/app/(lesson)/revisao/resumo/page.tsx / infinito/[topic]/resumo.tsx — sem
// [topic] na rota, a fila de revisão do SRS (TDD §10.3) não é de um tema só.
export default function ReviewSummaryScreen() {
  const { questions, correct, accuracy, xp, avgTime, chest } = useLocalSearchParams<{
    questions: string;
    correct: string;
    accuracy: string;
    xp: string;
    avgTime: string;
    chest: string;
  }>();

  return (
    <InfiniteModeSummaryPanel
      subtitle="Revisão"
      questionsAnswered={Number(questions ?? 0)}
      correctCount={Number(correct ?? 0)}
      accuracy={Number(accuracy ?? 0)}
      xpEarned={Number(xp ?? 0)}
      avgTimeMs={Number(avgTime ?? 0)}
      chestAvailable={chest === "true"}
    />
  );
}
