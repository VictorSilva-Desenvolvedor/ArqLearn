import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { NotificationList } from "@/components/features/notifications/NotificationList";
import { NotificationPreferencesPanel } from "@/components/features/notifications/NotificationPreferencesPanel";
import { findCurrentLessonHref } from "@/lib/gamification/currentLesson";
import { listNotifications } from "@/lib/api/resources/notifications";
import { colors, spacing, type } from "@/theme/tokens";
import type { AppNotification } from "@/types/api";

// Espelha apps/web/src/app/(shell)/notificacoes/page.tsx.
export default function NotificacoesScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [currentLessonHref, setCurrentLessonHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listNotifications().then(async ({ data }) => {
      if (cancelled) return;
      setNotifications(data);
      const hasStreakAlert = data.some((n) => n.type === "streak_at_risk");
      if (hasStreakAlert) {
        const href = await findCurrentLessonHref();
        if (!cancelled) setCurrentLessonHref(href);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[type.displayLg, styles.headerTitle]}>Notificações</Text>
        </View>
        <NotificationPreferencesPanel />
        {notifications && <NotificationList notifications={notifications} currentLessonHref={currentLessonHref} />}
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
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
});
