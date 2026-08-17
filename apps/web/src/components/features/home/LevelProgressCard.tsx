import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { xpMinimoDoNivel } from "@/lib/gamification/level";

interface LevelProgressCardProps {
  level: number;
  xpTotal: number;
}

// DESIGN.md ("XP Bar"): barra horizontal laranja + "level badge beside the bar" — não existia em
// lugar nenhum do app (só a Meta Diária, que é xp_today/goal, uma métrica diferente).
//
// xpMinimoDoNivel é a curva REAL (services/monolith/internal/gamification/algorithms.go Nivel) —
// antes usava lib/api/mocks/fixtures/levelCurve.ts, uma curva de mock diferente que fazia essa
// barra ficar sempre cheia com dado real.
export function LevelProgressCard({ level, xpTotal }: LevelProgressCardProps) {
  const currentLevelXp = xpMinimoDoNivel(level);
  const nextLevelXp = xpMinimoDoNivel(level + 1);
  const xpIntoLevel = Math.max(0, xpTotal - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <Card radius="xl" className="mb-section flex items-center gap-md">
      <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label text-stats-num font-bold shrink-0">
        {level}
      </div>
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between gap-xs flex-wrap mb-1">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Nível {level}</span>
          <span className="font-label text-body-sm text-on-surface-variant">
            {xpIntoLevel} / {xpNeededForLevel} XP
          </span>
        </div>
        <ProgressBar value={xpIntoLevel} max={xpNeededForLevel} variant="tube" tone="secondary" />
      </div>
    </Card>
  );
}
