"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LeagueProgressionTrack } from "./LeagueProgressionTrack";
import { LeagueTiersDialog } from "./LeagueTiersDialog";
import {
  LEAGUE_TIER_BG_CLASS,
  LEAGUE_TIER_ICONS,
  LEAGUE_TIER_LABELS,
  LEAGUE_TIER_ON_CLASS,
  nextTierDivision,
  weekReferenceEndsAtIso,
  type LeagueTierName,
} from "@/lib/gamification/leagueTiers";
import { cn } from "@/lib/utils/cn";
import { useCountdownToTimestamp } from "@/hooks/useCountdown";
import { formatDaysHoursMinutes } from "@/lib/utils/format";
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
  const weekEndsAt = weekReferenceEndsAtIso(league.week_reference);
  const { secondsLeft: weekSecondsLeft, reachedZero } = useCountdownToTimestamp(weekEndsAt);
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
          className={cn(
            "w-24 h-24 mb-sm rounded-full border-4 border-outline-variant flex items-center justify-center",
            LEAGUE_TIER_BG_CLASS[tier],
          )}
        >
          {/* size={48} e não className="text-5xl": no web toda classe de tamanho em <Icon> é
              engolida pela folha do Material Symbols (fora de cascade layer) e o glifo renderiza
              em 24px — medido ao vivo aqui, um escudo de 24px dentro de um selo de 96px. Ver
              Docs/PENDENCIAS_WEB_REAL.md, "Classe de tamanho em <Icon> não tem efeito nenhum". */}
          <Icon name={LEAGUE_TIER_ICONS[tier]} filled size={48} className={LEAGUE_TIER_ON_CLASS[tier]} />
        </button>
        <h1 className="font-display text-display-lg text-on-surface mb-xs">
          Liga {label} {league.division}
        </h1>
        {/* max-w-[28rem] em vez de max-w-md: globals.css define --spacing-md: 16px, e o
            utilitário max-w-md do Tailwind v4 cai pra esse token (namespace compartilhado) na
            ausência de um --max-width-md próprio — usar max-w-md aqui colapsava o parágrafo pra
            16px de largura (uma palavra por linha). Nenhum outro lugar do app usa max-w-md hoje. */}
        <p className="font-body-md text-body-md text-on-surface-variant w-full max-w-[28rem] mx-auto">{description}</p>
        {weekEndsAt && (
          <div className="mt-md bg-surface-container rounded-lg px-lg py-sm border border-outline-variant">
            {/* reachedZero: `weekReferenceEndsAtIso` é uma aproximação em UTC do fim do ciclo, e o
                job real de fechamento roda no fuso do usuário — nos minutos/horas entre os dois a
                conta chega a zero antes de a liga fechar de fato. Sem este caso, a tela mostrava
                "0m", que lê como "acabou agora" para sempre. Também é o que aparece se o
                `week_reference` vier atrasado da API. */}
            <span className="font-label text-label-caps text-on-surface-variant block mb-1">
              {reachedZero ? "Ciclo" : "Tempo Restante"}
            </span>
            <span className="font-label text-question-lg text-primary">
              {reachedZero ? "Encerrando…" : formatDaysHoursMinutes(weekSecondsLeft)}
            </span>
          </div>
        )}
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
