"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { useAuth } from "@/hooks/useAuth";
import type { AchievementType } from "@/types/api";

// Tela própria de transição (spec §C: "If an achievement was unlocked, transition to Achievement
// screen") — antes era um Modal sobre o Resumo; a rota separada é a versão fiel ao spec.
export default function AchievementScreenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { gamification, updateGamification } = useAuth();
  const type = searchParams.get("type") as AchievementType | null;
  const entry = type ? achievementCatalog[type] : undefined;

  // Credita a recompensa uma única vez ao entrar na tela — mesmo em dev (React monta o efeito
  // 2x em StrictMode), o ref garante que só a primeira execução realmente soma XP/gemas.
  const creditedRef = useRef(false);
  useEffect(() => {
    if (!entry || creditedRef.current) return;
    creditedRef.current = true;
    updateGamification({
      xp_total: gamification.xp_total + entry.xp_reward,
      gems: gamification.gems + entry.gems_reward,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar uma vez ao montar; gamification.* mudaria a cada crédito e recriaria o efeito
  }, [entry, updateGamification]);

  if (!entry) {
    router.replace("/");
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center px-md py-lg">
      <div className="w-full max-w-[28rem] flex flex-col items-center text-center gap-lg">
        <div className="w-28 h-28 rounded-xl bg-secondary text-on-secondary flex items-center justify-center rotate-45 shadow-gamified">
          <Icon name={entry.icon} filled className="text-6xl -rotate-45" />
        </div>
        <div>
          <p className="font-label-caps text-label-caps uppercase text-secondary mb-1">Conquista desbloqueada</p>
          <h1 className="font-display text-headline-md font-bold text-on-surface">{entry.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{entry.description}</p>
        </div>
        <div className="flex items-center gap-lg">
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
            <Icon name="bolt" filled /> +{entry.xp_reward} XP
          </span>
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
            <Icon name="diamond" filled /> +{entry.gems_reward} gemas
          </span>
        </div>
        <Button variant="primary" fullWidth onClick={() => router.push("/")}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
