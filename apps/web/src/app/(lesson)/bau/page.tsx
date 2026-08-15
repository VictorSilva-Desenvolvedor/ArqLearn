"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { useAuth } from "@/hooks/useAuth";
import { getDailyChestStatus, openDailyChest } from "@/lib/api/resources/gamification";
import { ApiError } from "@/lib/api/http";
import type { ChestOpenResult, ChestRewardType } from "@/types/api";

const HEARTS_MAX = 5;

const REWARD_ICON: Record<ChestRewardType, string> = {
  gems: "diamond",
  streak_freeze: "ac_unit",
  hearts_refill: "favorite",
};

const REWARD_LABEL: Record<ChestRewardType, string> = {
  gems: "Gemas",
  streak_freeze: "Bloqueio de Ofensiva",
  hearts_refill: "Vidas Restauradas",
};

// Tela de transição do Baú Diário (a pedido do usuário, v1.18) — fechado -> "Abrir Baú" (chama a
// API de verdade) -> "Recompensas Coletadas!" com a recompensa real determinada pelo servidor.
// Espelha apps/mobile/src/app/bau.tsx. Mesmo padrão de rota "tarefa em tela cheia" da conquista
// (app/(lesson)/trilhas/[trackId]/[lessonId]/conquista/page.tsx), mas credita via chamada de API
// real em vez de crédito local — não há como simular a recompensa (é sorteada no servidor).
export default function DailyChestPage() {
  const router = useRouter();
  const { updateGamification, adjustStreakFreezes } = useAuth();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<ChestOpenResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDailyChestStatus().then((status) => {
      if (cancelled) return;
      setAvailable(status.available);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const result = await openDailyChest();
      setReward(result);
      updateGamification({
        gems: result.gems,
        ...(result.reward_type === "hearts_refill" ? { hearts_current: HEARTS_MAX } : {}),
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
            <h1 className="font-display text-headline-md font-bold text-on-surface">
              Nenhum Baú disponível
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Responda mais perguntas hoje pra liberar seu próximo Baú Diário.
            </p>
          </div>
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
              <p className="font-label-caps text-label-caps uppercase text-secondary mb-1">
                Baú Diário
              </p>
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
              <p className="font-label-caps text-label-caps uppercase text-secondary mb-1">
                Baú Diário
              </p>
              <h1 className="font-display text-headline-md font-bold text-on-surface">
                Você ganhou um Baú de Projeto!
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Abra pra revelar sua recompensa de hoje.
              </p>
            </div>
            {error && <p className="font-body-sm text-body-sm text-error-red">{error}</p>}
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
