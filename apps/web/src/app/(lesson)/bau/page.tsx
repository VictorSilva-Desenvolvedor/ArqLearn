"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { useAuth } from "@/hooks/useAuth";
import {
  getDailyChestStatus,
  getWeeklyChestStatus,
  openDailyChest,
  openWeeklyChest,
} from "@/lib/api/resources/gamification";
import { resetDailyChestVip, resetWeeklyChestVip } from "@/lib/api/resources/vip";
import { ApiError } from "@/lib/api/http";
import type { ChestOpenResult, ChestRewardType } from "@/types/api";

const HEARTS_MAX = 5;

const REWARD_ICON: Record<ChestRewardType, string> = {
  gems: "diamond",
  streak_freeze: "ac_unit",
  hearts_refill: "favorite",
  xp_boost: "bolt",
};

const REWARD_LABEL: Record<ChestRewardType, string> = {
  gems: "Gemas",
  streak_freeze: "Bloqueio de Ofensiva",
  hearts_refill: "Vidas Restauradas",
  xp_boost: "XP em Dobro",
};

type ChestType = "diario" | "semanal";

const CHEST_COPY: Record<ChestType, { eyebrow: string; titulo: string; unavailable: string }> = {
  diario: {
    eyebrow: "Baú Diário",
    titulo: "Você ganhou um Baú de Projeto!",
    unavailable: "Acerte mais perguntas hoje pra liberar seu próximo Baú Diário.",
  },
  semanal: {
    eyebrow: "Baú Semanal",
    titulo: "Você ganhou um Baú Semanal!",
    unavailable: "Acerte mais perguntas nos próximos dias pra liberar seu próximo Baú Semanal — o ciclo só reinicia quando 7 dias se passarem.",
  },
};

// Tela de transição do Baú Diário/Semanal (a pedido do usuário, v1.18/v1.19) — fechado -> "Abrir
// Baú" (chama a API de verdade) -> "Recompensas Coletadas!" com a recompensa real determinada
// pelo servidor. `?tipo=diario|semanal` (default diario) decide qual dos dois baús esta instância
// da tela representa — mesmo shell visual, endpoints e textos diferentes. Espelha
// apps/mobile/src/app/bau.tsx. Mesmo padrão de rota "tarefa em tela cheia" da conquista
// (app/(lesson)/trilhas/[trackId]/[lessonId]/conquista/page.tsx), mas credita via chamada de API
// real em vez de crédito local — não há como simular a recompensa (é sorteada no servidor).
export default function DailyChestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo: ChestType = searchParams.get("tipo") === "semanal" ? "semanal" : "diario";
  const copy = CHEST_COPY[tipo];
  const { gamification, updateGamification, adjustStreakFreezes } = useAuth();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<ChestOpenResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    const statusPromise = tipo === "semanal" ? getWeeklyChestStatus() : getDailyChestStatus();
    statusPromise.then((status) => {
      if (cancelled) return;
      setAvailable(status.available);
      setClaimed(tipo === "semanal" ? "claimed_this_cycle" in status && status.claimed_this_cycle : "claimed_today" in status && status.claimed_today);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  // Benefício VIP: resetar o baú já reivindicado libera uma nova abertura na hora (a pedido do
  // usuário, ver services/monolith/internal/gamification/vip.go handleResetDailyChest/
  // handleResetWeeklyChest) — mesmo padrão de apps/mobile/src/app/bau.tsx.
  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    setError(null);
    try {
      await (tipo === "semanal" ? resetWeeklyChestVip() : resetDailyChestVip());
      setAvailable(true);
      setClaimed(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resetar o baú agora.");
    } finally {
      setResetting(false);
    }
  };

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const result = await (tipo === "semanal" ? openWeeklyChest() : openDailyChest());
      setReward(result);
      updateGamification({
        gems: result.gems,
        ...(result.reward_type === "hearts_refill" ? { hearts_current: HEARTS_MAX } : {}),
        ...(result.reward_type === "xp_boost"
          ? { xp_boost_active: true, xp_boost_active_until: result.xp_boost_active_until ?? null }
          : {}),
      });
      if (result.reward_type === "streak_freeze") {
        adjustStreakFreezes(1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível abrir o baú agora.");
    } finally {
      setOpening(false);
    }
  };

  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center px-md py-lg">
        <LoadingBlueprint variant="inline" size={96} />
      </div>
    );
  }

  if (!available && !reward) {
    return (
      <div className="flex-1 flex items-center justify-center px-md py-lg">
        <div className="w-full max-w-[28rem] flex flex-col items-center text-center gap-lg">
          <div className="w-28 h-28 rounded-xl bg-surface-container flex items-center justify-center">
            <Icon name="lock" className="text-6xl text-on-surface-variant" />
          </div>
          <div>
            <p className="font-label text-label-caps uppercase text-secondary mb-1">{copy.eyebrow}</p>
            <h1 className="font-display text-headline-md font-bold text-on-surface">
              Nenhum Baú disponível
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">{copy.unavailable}</p>
          </div>
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          {claimed && gamification.is_vip && (
            <Button variant="gamification" fullWidth onClick={handleReset} disabled={resetting} icon={<Icon name="replay" />}>
              {resetting ? "Resetando…" : "Resetar Baú (VIP)"}
            </Button>
          )}
          <Button variant="primary" fullWidth onClick={() => router.push("/")}>
            Voltar ao Mapa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-md py-lg">
      <div className="w-full max-w-[28rem] flex flex-col items-center text-center gap-lg">
        {reward ? (
          <>
            <div className="w-28 h-28 rounded-xl bg-secondary text-on-secondary flex items-center justify-center rotate-45 shadow-gamified">
              <Icon name={REWARD_ICON[reward.reward_type]} filled className="text-6xl -rotate-45" />
            </div>
            <div>
              <p className="font-label text-label-caps uppercase text-secondary mb-1">{copy.eyebrow}</p>
              <h1 className="font-display text-headline-md font-bold text-on-surface">
                Recompensas Coletadas!
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                {reward.reward_type === "gems"
                  ? `Você ganhou +${reward.gems_earned} gemas!`
                  : `Você ganhou: ${REWARD_LABEL[reward.reward_type]}`}
              </p>
            </div>
            <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
              <Icon name={REWARD_ICON[reward.reward_type]} filled />
              {reward.reward_type === "gems" ? `+${reward.gems_earned} gemas` : REWARD_LABEL[reward.reward_type]}
            </span>
            <Button variant="primary" fullWidth onClick={() => router.push("/")}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <div className="w-28 h-28 rounded-xl bg-secondary-container border-2 border-dashed border-secondary flex items-center justify-center">
              <Icon name="redeem" className="text-6xl text-secondary" />
            </div>
            <div>
              <p className="font-label text-label-caps uppercase text-secondary mb-1">{copy.eyebrow}</p>
              <h1 className="font-display text-headline-md font-bold text-on-surface">{copy.titulo}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Abra pra revelar sua recompensa.
              </p>
            </div>
            {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
            <Button
              variant="primary"
              fullWidth
              onClick={handleOpen}
              disabled={opening}
              icon={<Icon name="lock_open" />}
            >
              {opening ? "Abrindo…" : "Abrir Baú"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
