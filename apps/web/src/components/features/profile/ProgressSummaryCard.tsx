import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import type { ProgressSummary } from "@/types/api";

export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  return (
    <div>
      <h2 className="font-display text-headline-md text-on-surface mb-sm">Progresso Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        <StatCard
          icon={<Icon name="school" filled className="text-primary text-2xl" />}
          label="Trilhas Concluídas"
          value={`${summary.tracks_completed}`}
        />
        <StatCard
          icon={<Icon name="menu_book" filled className="text-secondary text-2xl" />}
          label="Em Andamento"
          value={`${summary.tracks_in_progress}`}
        />
        <StatCard
          icon={<Icon name="event_available" filled className="text-tertiary text-2xl" />}
          label="Lições (7 dias)"
          value={`${summary.lessons_completed_last_7d}`}
        />
        <StatCard
          icon={<Icon name="target" filled className="text-primary text-2xl" />}
          label="Precisão"
          value={`${summary.accuracy_rate}%`}
        />
      </div>
    </div>
  );
}
