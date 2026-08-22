"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getActiveGemBet, startGemBet } from "@/lib/api/resources/gems";
import type { GemBet } from "@/types/api";

// Double or Nothing (TDD §15.3) — aposta gemas, compromete-se a manter o streak por 7 dias
// corridos, dobra ou perde. Resolvida automaticamente pelo backend nos mesmos pontos que já
// leem/expiram o streak; esta tela só inicia a aposta e mostra o progresso. Espelha
// apps/mobile/src/app/loja/aposta.tsx.
const MIN_STAKE = 50;

export default function GemBetPage() {
  const { gamification } = useAuth();
  const { showToast } = useToast();
  const [bet, setBet] = useState<GemBet | null | undefined>(undefined);
  const [stake, setStake] = useState(String(MIN_STAKE));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveGemBet().then((b) => {
      if (!cancelled) setBet(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async () => {
    const stakeGems = parseInt(stake, 10);
    if (starting || !Number.isFinite(stakeGems)) return;
    setError(null);
    setStarting(true);
    try {
      const result = await startGemBet(stakeGems);
      setBet(result);
      showToast("Aposta iniciada! Mantenha o streak por 7 dias.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a aposta agora.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex flex-col items-center text-center gap-sm">
        <div className="w-16 h-16 rounded-xl bg-tertiary-container text-on-tertiary-container border-2 border-tertiary flex items-center justify-center">
          <Icon name="casino" filled className="text-4xl" />
        </div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">Double or Nothing</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Aposte gemas e comprometa-se a manter sua sequência por 7 dias. Bateu a meta, dobra. Perdeu a
          sequência, perde a aposta.
        </p>
      </div>

      {bet === undefined && <p className="font-body-sm text-body-sm text-on-surface-variant text-center">Carregando…</p>}

      {bet && (
        <Card padding="lg" className="flex flex-col items-center text-center gap-sm border-tertiary">
          <Icon name="local_fire_department" filled className="text-3xl text-tertiary" />
          <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">
            {bet.days_completed} / {bet.days_required} dias
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {bet.stake_gems} gemas em jogo — complete a sequência pra ganhar {bet.stake_gems * 2} gemas.
          </p>
          <div className="w-full h-2 rounded-full bg-surface-variant overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full"
              style={{ width: `${Math.min(100, (bet.days_completed / bet.days_required) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      {bet === null && (
        <Card padding="lg" className="flex flex-col gap-sm">
          <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">Iniciar aposta</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Mínimo de {MIN_STAKE} gemas. Você tem {gamification.gems} gemas.
          </p>
          <input
            type="number"
            min={MIN_STAKE}
            step={10}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="border-2 border-outline-variant bg-surface rounded-md px-md py-sm text-body-lg text-on-surface"
          />
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <Button
            variant="primary"
            fullWidth
            disabled={starting || parseInt(stake, 10) < MIN_STAKE || parseInt(stake, 10) > gamification.gems}
            onClick={handleStart}
            icon={<Icon name="casino" />}
          >
            {starting ? "Iniciando…" : "Apostar"}
          </Button>
        </Card>
      )}
    </div>
  );
}
