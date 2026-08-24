import type { IconName } from "@/components/ui/Icon";
import type { PersonalRecord, PersonalRecordMetric } from "@/types/api";
import { LEAGUE_TIER_ICONS, LEAGUE_TIER_LABELS, rankToTierDivision } from "./leagueTiers";

export interface PersonalRecordCatalogEntry {
  title: string;
  description: string;
  icon: IconName;
  formatValue: (value: number) => string;
}

// A API só devolve {metric, value} (ver PersonalRecord em types/api.ts) — título/descrição/ícone
// exibidos são conteúdo do cliente, mesmo padrão de achievementCatalog.ts. Espelha
// apps/web/src/lib/gamification/personalRecordCatalog.ts (só o campo `icon` difere: aqui é
// IconName de src/components/ui/Icon.tsx, lá é uma string livre de Material Symbols).
export const personalRecordCatalog: Record<PersonalRecordMetric, PersonalRecordCatalogEntry> = {
  streak_dias: {
    title: "Sequência mais longa",
    description: "Sua maior sequência de dias seguidos estudando, até hoje.",
    icon: "streak",
    formatValue: (v) => `${v} ${v === 1 ? "dia" : "dias"}`,
  },
  infinito_sem_erros: {
    title: "Mira mais certeira",
    description: "Sua maior sequência de acertos seguidos no Modo Infinito, até hoje.",
    icon: "target",
    formatValue: (v) => `${v} ${v === 1 ? "acerto" : "acertos"}`,
  },
  xp_dia: {
    title: "Melhor dia de XP",
    description: "O maior total de XP que você já ganhou em um único dia.",
    icon: "bolt",
    formatValue: (v) => `${v} XP`,
  },
  liga_alcancada: {
    title: "Liga mais alta",
    description: "A liga mais alta que você já alcançou, mesmo que tenha rebaixado depois.",
    icon: "militaryTech",
    formatValue: (v) => {
      const { tier, division } = rankToTierDivision(v);
      return `${LEAGUE_TIER_LABELS[tier]} ${division}`;
    },
  },
};

// personalRecordIcon: liga_alcancada troca o ícone genérico pelo ícone da liga real alcançada
// (LEAGUE_TIER_ICONS) — mais reconhecível que um troféu fixo pra quem já viu aquele ícone na tela
// Liga. As outras 3 métricas usam o ícone fixo do catálogo acima.
export function personalRecordIcon(record: PersonalRecord): IconName {
  if (record.metric === "liga_alcancada") {
    return LEAGUE_TIER_ICONS[rankToTierDivision(record.value).tier];
  }
  return personalRecordCatalog[record.metric].icon;
}
