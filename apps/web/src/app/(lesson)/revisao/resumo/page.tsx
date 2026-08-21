"use client";

import { useSearchParams } from "next/navigation";
import { InfiniteModeSummaryPanel } from "@/components/features/infiniteMode/InfiniteModeSummaryPanel";

// Espelha apps/web/src/app/(lesson)/infinito/[topic]/resumo/page.tsx — sem [topic] na rota, a
// fila de revisão do SRS (TDD §10.3) não é de um tema só.
export default function ReviewSummaryPage() {
  const searchParams = useSearchParams();

  const questions = Number(searchParams.get("questions") ?? 0);
  const correct = Number(searchParams.get("correct") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const xp = Number(searchParams.get("xp") ?? 0);
  const avgTime = Number(searchParams.get("avgTime") ?? 0);
  const chestAvailable = searchParams.get("chest") === "true";

  return (
    <InfiniteModeSummaryPanel
      subtitle="Revisão"
      questionsAnswered={questions}
      correctCount={correct}
      accuracy={accuracy}
      xpEarned={xp}
      avgTimeMs={avgTime}
      chestAvailable={chestAvailable}
    />
  );
}
