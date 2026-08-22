import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { getGemTransactions } from "@/lib/api/resources/gems";
import { spacing, type as typeTokens } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { GemTransaction, GemTransactionReason } from "@/types/api";

// Extrato de gemas (TDD §15.1) — lista cronológica simples, sem gráfico nem agregação: aqui a
// estética cede espaço à clareza ("lista de materiais de obra", princípio explícito do documento
// de moeda virtual). Espelha apps/web/src/app/(shell)/loja/extrato/page.tsx.
const REASON_META: Record<GemTransactionReason, { label: string; icon: IconName }> = {
  achievement: { label: "Conquista", icon: "militaryTech" },
  daily_chest: { label: "Baú Diário", icon: "chest" },
  weekly_chest: { label: "Baú Semanal", icon: "eventAvailable" },
  shop_purchase: { label: "Compra na Loja", icon: "storefront" },
  bug_report_reward: { label: "Relato de Bug", icon: "bugReport" },
  gem_coupon: { label: "Cupom resgatado", icon: "ticketPercent" },
  bet_stake: { label: "Aposta iniciada", icon: "dice" },
  bet_payout: { label: "Aposta vencida", icon: "trophy" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function GemLedgerScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[typeTokens.displayLg, styles.headerTitle]}>Extrato de Gemas</Text>
        </View>

        {loading && <Text style={[typeTokens.bodySm, styles.muted]}>Carregando…</Text>}

        {!loading && transactions.length === 0 && (
          <Card padding="lg" style={styles.emptyCard}>
            <Icon name="receipt" size={40} color={colors.onSurfaceVariant} />
            <Text style={[typeTokens.bodyMd, styles.muted]}>Nenhuma movimentação de gemas ainda.</Text>
          </Card>
        )}

        <View style={styles.list}>
          {transactions.map((t) => {
            const meta = REASON_META[t.reason];
            const positive = t.delta > 0;
            return (
              <Card key={t.id} padding="md" style={styles.row}>
                <View style={[styles.iconBadge, positive ? styles.iconBadgePositive : styles.iconBadgeNeutral]}>
                  <Icon name={meta.icon} size={20} color={positive ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[typeTokens.bodyMd, styles.rowLabel]}>{meta.label}</Text>
                  <Text style={[typeTokens.bodySm, styles.muted]}>{formatDate(t.created_at)}</Text>
                </View>
                <View style={styles.rowAmount}>
                  <Text style={[typeTokens.statsNum, positive ? styles.deltaPositive : styles.deltaNeutral]}>
                    {positive ? "+" : ""}
                    {t.delta}
                  </Text>
                  <Text style={[typeTokens.bodySm, styles.muted]}>saldo {t.balance_after}</Text>
                </View>
              </Card>
            );
          })}
        </View>

        {cursor && (
          <Button variant="ghost" fullWidth disabled={loadingMore} onPress={loadMore}>
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    headerTitle: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: "700",
    },
    muted: {
      color: colors.onSurfaceVariant,
    },
    emptyCard: {
      alignItems: "center",
      gap: spacing.xs,
    },
    list: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBadgePositive: {
      backgroundColor: colors.primaryContainer,
    },
    iconBadgeNeutral: {
      backgroundColor: colors.surfaceVariant,
    },
    rowInfo: {
      flex: 1,
    },
    rowLabel: {
      color: colors.onSurface,
      fontWeight: "600",
    },
    rowAmount: {
      alignItems: "flex-end",
    },
    deltaPositive: {
      color: colors.primary,
      fontWeight: "700",
    },
    deltaNeutral: {
      color: colors.onSurface,
      fontWeight: "700",
    },
  });
