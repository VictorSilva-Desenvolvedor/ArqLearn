import { useLocalSearchParams } from "expo-router";
import { InfiniteModeSummaryPanel } from "@/components/features/infiniteMode/InfiniteModeSummaryPanel";

// Espelha apps/web/src/app/(lesson)/infinito/[topic]/resumo/page.tsx.
export default function InfiniteModeSummaryScreen() {
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
      questionsAnswered={Number(questions ?? 0)}
      correctCount={Number(correct ?? 0)}
      accuracy={Number(accuracy ?? 0)}
      xpEarned={Number(xp ?? 0)}
      avgTimeMs={Number(avgTime ?? 0)}
      chestAvailable={chest === "true"}
    />
  );
}
