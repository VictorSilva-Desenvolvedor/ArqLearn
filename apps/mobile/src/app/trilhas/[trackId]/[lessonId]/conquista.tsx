import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { colors, radius, spacing, type as typeTokens } from "@/theme/tokens";
import type { AchievementType } from "@/types/api";

// Tela própria de transição (spec §C: "If an achievement was unlocked, transition to Achievement
// screen"). Espelha apps/web/src/app/(lesson)/trilhas/[trackId]/[lessonId]/conquista/page.tsx.
export default function AchievementScreen() {
  const router = useRouter();
  const { type: achievementType } = useLocalSearchParams<{ type: AchievementType }>();
  const { gamification, updateGamification } = useAuth();
  const entry = achievementType ? achievementCatalog[achievementType] : undefined;

  // Credita a recompensa uma única vez ao entrar na tela.
  const creditedRef = useRef(false);
  useEffect(() => {
    if (!entry || creditedRef.current) return;
    creditedRef.current = true;
    updateGamification({
      xp_total: gamification.xp_total + entry.xp_reward,
      gems: gamification.gems + entry.gems_reward,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar uma vez ao montar; gamification.* mudaria a cada crédito e recriaria o efeito
  }, [entry, updateGamification]);

  if (!entry) {
    router.replace("/");
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <View style={styles.badgeIconCounterRotate}>
            <Icon name={entry.icon} size={48} color={colors.onSecondary} />
          </View>
        </View>
        <View style={styles.textBlock}>
          <Text style={[typeTokens.labelCaps, styles.eyebrow]}>Conquista desbloqueada</Text>
          <Text style={[typeTokens.headlineMd, styles.title]}>{entry.title}</Text>
          <Text style={[typeTokens.bodyMd, styles.description]}>{entry.description}</Text>
        </View>
        <View style={styles.rewards}>
          <View style={styles.rewardChip}>
            <Icon name="bolt" size={20} color={colors.secondary} />
            <Text style={[typeTokens.statsNum, styles.rewardText]}>+{entry.xp_reward} XP</Text>
          </View>
          <View style={styles.rewardChip}>
            <Icon name="gems" size={20} color={colors.secondary} />
            <Text style={[typeTokens.statsNum, styles.rewardText]}>+{entry.gems_reward} gemas</Text>
          </View>
        </View>
        <Button variant="primary" fullWidth onPress={() => router.push("/")}>
          Continuar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 448,
    alignItems: "center",
    gap: spacing.lg,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  badgeIconCounterRotate: {
    transform: [{ rotate: "-45deg" }],
  },
  textBlock: {
    alignItems: "center",
  },
  eyebrow: {
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: "center",
  },
  rewards: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    color: colors.secondary,
  },
});
