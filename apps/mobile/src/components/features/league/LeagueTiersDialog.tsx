import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { LeagueRankingList } from "./LeagueRankingList";
import { getLeague } from "@/lib/api/resources/gamification";
import { LEAGUE_TIERS, LEAGUE_TIER_LABELS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { colors, spacing, type } from "@/theme/tokens";
import type { League, LeagueRankingEntry } from "@/types/api";

interface LeagueTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  ownLeague: League;
}

// Modal de navegação por todas as ligas (bronze → diamante): mostra quanto falta pro usuário
// entrar na zona de promoção da PRÓPRIA liga (calculado ao vivo pelo backend, GET
// /v1/gamification/league — ver services/monolith/internal/gamification/gamification.go) e deixa
// trocar de aba pra ver o top 50 de qualquer outra liga (fetch sob demanda, cacheado em memória
// enquanto o modal estiver aberto).
export function LeagueTiersDialog({ open, onOpenChange, currentUserId, ownLeague }: LeagueTiersDialogProps) {
  const ownTier = (ownLeague.tier ?? "bronze") as LeagueTierName;
  const [selectedTier, setSelectedTier] = useState<LeagueTierName>(ownTier);
  const [loading, setLoading] = useState(false);
  const [rankingByTier, setRankingByTier] = useState<Partial<Record<LeagueTierName, LeagueRankingEntry[]>>>({
    [ownTier]: ownLeague.ranking,
  });

  useEffect(() => {
    if (!open) return;
    setSelectedTier(ownTier);
    setRankingByTier((prev) => ({ ...prev, [ownTier]: ownLeague.ranking }));
  }, [open, ownTier, ownLeague.ranking]);

  useEffect(() => {
    if (!open || rankingByTier[selectedTier]) return;
    let cancelled = false;
    setLoading(true);
    getLeague(selectedTier)
      .then((league) => {
        if (cancelled) return;
        setRankingByTier((prev) => ({ ...prev, [selectedTier]: league.ranking }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedTier, rankingByTier]);

  const progressMessage = (() => {
    if (ownTier === "diamante") return "Você já está na liga mais alta — continue competindo pelo topo do ranking semanal!";
    if (ownLeague.xp_to_promotion === null) {
      return "Ainda não há gente suficiente nesta liga pra calcular a zona de promoção essa semana.";
    }
    if (ownLeague.xp_to_promotion === 0) {
      return `Você já está na zona de promoção (top ${ownLeague.promotion_slots})! Continue assim até o fim da semana.`;
    }
    return `Faltam ${ownLeague.xp_to_promotion} XP pra entrar na zona de promoção (top ${ownLeague.promotion_slots}).`;
  })();

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <View style={styles.header}>
        <Icon name="trophy" size={28} color={colors.secondary} />
        <Text style={[type.headlineMd, styles.title]}>Ligas</Text>
      </View>

      <View style={styles.progressCard}>
        {ownLeague.viewer_position !== null && (
          <Text style={[type.bodySm, styles.position]}>
            Você está em {ownLeague.viewer_position}º lugar na {LEAGUE_TIER_LABELS[ownTier]}.
          </Text>
        )}
        <Text style={[type.bodyMd, styles.progressText]}>{progressMessage}</Text>
      </View>

      <View style={styles.tabs}>
        {LEAGUE_TIERS.map((tierOption) => (
          <Pressable
            key={tierOption}
            onPress={() => setSelectedTier(tierOption)}
            style={[styles.tab, selectedTier === tierOption && styles.tabActive]}
          >
            <Text style={[type.labelCaps, selectedTier === tierOption ? styles.tabTextActive : styles.tabText]}>
              {LEAGUE_TIER_LABELS[tierOption].replace("Liga ", "")}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.rankingScroll} showsVerticalScrollIndicator={false}>
        {loading && !rankingByTier[selectedTier] ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : (rankingByTier[selectedTier]?.length ?? 0) > 0 ? (
          <LeagueRankingList ranking={rankingByTier[selectedTier]!} currentUserId={currentUserId} />
        ) : (
          <Text style={[type.bodySm, styles.empty]}>Ninguém está na {LEAGUE_TIER_LABELS[selectedTier]} ainda esta semana.</Text>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  progressCard: {
    backgroundColor: colors.surfaceGray,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.md,
  },
  position: {
    color: colors.onSurfaceVariant,
  },
  progressText: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: colors.surfaceGray,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  rankingScroll: {
    maxHeight: 320,
  },
  loading: {
    marginVertical: spacing.lg,
  },
  empty: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginVertical: spacing.lg,
  },
});
