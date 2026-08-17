import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AchievementGrid } from "@/components/features/profile/AchievementGrid";
import { LogoutMenuLink } from "@/components/features/profile/LogoutMenuLink";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { ProfileMenuLink } from "@/components/features/profile/ProfileMenuLink";
import { ProfileStatsGrid } from "@/components/features/profile/ProfileStatsGrid";
import { ProgressSummaryCard } from "@/components/features/profile/ProgressSummaryCard";
import { StreakFreezeCard } from "@/components/features/profile/StreakFreezeCard";
import { TopAppBar } from "@/components/home/TopAppBar";
import { useAuth } from "@/hooks/useAuth";
import { getGamificationProfile } from "@/lib/api/resources/gamification";
import { getProgressSummary } from "@/lib/api/resources/progress";
import { colors, spacing } from "@/theme/tokens";
import type { Achievement, ProgressSummary } from "@/types/api";

// Espelha apps/web/src/app/(shell)/perfil/page.tsx — sem o ramo de professor/admin do web
// (fora de escopo do mobile, ver Docs/PENDENCIAS_MOBILE.md).
export default function PerfilScreen() {
  const { user, gamification } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGamificationProfile(), getProgressSummary()]).then(([gamificationMe, progressSummary]) => {
      if (cancelled) return;
      setAchievements(gamificationMe.achievements);
      setProgress(progressSummary);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader
          name={user.name}
          level={gamification.level}
          xpTotal={gamification.xp_total}
          vip={gamification.is_vip}
        />
        <ProfileStatsGrid
          xpTotal={gamification.xp_total}
          level={gamification.level}
          streakCurrent={gamification.streak_current}
          streakBest={gamification.streak_best}
          gems={gamification.gems}
        />
        {progress && <ProgressSummaryCard summary={progress} />}
        <StreakFreezeCard />
        {achievements && <AchievementGrid unlocked={achievements} />}
        <View style={styles.menu}>
          <ProfileMenuLink href="/loja" icon="storefront" label="Loja" />
          <ProfileMenuLink href="/ajuda" icon="help" label="Ajuda e Bugs" />
          <ProfileMenuLink href="/perfil/configuracoes" icon="settings" label="Configurações" />
          <LogoutMenuLink />
        </View>
      </ScrollView>
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
    gap: spacing.lg,
  },
  menu: {
    gap: spacing.xs,
  },
});
