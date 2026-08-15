// Espelha apps/mobile/.../leagueTiers.ts. Hierarquia de 10 ligas (pior -> melhor), cada uma com
// 3 divisões internas (3 = entrada, 1 = mais avançada) — 30 posições lineares no total. Mesma
// ordem/numeração de services/monolith/internal/gamification/gamification.go leagueTierNames.
export const LEAGUE_TIERS = [
  "madeira",
  "pedra",
  "bronze",
  "prata",
  "ouro",
  "platina",
  "esmeralda",
  "safira",
  "rubi",
  "diamante",
] as const;

export type LeagueTierName = (typeof LEAGUE_TIERS)[number];

export const LEAGUE_DIVISIONS = [3, 2, 1] as const;

export const LEAGUE_TIER_LABELS: Record<LeagueTierName, string> = {
  madeira: "Madeira",
  pedra: "Pedra",
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  platina: "Platina",
  esmeralda: "Esmeralda",
  safira: "Safira",
  rubi: "Rubi",
  diamante: "Diamante",
};

// Material Symbols Outlined — nomes usados direto pelo <Icon name=.../> do web.
export const LEAGUE_TIER_ICONS: Record<LeagueTierName, string> = {
  madeira: "forest",
  pedra: "landscape",
  bronze: "shield",
  prata: "workspace_premium",
  ouro: "military_tech",
  platina: "diamond",
  esmeralda: "spa",
  safira: "water_drop",
  rubi: "local_fire_department",
  diamante: "star",
};

// "Liga Madeira 3" — rótulo completo com liga + divisão, usado no cabeçalho da tela.
export function leagueFullLabel(tier: LeagueTierName, division: number): string {
  return `Liga ${LEAGUE_TIER_LABELS[tier]} ${division}`;
}

// Rank linear 1..30 a partir de liga+divisão — espelha rankFromTierDivision do backend
// (internal/gamification/gamification.go). Usado só pra saber se uma liga está "antes"/"depois"
// da atual na progression track (comparação de índice), nunca enviado pro servidor como XP/score.
export function tierDivisionToRank(tier: LeagueTierName, division: number): number {
  const tierIndex = LEAGUE_TIERS.indexOf(tier);
  return tierIndex * 3 + (3 - division) + 1;
}

// Próxima posição na hierarquia (pra "promovido pra X") — null se já está no topo (Diamante 1).
export function nextTierDivision(
  tier: LeagueTierName,
  division: number,
): { tier: LeagueTierName; division: number } | null {
  const rank = tierDivisionToRank(tier, division);
  if (rank >= LEAGUE_TIERS.length * 3) return null;
  const nextRank = rank + 1;
  const tierIndex = Math.floor((nextRank - 1) / 3);
  const nextDivision = 3 - ((nextRank - 1) % 3);
  return { tier: LEAGUE_TIERS[tierIndex], division: nextDivision };
}
