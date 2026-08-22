"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { getGemTransactions } from "@/lib/api/resources/gems";
import type { GemTransaction, GemTransactionReason } from "@/types/api";

// Extrato de gemas (TDD §15.1) — lista cronológica simples, sem gráfico nem agregação: aqui a
// estética cede espaço à clareza ("lista de materiais de obra", princípio explícito do documento
// de moeda virtual). Espelha apps/mobile/src/app/loja/extrato.tsx.
const REASON_META: Record<GemTransactionReason, { label: string; icon: string }> = {
  achievement: { label: "Conquista", icon: "military_tech" },
  daily_chest: { label: "Baú Diário", icon: "inventory_2" },
  weekly_chest: { label: "Baú Semanal", icon: "calendar_month" },
  shop_purchase: { label: "Compra na Loja", icon: "storefront" },
  bug_report_reward: { label: "Relato de Bug", icon: "bug_report" },
  gem_coupon: { label: "Cupom resgatado", icon: "confirmation_number" },
  bet_stake: { label: "Aposta iniciada", icon: "casino" },
  bet_payout: { label: "Aposta vencida", icon: "emoji_events" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function GemLedgerPage() {
  const [transactions, setTransactions] = useState<GemTransaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGemTransactions().then((page) => {
      if (cancelled) return;
      setTransactions(page.data);
      setCursor(page.next_cursor);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const page = await getGemTransactions(cursor);
    setTransactions((current) => [...current, ...page.data]);
    setCursor(page.next_cursor);
    setLoadingMore(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <Icon name="receipt_long" className="text-3xl text-on-surface-variant" />
        <h1 className="font-display text-display-lg font-bold text-on-surface">Extrato de Gemas</h1>
      </div>

      {loading && <p className="font-body-sm text-body-sm text-on-surface-variant">Carregando…</p>}

      {!loading && transactions.length === 0 && (
        <Card padding="lg" className="flex flex-col items-center text-center gap-xs">
          <Icon name="receipt_long" className="text-4xl text-on-surface-variant" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhuma movimentação de gemas ainda.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-xs">
        {transactions.map((t) => {
          const meta = REASON_META[t.reason];
          const positive = t.delta > 0;
          return (
            <Card key={t.id} padding="md" className="flex items-center gap-sm">
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                  positive ? "bg-primary-container text-on-primary-container" : "bg-surface-variant text-on-surface-variant"
                }`}
              >
                <Icon name={meta.icon} className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md font-semibold text-on-surface">{meta.label}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(t.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-label text-stats-num font-bold ${positive ? "text-primary" : "text-on-surface"}`}>
                  {positive ? "+" : ""}
                  {t.delta}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">saldo {t.balance_after}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {cursor && (
        <Button variant="ghost" fullWidth disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "Carregando…" : "Carregar mais"}
        </Button>
      )}
    </div>
  );
}
