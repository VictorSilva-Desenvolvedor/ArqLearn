"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LeagueProgressionTrack } from "./LeagueProgressionTrack";
import { LeagueTiersDialog } from "./LeagueTiersDialog";
import { LEAGUE_TIER_ICONS, LEAGUE_TIER_LABELS, nextTierDivision, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import type { League } from "@/types/api";

// Espelha apps/mobile/.../liga.tsx (topo da tela) — LeaguePage é Server Component, por isso esse
// bloco (cabeçalho + trilha de progressão + modal de todas as ligas) precisou virar um client
// component à parte. Redesenhado pra hierarquia de 10 ligas x 3 divisões (Madeira → Diamante).
export function LeagueHeader({ league, currentUserId }: { league: League; currentUserId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitialTier, setDialogInitialTier] = useState<LeagueTierName | undefined>();

  const tier = (league.tier ?? "madeira") as LeagueTierName;
  const label = LEAGUE_TIER_LABELS[tier];
  const next = nextTierDivision(tier, league.division);
  const description = next
    ? `Os ${league.promotion_slots} melhores avançam para a Liga ${LEAGUE_TIER_LABELS[next.tier]} ${next.division}. Compita aprendendo!`
    : "Você está na posição mais alta da hierarquia. Compita aprendendo!";

  const openDialog = (initialTier?: LeagueTierName) => {
    setDialogInitialTier(initialTier);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => openDialog(undefined)}
          className="w-24 h-24 mb-sm rounded-full border-4 border-outline-variant bg-secondary-container flex items-center justify-center"
        >
          <Icon name={LEAGUE_TIER_ICONS[tier]} filled className="text-secondary text-5xl" />
        </button>
        <h1 className="font-display text-display-lg text-on-surface mb-xs">
          Liga {label} {league.division}
        </h1>
        {/* max-w-[28rem] em vez de max-w-md: globals.css define --spacing-md: 16px, e o
            utilitário max-w-md do Tailwind v4 cai pra esse token (namespace compartilhado) na
            ausência de um --max-width-md próprio — usar max-w-md aqui colapsava o parágrafo pra
            16px de largura (uma palavra por linha). Nenhum outro lugar do app usa max-w-md hoje. */}
        <p className="font-body-md text-body-md text-on-surface-variant w-full max-w-[28rem] mx-auto">{description}</p>
        <div className="mt-md bg-surface-container rounded-lg px-lg py-sm border border-outline-variant">
          <span className="font-label text-label-caps text-on-surface-variant block mb-1">Tempo Restante</span>
          <span className="font-label text-question-lg text-primary">2d 14h 32m</span>
        </div>
      </div>

      <LeagueProgressionTrack currentTier={tier} onSelectTier={(t) => openDialog(t)} />

      <LeagueTiersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentUserId={currentUserId}
        ownLeague={league}
        initialTier={dialogInitialTier}
      />
    </div>
  );
}
