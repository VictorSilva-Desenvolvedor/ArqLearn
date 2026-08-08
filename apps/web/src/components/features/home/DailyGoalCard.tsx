import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

interface DailyGoalCardProps {
  xpToday: number;
  goal: number;
}

export function DailyGoalCard({ xpToday, goal }: DailyGoalCardProps) {
  return (
    <Card
      radius="xl"
      className="mb-section flex flex-col md:flex-row items-center justify-between gap-md relative overflow-hidden"
    >
      <div className="flex-1 w-full">
        <h2 className="font-display text-question-sm text-on-surface mb-xs">Meta Diária</h2>
        <div className="flex items-center gap-sm w-full">
          <ProgressBar value={xpToday} max={goal} variant="tube" tone="secondary" className="flex-1" />
          <span className="font-label text-body-sm text-on-surface-variant whitespace-nowrap">
            {xpToday} / {goal} XP
          </span>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <Button variant="primary" size="md" fullWidth className="md:w-auto">
          Revisar Erros
        </Button>
      </div>
    </Card>
  );
}
