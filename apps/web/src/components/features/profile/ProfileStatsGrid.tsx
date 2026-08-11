import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";

interface ProfileStatsGridProps {
  xpTotal: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// UX spec (Profile): "Show: Level. Total XP. Current streak. Best streak. Gems..." — XP Total
// nunca aparecia aqui (só o "520 XP" discreto do TopAppBar compartilhado, que não é específico
// desta tela e não cobre o requisito do spec pra Perfil).
export function ProfileStatsGrid({ xpTotal, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-sm">
      <StatCard
        icon={<Icon name="bolt" filled className="text-secondary text-2xl" />}
        label="XP Total"
        value={`${xpTotal}`}
      />
      <StatCard
        icon={<Icon name="local_fire_department" filled className="text-secondary text-2xl" />}
        label="Sequência"
        value={`${streakCurrent} dias`}
      />
      <StatCard
        icon={<Icon name="military_tech" filled className="text-primary text-2xl" />}
        label="Máximo"
        value={`${streakBest} dias`}
      />
      <StatCard
        icon={<Icon name="diamond" filled className="text-primary text-2xl" />}
        label="Gemas"
        value={`${gems}`}
      />
    </div>
  );
}
