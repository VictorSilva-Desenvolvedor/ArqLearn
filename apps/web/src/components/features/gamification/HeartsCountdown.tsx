"use client";

import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdown } from "@/hooks/useCountdown";

const NEXT_HEART_SECONDS = 15 * 60;

export function HeartsCountdown() {
  const { secondsLeft, formatted } = useCountdown(NEXT_HEART_SECONDS);

  return (
    <div className="flex flex-col items-center gap-xs w-full">
      <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
        <Icon name="schedule" className="text-base" />
        Próxima vida em {formatted}
      </span>
      <ProgressBar value={NEXT_HEART_SECONDS - secondsLeft} max={NEXT_HEART_SECONDS} variant="tube" tone="secondary" />
    </div>
  );
}
