"use client";

import { useState } from "react";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { AchievementBadge } from "./AchievementBadge";
import type { Achievement } from "@/types/api";

// Quantas conquistas ficam visíveis antes de "Ver todas" — 3 linhas do grid de 3 colunas.
const COLLAPSED_COUNT = 9;

// O catálogo tem 44 conquistas. Renderizar todas de uma vez enchia o perfil com ~40 selos
// "Bloqueada" idênticos (a maior parte da rolagem da tela) e enterrava as desbloqueadas, que são
// justamente a recompensa. A referência do Stitch mostra 6 slots + "Ver todas" — mesma ideia aqui,
// com as desbloqueadas primeiro no estado recolhido e o catálogo inteiro (em ordem de catálogo,
// para não quebrar as famílias de níveis) ao expandir.
export function AchievementGrid({ unlocked }: { unlocked: Achievement[] }) {
  const [expanded, setExpanded] = useState(false);
  const unlockedAtByType = new Map(unlocked.map((a) => [a.type, a.unlocked_at]));

  const entries = Object.entries(achievementCatalog);
  const unlockedEntries = entries.filter(([type]) => unlockedAtByType.has(type));
  const lockedEntries = entries.filter(([type]) => !unlockedAtByType.has(type));
  const visible = expanded
    ? entries
    : [...unlockedEntries, ...lockedEntries].slice(0, COLLAPSED_COUNT);
  const hasMore = entries.length > COLLAPSED_COUNT;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-sm mb-sm">
        <h2 className="font-display text-headline-md text-on-surface">Conquistas</h2>
        <span className="font-label text-label-caps text-on-surface-variant whitespace-nowrap">
          {unlockedEntries.length} de {entries.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-md">
        {visible.map(([type, entry]) => (
          <AchievementBadge
            key={type}
            entry={entry}
            unlocked={unlockedAtByType.has(type)}
            unlockedAt={unlockedAtByType.get(type)}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-md w-full font-label text-label-caps text-primary underline underline-offset-4 rounded-md py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos" : `Ver todas (${entries.length})`}
        </button>
      )}
    </div>
  );
}
