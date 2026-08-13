import { StyleSheet, Text, View } from "react-native";
import { NotificationItem } from "./NotificationItem";
import { colors, spacing, type } from "@/theme/tokens";
import type { AppNotification } from "@/types/api";

interface NotificationListProps {
  notifications: AppNotification[];
  // Deep-link pra lição sugerida — só se aplica a notificações do tipo streak_at_risk.
  currentLessonHref?: string | null;
}

// Espelha apps/web/src/components/features/notifications/NotificationList.tsx.
export function NotificationList({ notifications, currentLessonHref }: NotificationListProps) {
  if (notifications.length === 0) {
    return <Text style={[type.bodySm, styles.empty]}>Nenhuma notificação por enquanto.</Text>;
  }

  return (
    <View style={styles.list}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          href={notification.type === "streak_at_risk" ? (currentLessonHref ?? undefined) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  empty: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
