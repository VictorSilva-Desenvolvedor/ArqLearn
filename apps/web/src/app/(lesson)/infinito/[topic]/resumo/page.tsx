"use client";

import { useSearchParams } from "next/navigation";
import { InfiniteModeSummaryPanel } from "@/components/features/infiniteMode/InfiniteModeSummaryPanel";

export default function InfiniteModeSummaryPage() {
  const searchParams = useSearchParams();

  const questions = Number(searchParams.get("questions") ?? 0);
  const correct = Number(searchParams.get("correct") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const xp = Number(searchParams.get("xp") ?? 0);
  const avgTime = Number(searchParams.get("avgTime") ?? 0);

  return (
    <InfiniteModeSummaryPanel
      questionsAnswered={questions}
      correctCount={correct}
      accuracy={accuracy}
      xpEarned={xp}
      avgTimeMs={avgTime}
    />
  );
}
