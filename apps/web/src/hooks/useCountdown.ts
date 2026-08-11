"use client";

import { useEffect, useState } from "react";
import { formatMinutesSeconds } from "@/lib/utils/format";

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return { secondsLeft, formatted: formatMinutesSeconds(secondsLeft) };
}

// Conta regressiva até um instante fixo (ISO 8601), não uma duração — usada pra
// GamificationProfile.hearts_next_at (API Spec §3.2). Só `now` é estado (atualizado pelo
// intervalo, uma assinatura legítima de relógio externo); secondsLeft é derivado dele a cada
// render, não guardado em estado próprio — evita setState síncrono direto no corpo do efeito.
// targetIso null (vidas já no teto) devolve secondsLeft 0 sem nenhum timer rodando.
export function useCountdownToTimestamp(targetIso: string | null) {
  const targetMs = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetMs]);

  const secondsLeft = targetMs === null ? 0 : Math.max(0, Math.ceil((targetMs - now) / 1000));
  return { secondsLeft, formatted: formatMinutesSeconds(secondsLeft), reachedZero: targetMs !== null && secondsLeft <= 0 };
}
