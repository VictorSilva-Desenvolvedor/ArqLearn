import type { AchievementType } from "@/types/api";

export interface AchievementCatalogEntry {
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  gems_reward: number;
}

// A API só devolve {type, unlocked_at} — título/descrição/ícone/recompensas exibidos são
// conteúdo do cliente, mapeado por tipo (igual a um catálogo de conquistas versionado no app).
export const achievementCatalog: Record<AchievementType, AchievementCatalogEntry> = {
  fundacoes_mestre: {
    title: "Mestre das Estruturas",
    description:
      "Você completou 5 lições consecutivas sobre fundações e vigas sem errar nenhuma questão.",
    icon: "foundation",
    xp_reward: 50,
    gems_reward: 10,
  },
  urbanismo_explorador: {
    title: "Explorador Urbano",
    description: "Você concluiu sua primeira trilha de Urbanismo.",
    icon: "location_city",
    xp_reward: 40,
    gems_reward: 8,
  },
  paisagismo_iniciante: {
    title: "Semente Verde",
    description: "Você iniciou sua jornada em Paisagismo.",
    icon: "park",
    xp_reward: 30,
    gems_reward: 5,
  },
  licao_perfeita: {
    title: "Precisão Cirúrgica",
    description: "Você completou uma lição inteira sem errar nenhuma questão.",
    icon: "verified",
    xp_reward: 25,
    gems_reward: 5,
  },
};
