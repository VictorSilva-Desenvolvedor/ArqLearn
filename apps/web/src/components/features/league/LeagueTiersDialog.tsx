"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { Modal } from "@/components/ui/Modal";
import { LeagueRankingList } from "./LeagueRankingList";
import { getLeague } from "@/lib/api/resources/gamification";
import {
  LEAGUE_DIVISIONS,
  LEAGUE_TIERS,
  LEAGUE_TIER_ICONS,
  LEAGUE_TIER_LABELS,
  leagueFullLabel,
  type LeagueTierName,
} from "@/lib/gamification/leagueTiers";
import { cn } from "@/lib/utils/cn";
import type { League, LeagueRankingEntry } from "@/types/api";

interface LeagueTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  ownLeague: League;
  // Liga em que o modal deve abrir focado — vem de clicar num ícone da LeagueProgressionTrack.
  // Sem isso (ex.: abrindo pelo cabeçalho), abre na própria liga/divisão do usuário.
  initialTier?: LeagueTierName;
}

type CacheKey = `${LeagueTierName}-${number}`;

// Espelha apps/mobile/.../LeagueTiersDialog.tsx — modal de navegação por todas as ligas (10 ligas
// x 3 divisões = 30 posições): mostra quanto falta pro usuário entrar na zona de promoção da
// PRÓPRIA liga/divisão (calculado ao vivo pelo backend) e deixa trocar de liga (ícones) e divisão
// (3, 2, 1) pra ver o ranking de qualquer uma (fetch sob demanda, cacheado em memória).
export function LeagueTiersDialog({ open, onOpenChange, currentUserId, ownLeague, initialTier }: LeagueTiersDialogProps) {
  const ownTier = (ownLeague.tier ?? "madeira") as LeagueTierName;
  const ownKey: CacheKey = `${ownTier}-${ownLeague.division}`;

  const [selectedTier, setSelectedTier] = useState<LeagueTierName>(initialTier ?? ownTier);
  const [selectedDivision, setSelectedDivision] = useState<number>(
    initialTier && initialTier !== ownTier ? 1 : ownLeague.division,
  );
  const [loading, setLoading] = useState(false);
  const [rankingByKey, setRankingByKey] = useState<Partial<Record<CacheKey, LeagueRankingEntry[]>>>({
    [ownKey]: ownLeague.ranking,
  });

  useEffect(() => {
    if (!open) return;
    const tier = initialTier ?? ownTier;
    const division = initialTier && initialTier !== ownTier ? 1 : ownLeague.division;
    setSelectedTier(tier);
    setSelectedDivision(division);
    setRankingByKey((prev) => ({ ...prev, [ownKey]: ownLeague.ranking }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTier]);

  const selectedKey: CacheKey = `${selectedTier}-${selectedDivision}`;

  useEffect(() => {
    if (!open || rankingByKey[selectedKey]) return;
    let cancelled = false;
    setLoading(true);
    getLeague(undefined, selectedTier, selectedDivision)
      .then((league) => {
        if (cancelled) return;
        setRankingByKey((prev) => ({ ...prev, [selectedKey]: league.ranking }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedKey, selectedTier, selectedDivision, rankingByKey]);

  const progressMessage = (() => {
    if (ownTier === "diamante" && ownLeague.division === 1) {
      return "Você já está na posição mais alta — continue competindo pelo topo do ranking semanal!";
    }
    if (ownLeague.xp_to_promotion === null) {
      return "Ainda não há gente suficiente nesta divisão pra calcular a zona de promoção essa semana.";
    }
    if (ownLeague.xp_to_promotion === 0) {
      return `Você já está na zona de promoção (top ${ownLeague.promotion_slots})! Continue assim até o fim da semana.`;
    }
    return `Faltam ${ownLeague.xp_to_promotion} XP pra entrar na zona de promoção (top ${ownLeague.promotion_slots}).`;
  })();

  const currentRanking = rankingByKey[selectedKey];

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-xs mb-sm">
        <Icon name="trophy" filled className="text-secondary text-3xl" />
        <h2 className="font-display text-headline-md font-bold text-on-surface">Todas as Ligas</h2>
      </div>

      <div className="bg-surface-gray rounded-xl p-sm flex flex-col gap-1 mb-md">
        {ownLeague.viewer_position !== null && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Você está em {ownLeague.viewer_position}º lugar na {leagueFullLabel(ownTier, ownLeague.division)}.
          </p>
        )}
        <p className="font-body-md text-body-md font-semibold text-on-surface">{progressMessage}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-1">
        {LEAGUE_TIERS.map((tier) => {
          const active = tier === selectedTier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => {
                setSelectedTier(tier);
                setSelectedDivision(tier === ownTier ? ownLeague.division : 1);
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                active ? "bg-primary text-on-primary" : "bg-surface-gray text-on-surface-variant",
              )}
            >
              <Icon name={LEAGUE_TIER_ICONS[tier]} filled={active} className="text-base" />
            </button>
          );
        })}
      </div>
      <p className="font-label-caps text-label-caps text-on-surface-variant mb-sm">{LEAGUE_TIER_LABELS[selectedTier]}</p>

      <div className="flex gap-1 mb-sm">
        {LEAGUE_DIVISIONS.map((division) => (
          <button
            key={division}
            type="button"
            onClick={() => setSelectedDivision(division)}
            className={cn(
              "flex-1 py-2 rounded-full font-label-caps text-label-caps text-center transition-colors",
              selectedDivision === division
                ? "bg-secondary-container text-on-secondary-container font-bold"
                : "bg-surface-gray text-on-surface-variant",
            )}
          >
            Divisão {division}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading && !currentRanking ? (
          <div className="flex justify-center my-lg">
            <LoadingBlueprint size={32} />
          </div>
        ) : currentRanking && currentRanking.length > 0 ? (
          <LeagueRankingList
            ranking={currentRanking}
            currentUserId={currentUserId}
            promotionSlots={ownLeague.promotion_slots}
            demotionSlots={ownLeague.demotion_slots}
          />
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center my-lg">
            Ninguém está na {leagueFullLabel(selectedTier, selectedDivision)} ainda esta semana.
          </p>
        )}
      </div>
    </Modal>
  );
}
