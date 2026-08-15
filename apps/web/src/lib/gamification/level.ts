// Espelha a curva de nível de services/monolith/internal/gamification/algorithms.go (Nivel):
// nivel(xp_total) = floor(sqrt(xp_total / 100)) + 1  =>  xp_min(N) = 100 * (N-1)^2.
// A API já retorna `level` pronto (GamificationProfile.level) — isso aqui só inverte a fórmula
// pra calcular quanto falta pro próximo nível, algo que o backend não expõe pronto.
export function xpParaProximoNivel(level: number, xpTotal: number): number {
  const proximoNivelMin = 100 * level ** 2;
  return Math.max(0, proximoNivelMin - xpTotal);
}

export function xpMinimoDoNivel(level: number): number {
  return 100 * (level - 1) ** 2;
}

// Progresso (0–1) dentro do nível atual, pra barra de progresso.
export function progressoDoNivel(level: number, xpTotal: number): number {
  const min = xpMinimoDoNivel(level);
  const max = 100 * level ** 2;
  if (max <= min) return 1;
  return Math.min(1, Math.max(0, (xpTotal - min) / (max - min)));
}
