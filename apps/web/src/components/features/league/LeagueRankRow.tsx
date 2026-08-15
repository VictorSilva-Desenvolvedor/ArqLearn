"use client";

import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
}

// Espelha apps/mobile/.../LeagueRankRow.tsx — linha agora reage ao clique com um toast mostrando
// posição + XP da semana (não existe perfil público de outro usuário em nenhum dos dois apps).
export function LeagueRankRow({ entry, isCurrentUser }: LeagueRankRowProps) {
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
      <span className="w-6 font-label text-body-sm font-bold text-on-surface-variant">{entry.position}</span>
      <Avatar name={entry.name} size={32} />
      <span className="flex-1 font-body-lg text-body-lg text-on-surface truncate">
        {isCurrentUser ? "Você" : entry.name}
      </span>
      <span className="font-label text-body-sm font-bold text-primary">{entry.xp_this_week} XP</span>
    </button>
  );
}
