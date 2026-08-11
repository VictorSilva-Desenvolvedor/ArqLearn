// Simula a curva nivel(xp_total) que o servidor real calcularia (o cliente nunca define nível
// — mesma regra de XP nunca ser calculado no frontend). Só existe aqui porque o mock precisa
// se comportar como o backend faria ao receber um novo xp_total. Calibrada para
// xp_total=520 -> level=8, batendo com mockGamificationProfile.level hoje.
const BASE_XP_PER_LEVEL = 15;

export function levelForXp(xpTotal: number): number {
  return Math.floor((1 + Math.sqrt(1 + (8 * xpTotal) / BASE_XP_PER_LEVEL)) / 2);
}

// Inverso de levelForXp — xp_total mínimo pra alcançar um nível. Diferente de levelForXp (que
// simula o que o servidor decidiria), isto só existe pra desenhar a barra "XP até o próximo
// nível" a partir de level/xp_total que a API já devolveu — não decide nada, só formata exibição.
export function xpForLevel(level: number): number {
  return (BASE_XP_PER_LEVEL * ((2 * level - 1) ** 2 - 1)) / 8;
}
