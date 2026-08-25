"use client";

import { useParams, useSearchParams } from "next/navigation";
import { InfiniteModeSummaryPanel } from "@/components/features/infiniteMode/InfiniteModeSummaryPanel";
import { getThemeByTopic } from "@/lib/api/mocks/fixtures/themes";

export default function InfiniteModeSummaryPage() {
  const searchParams = useSearchParams();
  // O resumo dizia só "Modo Infinito", sem nunca nomear o tema que a pessoa acabou de praticar —
  // o [topic] está na própria rota e a referência do Stitch (resumo_modo_infinito/screen.png) traz
  // "Modo Infinito - <tema>" como subtítulo. Sem isso, dois resumos de temas diferentes são
  // indistinguíveis, inclusive no histórico/print.
  const { topic } = useParams<{ topic: string }>();

  const questions = Number(searchParams.get("questions") ?? 0);
  const correct = Number(searchParams.get("correct") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const xp = Number(searchParams.get("xp") ?? 0);
  const avgTime = Number(searchParams.get("avgTime") ?? 0);
  const chestAvailable = searchParams.get("chest") === "true";

  return (
    <InfiniteModeSummaryPanel
      questionsAnswered={questions}
      correctCount={correct}
      accuracy={accuracy}
      xpEarned={xp}
      avgTimeMs={avgTime}
      chestAvailable={chestAvailable}
      subtitle={`Modo Infinito · ${getThemeByTopic(topic).label}`}
    />
  );
}
