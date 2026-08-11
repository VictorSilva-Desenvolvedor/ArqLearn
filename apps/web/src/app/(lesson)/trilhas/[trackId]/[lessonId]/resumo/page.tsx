"use client";

import { useParams, useSearchParams } from "next/navigation";
import { SummaryPanel } from "@/components/features/lessonSummary/SummaryPanel";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";

export default function LessonSummaryPage() {
  const searchParams = useSearchParams();
  const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();

  const xp = Number(searchParams.get("xp") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const streak = Number(searchParams.get("streak") ?? 0);
  const hearts = Number(searchParams.get("hearts") ?? 0);

  // Marco simples e honesto de disparar no mock: lição concluída sem nenhum erro. Um backend
  // real decidiria isso no Gamification Service e devolveria em /v1/gamification/me.achievements.
  const achievementUnlocked = accuracy === 100;
  const nextHref = achievementUnlocked
    ? `/trilhas/${trackId}/${lessonId}/conquista?type=licao_perfeita`
    : "/";

  return (
    <SummaryPanel
      xpEarned={xp}
      accuracy={accuracy}
      streak={streak}
      hearts={hearts}
      moduleProgressPercent={75}
      gemsEarned={achievementUnlocked ? achievementCatalog.licao_perfeita.gems_reward : 0}
      nextHref={nextHref}
    />
  );
}
