import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { SummaryPanel } from "@/components/features/lessonSummary/SummaryPanel";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { listTrackLessons } from "@/lib/api/resources/lessons";

// Espelha apps/web/src/app/(lesson)/trilhas/[trackId]/[lessonId]/resumo/page.tsx.
export default function LessonSummaryScreen() {
  const { trackId, lessonId, xp, accuracy, streak, hearts, chest } = useLocalSearchParams<{
    trackId: string;
    lessonId: string;
    xp: string;
    accuracy: string;
    streak: string;
    hearts: string;
    chest: string;
  }>();

  const xpValue = Number(xp ?? 0);
  const accuracyValue = Number(accuracy ?? 0);
  const streakValue = Number(streak ?? 0);
  const heartsValue = Number(hearts ?? 0);
  const chestAvailable = chest === "true";

  // Antes: número literal (75) fixo — mesma correção do web, mesmo motivo (pendência #3): a API
  // não expõe unidade por lição, só a ordem achatada da trilha inteira.
  const [moduleProgressPercent, setModuleProgressPercent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTrackLessons(trackId)
      .then(({ data }) => {
        if (cancelled || data.length === 0) return;
        const completed = data.filter(
          (item) => item.progress_status === "completed" || item.lesson.id === lessonId,
        ).length;
        setModuleProgressPercent(Math.round((completed / data.length) * 100));
      })
      .catch(() => {
        // Falha de rede não deve derrubar o resumo inteiro — a barra só fica em 0%.
      });
    return () => {
      cancelled = true;
    };
  }, [trackId, lessonId]);

  // Marco simples e honesto de disparar no mock: lição concluída sem nenhum erro. Um backend
  // real decidiria isso no Gamification Service e devolveria em /v1/gamification/me.achievements.
  const achievementUnlocked = accuracyValue === 100;
  const nextHref = achievementUnlocked
    ? `/trilhas/${trackId}/${lessonId}/conquista?type=licao_perfeita`
    : "/";

  return (
    <SummaryPanel
      xpEarned={xpValue}
      accuracy={accuracyValue}
      streak={streakValue}
      hearts={heartsValue}
      moduleProgressPercent={moduleProgressPercent}
      gemsEarned={achievementUnlocked ? achievementCatalog.licao_perfeita.gems_reward : 0}
      nextHref={nextHref}
      chestAvailable={chestAvailable}
    />
  );
}
