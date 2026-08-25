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

// Cor/material por tier (decisão do usuário, 25/08/2026): cada um dos 10 tiers tem seu próprio
// par bg/on em globals.css (--color-league-*) em vez do mesmo bg-secondary-container laranja pra
// todos. Classes literais (não `bg-league-${tier}` interpolado) de propósito — o scanner do
// Tailwind precisa ver a string inteira em algum lugar do código-fonte pra gerar a utility; uma
// classe montada em runtime não é vista e simplesmente não existe no CSS final.
export const LEAGUE_TIER_BG_CLASS: Record<LeagueTierName, string> = {
  madeira: "bg-league-madeira",
  pedra: "bg-league-pedra",
  bronze: "bg-league-bronze",
  prata: "bg-league-prata",
  ouro: "bg-league-ouro",
  platina: "bg-league-platina",
  esmeralda: "bg-league-esmeralda",
  safira: "bg-league-safira",
  rubi: "bg-league-rubi",
  diamante: "bg-league-diamante",
};

export const LEAGUE_TIER_ON_CLASS: Record<LeagueTierName, string> = {
  madeira: "text-on-league-madeira",
  pedra: "text-on-league-pedra",
  bronze: "text-on-league-bronze",
  prata: "text-on-league-prata",
  ouro: "text-on-league-ouro",
  platina: "text-on-league-platina",
  esmeralda: "text-on-league-esmeralda",
  safira: "text-on-league-safira",
  rubi: "text-on-league-rubi",
  diamante: "text-on-league-diamante",
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

// Inverso de tierDivisionToRank — necessário pra exibir o rank cru devolvido pelo Personal Record
// "liga_alcancada" (services/monolith/internal/gamification/personalrecords.go), que guarda só um
// inteiro 1-30, não {tier, division}. Espelha rankDivision/tierName do backend
// (internal/gamification/gamification.go).
export function rankToTierDivision(rank: number): { tier: LeagueTierName; division: number } {
  const clamped = Math.min(Math.max(rank, 1), LEAGUE_TIERS.length * 3);
  const tierIndex = Math.floor((clamped - 1) / 3);
  const division = 3 - ((clamped - 1) % 3);
  return { tier: LEAGUE_TIERS[tierIndex], division };
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

// Portado de apps/mobile/.../leagueTiers.ts (auditoria de 25/08/2026, rodada 3): o mobile já
// tinha esta função desde um /impeccable critique de 18/08/2026, mas o web ficou pra trás e
// seguia mostrando "2d 14h 32m" como string congelada no LeagueHeader — falsa precisão, e drift
// de paridade entre os dois apps. League.week_reference ("YYYY-Www", ISO 8601) é o único dado
// real disponível pra calcular o fim do ciclo: o contrato da API não tem um `cycle_ends_at`
// explícito (abrir isso é mudança de backend, fora do escopo de uma auditoria de UI). Calcula a
// segunda-feira da semana ISO (semana 1 = a que contém a 1ª quinta do ano) e soma 7 dias —
// aproximação em UTC, não o instante exato do job close-league-week (fuso do usuário), mas real e
// que efetivamente conta pra baixo.
export function weekReferenceEndsAtIso(weekReference: string): string | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekReference);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);
  return nextMonday.toISOString();
}
