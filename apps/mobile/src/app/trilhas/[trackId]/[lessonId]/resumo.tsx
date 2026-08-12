import { useLocalSearchParams } from "expo-router";
import { SummaryPanel } from "@/components/features/lessonSummary/SummaryPanel";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";

// Espelha apps/web/src/app/(lesson)/trilhas/[trackId]/[lessonId]/resumo/page.tsx.
export default function LessonSummaryScreen() {
  const { trackId, lessonId, xp, accuracy, streak, hearts } = useLocalSearchParams<{
    trackId: string;
    lessonId: string;
    xp: string;
    accuracy: string;
    streak: string;
    hearts: string;
  }>();

  const xpValue = Number(xp ?? 0);
  const accuracyValue = Number(accuracy ?? 0);
  const streakValue = Number(streak ?? 0);
  const heartsValue = Number(hearts ?? 0);

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
      moduleProgressPercent={75}
      gemsEarned={achievementUnlocked ? achievementCatalog.licao_perfeita.gems_reward : 0}
      nextHref={nextHref}
    />
  );
}
