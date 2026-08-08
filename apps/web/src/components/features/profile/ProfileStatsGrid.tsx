import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";

interface ProfileStatsGridProps {
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

export function ProfileStatsGrid({ streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-sm">
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
