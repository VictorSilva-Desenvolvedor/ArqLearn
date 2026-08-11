"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { freezeStreak } from "@/lib/api/resources/gamification";
import { ApiError } from "@/lib/api/http";

export function StreakFreezeCard() {
  const { streakFreezesAvailable, adjustStreakFreezes } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUse = async () => {
    setPending(true);
    setMessage(null);
    try {
      await freezeStreak(streakFreezesAvailable);
      adjustStreakFreezes(-1);
      setMessage("Ofensiva protegida! Se você faltar hoje, sua sequência continua intacta.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Não foi possível usar o bloqueio agora.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card padding="md" radius="lg" className="flex items-center gap-sm">
      <Icon name="ac_unit" filled className="text-3xl text-primary" />
      <div className="flex-1">
        <p className="font-body-lg text-body-lg font-bold text-on-surface">Bloqueio de Ofensiva</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {streakFreezesAvailable > 0
            ? `${streakFreezesAvailable} disponível${streakFreezesAvailable > 1 ? "is" : ""} — protege sua sequência caso falte um dia.`
            : "Sem bloqueios disponíveis — compre um na Loja."}
        </p>
        {message && <p className="font-body-sm text-body-sm text-tertiary mt-1">{message}</p>}
      </div>
      <Button variant="ghost" disabled={streakFreezesAvailable === 0 || pending} onClick={handleUse}>
        {pending ? "Usando…" : "Usar agora"}
      </Button>
    </Card>
  );
}
