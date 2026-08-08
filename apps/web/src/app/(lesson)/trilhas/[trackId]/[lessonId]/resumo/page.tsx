"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SummaryPanel } from "@/components/features/lessonSummary/SummaryPanel";
import { AchievementDialog } from "@/components/features/gamification/AchievementDialog";

export default function LessonSummaryPage() {
  const searchParams = useSearchParams();

  const xp = Number(searchParams.get("xp") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const streak = Number(searchParams.get("streak") ?? 0);
  const hearts = Number(searchParams.get("hearts") ?? 0);

  // Marco simples e honesto de disparar no mock: lição concluída sem nenhum erro. Um backend
  // real decidiria isso no Gamification Service e devolveria em /v1/gamification/me.achievements.
  const [achievementOpen, setAchievementOpen] = useState(accuracy === 100);

  return (
    <>
      <SummaryPanel xpEarned={xp} accuracy={accuracy} streak={streak} hearts={hearts} moduleProgressPercent={75} />
      <AchievementDialog open={achievementOpen} onOpenChange={setAchievementOpen} type="licao_perfeita" />
    </>
  );
}
