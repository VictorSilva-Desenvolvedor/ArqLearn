import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { LeagueRankingList } from "@/components/features/league/LeagueRankingList";
import { LeagueTiersDialog } from "@/components/features/league/LeagueTiersDialog";
import { TopAppBar } from "@/components/home/TopAppBar";
import { useAuth } from "@/hooks/useAuth";
import { getLeague } from "@/lib/api/resources/gamification";
import { LEAGUE_TIER_LABELS } from "@/lib/gamification/leagueTiers";
import { colors, spacing, type } from "@/theme/tokens";
import type { League } from "@/types/api";

// Espelha apps/web/src/app/(shell)/liga/page.tsx. O cabeçalho abria um toast informativo antes —
// agora abre o LeagueTiersDialog, que mostra o mesmo texto de regra e adiciona quanto falta pra
// promoção + navegação pelo top 50 de qualquer liga (dado real, GET /v1/gamification/league).
export default function LigaScreen() {
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [tiersDialogOpen, setTiersDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeague().then((result) => {
      if (!cancelled) setLeague(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tierLabel = LEAGUE_TIER_LABELS[league?.tier ?? ""] ?? "Liga";

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.header} onPress={() => setTiersDialogOpen(true)} disabled={!league}>
          <Icon name="trophy" size={36} color={colors.secondary} />
          <View style={styles.headerText}>
            <Text style={[type.displayLg, styles.title]}>{tierLabel}</Text>
            <Text style={[type.bodySm, styles.caption]}>
              Os {league?.promotion_slots ?? 5} melhores avançam de liga. Os {league?.demotion_slots ?? 5} piores
              caem para a liga anterior.
            </Text>
          </View>
        </Pressable>
        <Text style={[type.bodySm, styles.countdown]}>
          Encerra em: <Text style={styles.countdownValue}>2d 14h 32m</Text>
        </Text>
        {league && <LeagueRankingList ranking={league.ranking} currentUserId={user.id} />}
      </ScrollView>
      {league && (
        <LeagueTiersDialog
          open={tiersDialogOpen}
          onOpenChange={setTiersDialogOpen}
          currentUserId={user.id}
          ownLeague={league}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  caption: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  countdown: {
    color: colors.onSurfaceVariant,
  },
  countdownValue: {
    color: colors.primary,
    fontWeight: "700",
  },
});
