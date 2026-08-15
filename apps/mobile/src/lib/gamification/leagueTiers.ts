// Mesma ordem/numeração de services/monolith/internal/gamification/gamification.go
// tierNamesByNumber: 1=bronze (pior) .. 5=diamante (melhor).
export const LEAGUE_TIERS = ["bronze", "prata", "ouro", "platina", "diamante"] as const;

export type LeagueTierName = (typeof LEAGUE_TIERS)[number];

export const LEAGUE_TIER_LABELS: Record<string, string> = {
  bronze: "Liga Bronze",
  prata: "Liga Prata",
  ouro: "Liga Ouro",
  platina: "Liga Platina",
  diamante: "Liga Diamante",
};
