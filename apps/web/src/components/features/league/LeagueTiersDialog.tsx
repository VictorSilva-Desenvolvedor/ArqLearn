"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { LeagueRankingList } from "./LeagueRankingList";
import { getLeague } from "@/lib/api/resources/gamification";
import { LEAGUE_TIERS, LEAGUE_TIER_LABELS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { cn } from "@/lib/utils/cn";
import type { League, LeagueRankingEntry } from "@/types/api";

interface LeagueTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  ownLeague: League;
}

// Espelha apps/mobile/.../LeagueTiersDialog.tsx — modal de navegação por todas as ligas (bronze →
// diamante): mostra quanto falta pro usuário entrar na zona de promoção da PRÓPRIA liga (calculado
// ao vivo pelo backend, GET /v1/gamification/league) e deixa trocar de aba pra ver o top 50 de
// qualquer outra liga (fetch sob demanda, cacheado em memória enquanto o modal estiver aberto).
export function LeagueTiersDialog({ open, onOpenChange, currentUserId, ownLeague }: LeagueTiersDialogProps) {
  const ownTier = (ownLeague.tier ?? "bronze") as LeagueTierName;
  const [selectedTier, setSelectedTier] = useState<LeagueTierName>(ownTier);
  const [loading, setLoading] = useState(false);
  const [rankingByTier, setRankingByTier] = useState<Partial<Record<LeagueTierName, LeagueRankingEntry[]>>>({
    [ownTier]: ownLeague.ranking,
  });

  useEffect(() => {
    if (!open) return;
    setSelectedTier(ownTier);
    setRankingByTier((prev) => ({ ...prev, [ownTier]: ownLeague.ranking }));
  }, [open, ownTier, ownLeague.ranking]);

  useEffect(() => {
    if (!open || rankingByTier[selectedTier]) return;
    let cancelled = false;
    setLoading(true);
    getLeague(undefined, selectedTier)
      .then((league) => {
        if (cancelled) return;
        setRankingByTier((prev) => ({ ...prev, [selectedTier]: league.ranking }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedTier, rankingByTier]);

  const progressMessage = (() => {
    if (ownTier === "diamante") return "Você já está na liga mais alta — continue competindo pelo topo do ranking semanal!";
    if (ownLeague.xp_to_promotion === null) {
      return "Ainda não há gente suficiente nesta liga pra calcular a zona de promoção essa semana.";
    }
    if (ownLeague.xp_to_promotion === 0) {
      return `Você já está na zona de promoção (top ${ownLeague.promotion_slots})! Continue assim até o fim da semana.`;
    }
    return `Faltam ${ownLeague.xp_to_promotion} XP pra entrar na zona de promoção (top ${ownLeague.promotion_slots}).`;
  })();

  const currentRanking = rankingByTier[selectedTier];

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-xs mb-sm">
        <Icon name="trophy" filled className="text-secondary text-3xl" />
        <h2 className="font-display text-headline-md font-bold text-on-surface">Ligas</h2>
      </div>

      <div className="bg-surface-gray rounded-xl p-sm flex flex-col gap-1 mb-md">
        {ownLeague.viewer_position !== null && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Você está em {ownLeague.viewer_position}º lugar na {LEAGUE_TIER_LABELS[ownTier]}.
          </p>
        )}
        <p className="font-body-md text-body-md font-semibold text-on-surface">{progressMessage}</p>
      </div>

      <div className="flex gap-1 mb-sm">
        {LEAGUE_TIERS.map((tierOption) => (
          <button
            key={tierOption}
            type="button"
            onClick={() => setSelectedTier(tierOption)}
            className={cn(
              "flex-1 py-2 rounded-full font-label-caps text-label-caps text-center transition-colors",
              selectedTier === tierOption ? "bg-primary text-on-primary" : "bg-surface-gray text-on-surface-variant",
            )}
          >
            {LEAGUE_TIER_LABELS[tierOption].replace("Liga ", "")}
          </button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && !currentRanking ? (
          <div className="flex justify-center my-lg">
            <Icon name="progress_activity" className="animate-spin text-primary text-2xl" />
          </div>
        ) : currentRanking && currentRanking.length > 0 ? (
          <LeagueRankingList ranking={currentRanking} currentUserId={currentUserId} />
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center my-lg">
            Ninguém está na {LEAGUE_TIER_LABELS[selectedTier]} ainda esta semana.
          </p>
        )}
      </div>
    </Modal>
  );
}
