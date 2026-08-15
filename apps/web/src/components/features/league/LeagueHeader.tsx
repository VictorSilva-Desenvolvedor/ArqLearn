"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LeagueTiersDialog } from "./LeagueTiersDialog";
import { LEAGUE_TIER_LABELS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import type { League } from "@/types/api";

// Espelha apps/mobile/.../liga.tsx — cabeçalho da liga (LeaguePage é Server Component, por isso
// esse pedaço precisou virar um client component à parte) abria um toast informativo; agora abre
// o LeagueTiersDialog, que mostra o mesmo texto de regra e adiciona quanto falta pra promoção +
// navegação pelo top 50 de qualquer liga (dado real, GET /v1/gamification/league).
export function LeagueHeader({ league, currentUserId }: { league: League; currentUserId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const label = LEAGUE_TIER_LABELS[(league.tier ?? "bronze") as LeagueTierName] ?? "Liga";

  return (
    <>
      <button type="button" onClick={() => setDialogOpen(true)} className="flex items-center gap-sm text-left">
        <Icon name="trophy" filled className="text-4xl text-secondary" />
        <div>
          <h1 className="font-display text-display-lg font-bold text-on-surface">{label}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Os {league.promotion_slots} melhores avançam de liga. Os {league.demotion_slots} piores caem para a
            liga anterior.
          </p>
        </div>
      </button>
      <LeagueTiersDialog open={dialogOpen} onOpenChange={setDialogOpen} currentUserId={currentUserId} ownLeague={league} />
    </>
  );
}
