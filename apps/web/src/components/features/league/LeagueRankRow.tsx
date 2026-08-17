"use client";

import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
  // Top N (promotion_slots) da divisão — destaque em tertiary (verde), espelhando o mockup de
  // referência do usuário (posição/avatar em destaque pra quem já avançaria de divisão).
  inPromotionZone?: boolean;
}

// Espelha apps/mobile/.../LeagueRankRow.tsx — linha agora reage ao clique com um toast mostrando
// posição + XP da semana (não existe perfil público de outro usuário em nenhum dos dois apps).
export function LeagueRankRow({ entry, isCurrentUser, inPromotionZone }: LeagueRankRowProps) {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        showToast(
          isCurrentUser
            ? `Você está em ${entry.position}º lugar com ${entry.xp_this_week} XP essa semana.`
            : `${entry.name} está em ${entry.position}º lugar com ${entry.xp_this_week} XP essa semana.`,
          "success",
        )
      }
      className={cn(
        "flex items-center gap-md px-md py-sm border-b border-outline-variant w-full text-left",
        isCurrentUser && "border-l-4 border-l-primary bg-primary-fixed",
      )}
    >
      <span
        className={cn(
          "w-6 font-label text-body-sm font-bold text-center",
          inPromotionZone ? "text-tertiary" : "text-on-surface-variant",
        )}
      >
        {entry.position}
      </span>
      <span className={cn("rounded-full", inPromotionZone && "ring-2 ring-tertiary")}>
        <Avatar name={entry.name} size={32} />
      </span>
      <span className="flex-1 font-body-lg text-body-lg text-on-surface truncate">
        {isCurrentUser ? "Você" : entry.name}
      </span>
      <span className={cn("font-label text-body-sm font-bold", inPromotionZone ? "text-tertiary" : "text-primary")}>
        {entry.xp_this_week} XP
      </span>
    </button>
  );
}
