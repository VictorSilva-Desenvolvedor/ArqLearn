"use client";

import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdownToTimestamp } from "@/hooks/useCountdown";
import { useAuth } from "@/hooks/useAuth";

// Mesmo intervalo do backend (TDD §5.4) — só usado aqui pra desenhar a barra de progresso (o
// "quanto falta" vem de verdade de hearts_next_at, isto é só a escala visual da barra). Era 3h
// até 18/08/2026, a pedido do usuário (36min por vida = 3h pra encher do zero, não mais 15h).
const HEARTS_REGEN_INTERVAL_SECONDS = 36 * 60;

export function HeartsCountdown() {
  const { gamification } = useAuth();
  const { secondsLeft, formatted, reachedZero } = useCountdownToTimestamp(gamification.hearts_next_at);

  if (!gamification.hearts_next_at) {
    return (
      <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
        <Icon name="favorite" filled className="text-base text-error-red" />
        Suas vidas estão cheias!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-xs w-full">
      <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
        <Icon name="schedule" className="text-base" />
        {reachedZero ? "Regenerando…" : `Próxima vida em ${formatted}`}
      </span>
      <ProgressBar
        value={HEARTS_REGEN_INTERVAL_SECONDS - Math.min(secondsLeft, HEARTS_REGEN_INTERVAL_SECONDS)}
        max={HEARTS_REGEN_INTERVAL_SECONDS}
        variant="tube"
        tone="secondary"
      />
    </div>
  );
}
