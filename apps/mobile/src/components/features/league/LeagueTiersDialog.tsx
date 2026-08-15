import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { LeagueRankingList } from "./LeagueRankingList";
import { getLeague } from "@/lib/api/resources/gamification";
import {
  LEAGUE_DIVISIONS,
  LEAGUE_TIERS,
  LEAGUE_TIER_ICONS,
  LEAGUE_TIER_LABELS,
  leagueFullLabel,
  type LeagueTierName,
} from "@/lib/gamification/leagueTiers";
import { colors, spacing, type } from "@/theme/tokens";
import type { League, LeagueRankingEntry } from "@/types/api";

interface LeagueTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  ownLeague: League;
  // Liga em que o modal deve abrir focado — vem de tocar num ícone da LeagueProgressionTrack.
  // Sem isso (ex.: abrindo pelo cabeçalho), abre na própria liga/divisão do usuário.
  initialTier?: LeagueTierName;
}

type CacheKey = `${LeagueTierName}-${number}`;

// Modal de navegação por todas as ligas (10 ligas x 3 divisões = 30 posições): mostra quanto
// falta pro usuário entrar na zona de promoção da PRÓPRIA liga/divisão (calculado ao vivo pelo
// backend, GET /v1/gamification/league) e deixa trocar de liga (ícones) e divisão (3, 2, 1) pra
// ver o ranking de qualquer uma (fetch sob demanda, cacheado em memória enquanto aberto).
export function LeagueTiersDialog({ open, onOpenChange, currentUserId, ownLeague, initialTier }: LeagueTiersDialogProps) {
  const ownTier = (ownLeague.tier ?? "madeira") as LeagueTierName;
  const ownKey: CacheKey = `${ownTier}-${ownLeague.division}`;

  const [selectedTier, setSelectedTier] = useState<LeagueTierName>(initialTier ?? ownTier);
  const [selectedDivision, setSelectedDivision] = useState<number>(initialTier && initialTier !== ownTier ? 1 : ownLeague.division);
  const [loading, setLoading] = useState(false);
  const [rankingByKey, setRankingByKey] = useState<Partial<Record<CacheKey, LeagueRankingEntry[]>>>({
    [ownKey]: ownLeague.ranking,
  });

  useEffect(() => {
    if (!open) return;
    const tier = initialTier ?? ownTier;
    const division = initialTier && initialTier !== ownTier ? 1 : ownLeague.division;
    setSelectedTier(tier);
    setSelectedDivision(division);
    setRankingByKey((prev) => ({ ...prev, [ownKey]: ownLeague.ranking }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTier]);

  const selectedKey: CacheKey = `${selectedTier}-${selectedDivision}`;

  useEffect(() => {
    if (!open || rankingByKey[selectedKey]) return;
    let cancelled = false;
    setLoading(true);
    getLeague(selectedTier, selectedDivision)
      .then((league) => {
        if (cancelled) return;
        setRankingByKey((prev) => ({ ...prev, [selectedKey]: league.ranking }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedKey, selectedTier, selectedDivision, rankingByKey]);

  const progressMessage = (() => {
    if (ownTier === "diamante" && ownLeague.division === 1) {
      return "Você já está na posição mais alta — continue competindo pelo topo do ranking semanal!";
    }
    if (ownLeague.xp_to_promotion === null) {
      return "Ainda não há gente suficiente nesta divisão pra calcular a zona de promoção essa semana.";
    }
    if (ownLeague.xp_to_promotion === 0) {
      return `Você já está na zona de promoção (top ${ownLeague.promotion_slots})! Continue assim até o fim da semana.`;
    }
    return `Faltam ${ownLeague.xp_to_promotion} XP pra entrar na zona de promoção (top ${ownLeague.promotion_slots}).`;
  })();

  const currentRanking = rankingByKey[selectedKey];

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <View style={styles.header}>
        <Icon name="trophy" size={28} color={colors.secondary} />
        <Text style={[type.headlineMd, styles.title]}>Todas as Ligas</Text>
      </View>

      <View style={styles.progressCard}>
        {ownLeague.viewer_position !== null && (
          <Text style={[type.bodySm, styles.position]}>
            Você está em {ownLeague.viewer_position}º lugar na {leagueFullLabel(ownTier, ownLeague.division)}.
          </Text>
        )}
        <Text style={[type.bodyMd, styles.progressText]}>{progressMessage}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierScroll} contentContainerStyle={styles.tierRow}>
        {LEAGUE_TIERS.map((tier) => {
          const active = tier === selectedTier;
          return (
            <Pressable
              key={tier}
              onPress={() => {
                setSelectedTier(tier);
                setSelectedDivision(tier === ownTier ? ownLeague.division : 1);
              }}
              style={[styles.tierBadge, active && styles.tierBadgeActive]}
            >
              <Icon name={LEAGUE_TIER_ICONS[tier]} size={18} color={active ? colors.onPrimary : colors.onSurfaceVariant} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[type.labelCaps, styles.tierLabel]}>{LEAGUE_TIER_LABELS[selectedTier]}</Text>

      <View style={styles.divisionRow}>
        {LEAGUE_DIVISIONS.map((division) => (
          <Pressable
            key={division}
            onPress={() => setSelectedDivision(division)}
            style={[styles.divisionTab, selectedDivision === division && styles.divisionTabActive]}
          >
            <Text
              style={[type.labelCaps, selectedDivision === division ? styles.divisionTextActive : styles.divisionText]}
            >
              Divisão {division}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.rankingScroll} showsVerticalScrollIndicator={false}>
        {loading && !currentRanking ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : currentRanking && currentRanking.length > 0 ? (
          <LeagueRankingList
            ranking={currentRanking}
            currentUserId={currentUserId}
            promotionSlots={ownLeague.promotion_slots}
            demotionSlots={ownLeague.demotion_slots}
          />
        ) : (
          <Text style={[type.bodySm, styles.empty]}>
            Ninguém está na {leagueFullLabel(selectedTier, selectedDivision)} ainda esta semana.
          </Text>
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
  tierScroll: {
    marginBottom: 4,
  },
  tierRow: {
    gap: 6,
    paddingVertical: 2,
  },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGray,
  },
  tierBadgeActive: {
    backgroundColor: colors.primary,
  },
  tierLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  divisionRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.sm,
  },
  divisionTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: colors.surfaceGray,
  },
  divisionTabActive: {
    backgroundColor: colors.secondaryContainer,
  },
  divisionText: {
    color: colors.onSurfaceVariant,
  },
  divisionTextActive: {
    color: colors.onSecondaryContainer,
    fontWeight: "700",
  },
  rankingScroll: {
    maxHeight: 280,
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
