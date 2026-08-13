import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { LeagueRankingList } from "@/components/features/league/LeagueRankingList";
import { useAuth } from "@/hooks/useAuth";
import { getLeague } from "@/lib/api/resources/gamification";
import { colors, spacing, type } from "@/theme/tokens";
import type { League } from "@/types/api";

const tierLabel: Record<string, string> = {
  bronze: "Liga Bronze",
  prata: "Liga Prata",
  ouro: "Liga Ouro",
  platina: "Liga Platina",
  diamante: "Liga Diamante",
};

// Espelha apps/web/src/app/(shell)/liga/page.tsx.
export default function LigaScreen() {
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeague().then((result) => {
      if (!cancelled) setLeague(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="trophy" size={36} color={colors.secondary} />
          <View style={styles.headerText}>
            <Text style={[type.displayLg, styles.title]}>{tierLabel[league?.tier ?? ""] ?? "Liga"}</Text>
            <Text style={[type.bodySm, styles.caption]}>
              Os 10 melhores avançam de liga. Os 5 piores caem para a liga anterior.
            </Text>
          </View>
        </View>
        <Text style={[type.bodySm, styles.countdown]}>
          Encerra em: <Text style={styles.countdownValue}>2d 14h 32m</Text>
        </Text>
        {league && <LeagueRankingList ranking={league.ranking} currentUserId={user.id} />}
      </ScrollView>
    </SafeAreaView>
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
