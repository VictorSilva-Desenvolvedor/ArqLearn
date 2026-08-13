// Título de nível é conteúdo de apresentação do cliente — a API só devolve o número (`level`),
// a curva de XP que define o nível em si é calculada no backend (TDD §3.1), nunca no cliente.
// Espelha apps/web/src/lib/gamification/levelTitle.ts.
const levelTitles: Array<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: "Estagiário" },
  { minLevel: 6, title: "Arquiteto Júnior" },
  { minLevel: 11, title: "Arquiteto Pleno" },
  { minLevel: 16, title: "Arquiteto Sênior" },
  { minLevel: 21, title: "Mestre Arquiteto" },
];

export function levelTitleFor(level: number): string {
  const match = [...levelTitles].reverse().find((entry) => level >= entry.minLevel);
  return match?.title ?? levelTitles[0].title;
}
