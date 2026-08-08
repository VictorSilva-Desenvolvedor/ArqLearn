import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { RecommendedTrack } from "@/lib/api/mocks/fixtures/exploreTracks";

export function TrackCard({ track, difficulty, durationMinutes, icon }: RecommendedTrack) {
  return (
    <Card padding="md" radius="lg" interactive className="flex flex-col gap-sm">
      <Icon name={icon} filled className="text-3xl text-primary" />
      <p className="font-display text-question-sm text-on-surface font-bold">{track.title}</p>
      <div className="flex items-center gap-sm">
        <Badge tone="primary">{difficulty}</Badge>
        <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="schedule" className="text-base" />
          {durationMinutes}min
        </span>
      </div>
    </Card>
  );
}
