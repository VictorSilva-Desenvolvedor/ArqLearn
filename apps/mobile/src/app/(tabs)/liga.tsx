import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { LeagueProgressionTrack } from "@/components/features/league/LeagueProgressionTrack";
import { LeagueRankingList } from "@/components/features/league/LeagueRankingList";
import { LeagueTiersDialog } from "@/components/features/league/LeagueTiersDialog";
import { TopAppBar } from "@/components/home/TopAppBar";
import { useAuth } from "@/hooks/useAuth";
import { getLeague } from "@/lib/api/resources/gamification";
import { LEAGUE_TIER_ICONS, LEAGUE_TIER_LABELS, nextTierDivision, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { colors, spacing, type } from "@/theme/tokens";
import type { League } from "@/types/api";

// Espelha apps/web/src/app/(shell)/liga/page.tsx. Redesenhado pra hierarquia de 10 ligas x 3
// divisões (Madeira → Diamante): cabeçalho com ícone/nome/divisão, trilha de progressão
// horizontal com as 10 ligas, e o ranking semanal da divisão atual.
export default function LigaScreen() {
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [tiersDialogOpen, setTiersDialogOpen] = useState(false);
  const [dialogInitialTier, setDialogInitialTier] = useState<LeagueTierName | undefined>();

  useEffect(() => {
    let cancelled = false;
    getLeague().then((result) => {
      if (!cancelled) setLeague(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tier = (league?.tier ?? "madeira") as LeagueTierName;
  const tierLabel = LEAGUE_TIER_LABELS[tier];
  const next = league ? nextTierDivision(tier, league.division) : null;

  const description = next
    ? `Os ${league?.promotion_slots ?? 3} melhores avançam para a Liga ${LEAGUE_TIER_LABELS[next.tier]} ${next.division}. Compita aprendendo!`
    : "Você está na posição mais alta da hierarquia. Compita aprendendo!";

  const openTiersDialog = (initialTier?: LeagueTierName) => {
    setDialogInitialTier(initialTier);
    setTiersDialogOpen(true);
  };

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => openTiersDialog(undefined)} style={styles.badge}>
            <Icon name={LEAGUE_TIER_ICONS[tier]} size={44} color={colors.secondary} />
          </Pressable>
          <Text style={[type.displayLg, styles.title]}>
            Liga {tierLabel} {league?.division ?? 3}
          </Text>
          <Text style={[type.bodyMd, styles.caption]}>{description}</Text>
          <View style={styles.countdown}>
            <Text style={[type.labelCaps, styles.countdownLabel]}>Tempo Restante</Text>
            <Text style={[type.questionLg, styles.countdownValue]}>2d 14h 32m</Text>
          </View>
        </View>

        <LeagueProgressionTrack currentTier={tier} onSelectTier={(t) => openTiersDialog(t)} />

        {league && (
          <LeagueRankingList
            ranking={league.ranking}
            currentUserId={user.id}
            promotionSlots={league.promotion_slots}
            demotionSlots={league.demotion_slots}
          />
        )}
      </ScrollView>
      {league && (
        <LeagueTiersDialog
          open={tiersDialogOpen}
          onOpenChange={setTiersDialogOpen}
          currentUserId={user.id}
          ownLeague={league}
          initialTier={dialogInitialTier}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 4,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  caption: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 320,
  },
  countdown: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  countdownLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  countdownValue: {
    color: colors.primary,
    fontWeight: "700",
  },
});
