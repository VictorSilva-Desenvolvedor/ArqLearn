import type { GemBet, GemPackage, GemTransaction, GemTransactionReason, GemTransactionsPage } from "@/types/api";
import { mockGamificationProfile } from "./gamification";

// Moeda: Livro-Razão, Pacotes de Gemas e Double or Nothing (TDD §15) simulados em modo mock —
// mesmo espírito de dailyChest.ts/vip.ts: estado em memória, só as transações que acontecem
// durante a sessão mock (sem tentar reconstruir todo o histórico "de sempre" sem backend real,
// mesma simplificação já usada no resto dos mocks deste projeto). Espelha
// apps/mobile/.../fixtures/gems.ts.
let transactions: GemTransaction[] = [];
let transactionCounter = 0;

function currentBalance(): number {
  return mockGamificationProfile.gems + transactions.reduce((sum, t) => sum + t.delta, 0);
}

export function addMockGemTransaction(delta: number, reason: GemTransactionReason, referenceId: string | null = null): GemTransaction {
  transactionCounter += 1;
  const balanceAfter = currentBalance() + delta;
  const transaction: GemTransaction = {
    id: `mock-gem-tx-${transactionCounter}`,
    delta,
    reason,
    reference_id: referenceId,
    balance_after: balanceAfter,
    created_at: new Date().toISOString(),
  };
  transactions = [transaction, ...transactions];
  return transaction;
}

// Cursor simples de offset — mesmo esquema do backend real (base64 de {"offset": N}), mas sem
// precisar decodificar de verdade aqui (não há nada além deste array em memória pra paginar).
export function getMockGemTransactionsPage(offset: number, limit: number): GemTransactionsPage {
  const page = transactions.slice(offset, offset + limit);
  const hasMore = offset + limit < transactions.length;
  return {
    data: page,
    next_cursor: hasMore ? String(offset + limit) : null,
  };
}

// Catálogo espelhando o seed real de migrations/0023_moeda_gemas.up.sql — preço calibrado contra
// o único preço real em produção (VIP R$29,90/mês).
export const mockGemPackages: GemPackage[] = [
  { id: "mock-pkg-terracota", name: "Pacote Terracota", gems_amount: 300, price_brl_cents: 490 },
  { id: "mock-pkg-bronze", name: "Pacote Bronze", gems_amount: 800, price_brl_cents: 1190 },
  { id: "mock-pkg-marmore", name: "Pacote Mármore", gems_amount: 2000, price_brl_cents: 2490 },
  { id: "mock-pkg-ouro", name: "Pacote Ouro", gems_amount: 5000, price_brl_cents: 4990 },
];

// Cupom de gemas — mesma simplificação do cupom VIP (mocks/fixtures/vip.ts): qualquer código de
// 10 dígitos "funciona" aqui (validação de formato fica no resource layer), credita sempre o valor
// do menor pacote (Terracota) — não há um catálogo de cupons gerados por admin pra simular contra.
export function mockRedeemGemCoupon(code: string): { gems_credited: number; gems: number } {
  const gemsCredited = mockGemPackages[0].gems_amount;
  const tx = addMockGemTransaction(gemsCredited, "gem_coupon", code);
  return { gems_credited: gemsCredited, gems: tx.balance_after };
}

// Double or Nothing — sem relógio de verdade nesta fase mock (mesma simplificação de
// dailyChest.ts "sem reset diário"), então a aposta ativa não avança sozinha; existe só pra
// exercitar o fluxo "iniciar aposta" / "ver progresso" na tela /loja/aposta.
export const GEM_BET_MIN_STAKE = 50;
export const GEM_BET_DAYS_REQUIRED = 7;

let activeBet: GemBet | null = null;

export function getMockActiveGemBet(): GemBet | null {
  return activeBet;
}

export function startMockGemBet(stakeGems: number): GemBet {
  addMockGemTransaction(-stakeGems, "bet_stake");
  activeBet = { stake_gems: stakeGems, days_required: GEM_BET_DAYS_REQUIRED, days_completed: 0, status: "active" };
  return activeBet;
}
