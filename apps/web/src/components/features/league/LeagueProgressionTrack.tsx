"use client";

import { Icon } from "@/components/ui/Icon";
import {
  LEAGUE_TIERS,
  LEAGUE_TIER_BG_CLASS,
  LEAGUE_TIER_ICONS,
  LEAGUE_TIER_LABELS,
  LEAGUE_TIER_ON_CLASS,
  type LeagueTierName,
} from "@/lib/gamification/leagueTiers";
import { cn } from "@/lib/utils/cn";

interface LeagueProgressionTrackProps {
  currentTier: LeagueTierName;
  onSelectTier?: (tier: LeagueTierName) => void;
}

// Espelha apps/mobile/.../LeagueProgressionTrack.tsx — trilha horizontal com as 10 ligas (Madeira
// → Diamante), a atual em destaque. Tocar numa liga abre o LeagueTiersDialog nela.
export function LeagueProgressionTrack({ currentTier, onSelectTier }: LeagueProgressionTrackProps) {
  return (
    <div className="bg-surface-bright border border-outline-variant rounded-xl p-sm">
      <div className="flex items-start gap-md overflow-x-auto pb-1">
        {LEAGUE_TIERS.map((tier, index) => {
          const active = tier === currentTier;
          return (
            <div key={tier} className="flex items-start gap-md shrink-0">
              {index > 0 && <div className="h-0.5 w-6 bg-outline-variant mt-5 shrink-0" />}
              <button
                type="button"
                onClick={() => onSelectTier?.(tier)}
                aria-label={`Ver Liga ${LEAGUE_TIER_LABELS[tier]}`}
                className="flex flex-col items-center gap-1 min-w-[56px]"
              >
                {/* Cor por tier também aqui (auditoria de 25/08/2026): o selo grande logo acima
                    nesta MESMA tela já pinta a liga atual na cor do próprio tier desde a
                    pendência #8, mas esta trilha continuava em bg-primary — medido ao vivo com o
                    usuário mockado em Bronze, o selo aparecia marrom e o nó "Bronze" da trilha,
                    200px abaixo, aparecia azul. Mesmo tier, duas cores, na mesma dobra. O rótulo
                    de texto segue em text-primary de propósito: a paleta de tier é de material
                    (prata/platina são claríssimos) e não garante contraste de TEXTO sobre o card
                    branco — o círculo carrega o material, o rótulo carrega o estado. */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    active
                      ? cn(LEAGUE_TIER_BG_CLASS[tier], LEAGUE_TIER_ON_CLASS[tier], "border-outline-variant")
                      : "bg-surface-gray border-outline-variant text-outline",
                  )}
                >
                  <Icon name={LEAGUE_TIER_ICONS[tier]} filled={active} className="text-lg" />
                </div>
                <span
                  className={cn(
                    "font-label text-label-caps truncate max-w-[60px]",
                    active ? "text-primary font-bold" : "text-outline",
                  )}
                >
                  {LEAGUE_TIER_LABELS[tier]}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
