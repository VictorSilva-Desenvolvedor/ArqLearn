import type { AchievementType } from "@/types/api";

// AchievementRarity: identidade visual por tier de raridade (framework do documento de brainstorm
// de conquistas — mapeado a tokens semânticos já existentes no design system, sem paleta nova; ver
// AchievementBadge.tsx pra qual token cada raridade usa). "comum" é o piso — a maioria dos badges
// de "primeira vez" — e "lendario" é reservado ao nível 5 de cada família repetível.
export type AchievementRarity = "comum" | "incomum" | "raro" | "epico" | "lendario";

export interface AchievementCatalogEntry {
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  gems_reward: number;
  rarity: AchievementRarity;
}

// Recompensa por nível de conquista repetível (índice 0 = nível 1) — espelha exatamente
// tierXPRewards/tierGemsRewards em services/monolith/internal/gamification/achievements.go. Se
// um valor mudar de um lado, muda do outro — os dois lados não têm como compartilhar código (Go
// vs TypeScript), então isso é conferido manualmente por enquanto.
const tierXP = [20, 40, 80, 150, 300];
const tierGems = [5, 8, 15, 25, 50];

// tierRarities: nível 1 (limiar mais baixo de cada família) é sempre "comum", nível 5 (o mais
// difícil) é sempre "lendario" — a raridade sobe junto com o nível, não é uma escolha por família.
const tierRarities: AchievementRarity[] = ["comum", "incomum", "raro", "epico", "lendario"];

// tier() monta as 5 entradas de uma família repetível (ex.: "infinito_sem_erros_1".."_5") — cada
// "type" precisa bater exatamente com o gerado por tierFamilies em achievements.go
// (`fmt.Sprintf("%s_%d", base, i+1)`).
function tier(
  base: string,
  icon: string,
  thresholds: [number, number, number, number, number],
  describe: (threshold: number) => string,
  title: (level: number) => string,
): Record<AchievementType, AchievementCatalogEntry> {
  const entries: Record<AchievementType, AchievementCatalogEntry> = {};
  thresholds.forEach((threshold, i) => {
    entries[`${base}_${i + 1}`] = {
      title: title(i + 1),
      description: describe(threshold),
      icon,
      xp_reward: tierXP[i],
      gems_reward: tierGems[i],
      rarity: tierRarities[i],
    };
  });
  return entries;
}

// A API só devolve {type, unlocked_at} — título/descrição (a "dica" de como desbloquear)/ícone/
// recompensas exibidos são conteúdo do cliente, mapeado por tipo. Cada "type" aqui precisa ter um
// espelho exato do lado do backend (internal/gamification/achievements.go) — é lá que a condição
// de desbloqueio de verdade é avaliada; este catálogo só decide o que mostrar quando ela bate.
export const achievementCatalog: Record<AchievementType, AchievementCatalogEntry> = {
  // --- Prática de lições ---
  primeira_licao: {
    title: "Primeiro Passo",
    description: "Complete sua primeira lição em qualquer trilha.",
    icon: "school",
    xp_reward: 10,
    gems_reward: 2,
    rarity: "comum",
  },
  licao_perfeita: {
    title: "Precisão Cirúrgica",
    description: "Complete uma lição inteira sem errar nenhuma questão.",
    icon: "verified",
    xp_reward: 25,
    gems_reward: 5,
    rarity: "incomum",
  },
  explique_melhor: {
    title: "Curioso(a) de Plantão",
    description: "Use o botão \"Explique melhor\" pela primeira vez, numa questão que errou.",
    icon: "psychology",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  ...tier(
    "licoes_completas",
    "menu_book",
    [5, 15, 30, 60, 100],
    (n) => `Complete ${n} lições ao todo, em qualquer trilha.`,
    (level) => `Estudante Dedicado ${level}`,
  ),
  ...tier(
    "respostas_certas",
    "check_circle",
    [50, 150, 300, 600, 1000],
    (n) => `Acerte ${n} perguntas ao todo, em qualquer lição.`,
    (level) => `Sabe Tudo ${level}`,
  ),

  // --- Modo Infinito ---
  infinito_10_perguntas: {
    title: "Sem Parar",
    description: "Responda 10 perguntas no Modo Infinito (ao todo, em qualquer sessão).",
    icon: "all_inclusive",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  ...tier(
    "infinito_sem_erros",
    "target",
    [10, 25, 50, 100, 200],
    (n) => `Acerte ${n} perguntas seguidas sem errar no Modo Infinito.`,
    (level) => `Mira Certeira ${level}`,
  ),
  ...tier(
    "infinito_sessoes",
    "replay",
    [10, 25, 50, 100, 200],
    (n) => `Jogue o Modo Infinito ${n} vezes (encerrando a sessão com pelo menos 1 pergunta respondida).`,
    (level) => `Maratonista ${level}`,
  ),

  // --- Streak ---
  ...tier(
    "streak_dias",
    "local_fire_department",
    [7, 14, 30, 60, 100],
    (n) => `Mantenha uma sequência de ${n} dias seguidos estudando.`,
    (level) => `Chama Acesa ${level}`,
  ),

  // --- Loja ---
  primeira_compra: {
    title: "Primeira Compra",
    description: "Compre seu primeiro item na Loja da Arquiteta.",
    icon: "storefront",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  ...tier(
    "gemas_gastas",
    "diamond",
    [50, 150, 300, 600, 1000],
    (n) => `Gaste ${n} gemas ao todo na Loja.`,
    (level) => `Cliente Fiel ${level}`,
  ),

  // --- Materiais (Resumo/Chat) ---
  primeiro_material: {
    title: "Primeiro Material",
    description: "Envie seu primeiro material de estudo pra o ArqLearn.",
    icon: "upload_file",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  primeiro_resumo: {
    title: "Resumo na Mão",
    description: "Gere seu primeiro Resumo Inteligente a partir de um material enviado.",
    icon: "summarize",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  ...tier(
    "chat_material",
    "forum",
    [5, 15, 30, 60, 100],
    (n) => `Faça ${n} perguntas no Chat sobre um material enviado.`,
    (level) => `Conversador ${level}`,
  ),

  // --- Comunidade ---
  primeiro_bug: {
    title: "Olho de Águia",
    description: "Relate seu primeiro bug encontrado no app (tela \"Ajuda e Bugs\").",
    icon: "bug_report",
    xp_reward: 15,
    gems_reward: 3,
    rarity: "comum",
  },
  bug_corrigido: {
    title: "Contribuidor",
    description: "Tenha um bug ou sugestão que você relatou marcado como corrigido/implementado.",
    icon: "task_alt",
    xp_reward: 30,
    gems_reward: 10,
    rarity: "raro",
  },
};
