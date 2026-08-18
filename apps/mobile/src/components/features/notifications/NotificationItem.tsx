import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { AppNotification, NotificationType } from "@/types/api";

const createTypeConfig = (
  colors: ColorTokens,
): Record<NotificationType, { icon: IconName; color: string }> => ({
  streak_at_risk: { icon: "streak", color: colors.errorRed },
  league_promotion: { icon: "militaryTech", color: colors.primary },
  league_demotion: { icon: "trendingDown", color: colors.errorRed },
  new_challenge: { icon: "bolt", color: colors.secondary },
  questions_ready_for_review: { icon: "factCheck", color: colors.tertiary },
  welcome: { icon: "logo", color: colors.onSurfaceVariant },
  bug_fixed: { icon: "bugReport", color: colors.tertiary },
  suggestion_implemented: { icon: "lightbulb", color: colors.secondary },
});

interface NotificationItemProps {
  notification: AppNotification;
  // Só streak_at_risk tem destino definido pelo spec ("deep-link direto pra lição sugerida") —
  // os outros tipos não têm um alvo especificado, então continuam não-clicáveis.
  href?: string;
}

// Espelha apps/web/src/components/features/notifications/NotificationItem.tsx.
export function NotificationItem({ notification, href }: NotificationItemProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const typeConfig = createTypeConfig(colors);
  const config = typeConfig[notification.type];
  const isHighlighted = notification.type === "league_promotion" && !notification.read;

  const content = (
    <Card padding="sm" radius="md" style={[styles.card, isHighlighted && styles.highlighted, notification.read && styles.read]}>
      <Icon name={config.icon} size={24} color={config.color} />
      <Text style={[type.bodyMd, styles.message]}>{notification.message}</Text>
      {!notification.read && <View style={styles.unreadDot} />}
    </Card>
  );

  const accessibilityLabel = notification.read
    ? notification.message
    : `${notification.message}, não lida`;

  if (href) {
    return (
      <Pressable onPress={() => router.push(href as never)} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    highlighted: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryFixed,
    },
    read: {
      opacity: 0.6,
    },
    message: {
      flex: 1,
      color: colors.onSurface,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  });
