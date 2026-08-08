import { Icon } from "@/components/ui/Icon";
import type { UploadSummaryKeyPoint } from "@/types/api";

export function KeyPointsChecklist({ points }: { points: UploadSummaryKeyPoint[] }) {
  return (
    <div className="flex flex-col gap-md">
      <h2 className="font-display text-headline-md text-on-surface">O que você precisa saber</h2>
      {points.map((point) => (
        <div key={point.title} className="flex gap-sm">
          <Icon name="check_circle" filled className="text-tertiary text-2xl shrink-0" />
          <div>
            <p className="font-body-lg text-body-lg font-bold text-on-surface">{point.title}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{point.explanation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
