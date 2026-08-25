import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { radius, type } from "@/theme/tokens";
import { formatRelativeTime } from "@/lib/utils/format";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { AppNotification, NotificationType } from "@/types/api";

// `tile` é o fundo tingido atrás do glifo — mesma decisão do web (a referência do Stitch põe cada
// ícone num quadrado arredondado da cor semântica do tipo, e é isso que faz a lista ser
// escaneável de relance).
//
// O glifo usa `on*FixedVariant`, não `primary`/`secondary`/`tertiary`: as variantes `*Fixed` são
// iguais nos dois temas por definição do Material 3 (ver comentário em theme/tokens.ts), então no
// tema escuro `colors.primary` (#a4caea, claro) sobre `colors.primaryFixed` (#d1e4ff, claro) daria
// ~1.3:1. Os pares on*Fixed*/`*Fixed` são os únicos que se mantêm legíveis nos dois temas.
const createTypeConfig = (
  colors: ColorTokens,
): Record<NotificationType, { icon: IconName; color: string; tile: string }> => ({
  streak_at_risk: { icon: "streak", color: colors.onErrorContainer, tile: colors.errorContainer },
  league_promotion: { icon: "militaryTech", color: colors.onPrimaryFixedVariant, tile: colors.primaryFixed },
  league_demotion: { icon: "trendingDown", color: colors.onErrorContainer, tile: colors.errorContainer },
  new_challenge: { icon: "bolt", color: colors.onSecondaryFixedVariant, tile: colors.secondaryFixed },
  questions_ready_for_review: { icon: "factCheck", color: colors.onTertiaryFixedVariant, tile: colors.tertiaryFixed },
  welcome: { icon: "logo", color: colors.onSurfaceVariant, tile: colors.surfaceContainer },
  bug_fixed: { icon: "bugReport", color: colors.onTertiaryFixedVariant, tile: colors.tertiaryFixed },
  suggestion_implemented: { icon: "lightbulb", color: colors.onSecondaryFixedVariant, tile: colors.secondaryFixed },
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

  const relativeTime = formatRelativeTime(notification.created_at);

  const content = (
    <Card padding="sm" radius="md" style={[styles.card, isHighlighted && styles.highlighted, notification.read && styles.read]}>
      <View
        style={[
          styles.tile,
          // O card destacado já é primaryFixed — o tile precisa de um tom a mais para não sumir
          // dentro dele.
          { backgroundColor: isHighlighted ? colors.primaryFixedDim : config.tile },
        ]}
      >
        <Icon name={config.icon} size={24} color={config.color} />
      </View>
      <Text style={[type.bodyMd, styles.message]}>{notification.message}</Text>
      <View style={styles.meta}>
        <Text style={[type.labelCaps, styles.time]}>{relativeTime}</Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </Card>
  );

  const accessibilityLabel = notification.read
    ? `${notification.message}, ${relativeTime}`
    : `${notification.message}, ${relativeTime}, não lida`;

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
      alignItems: "flex-start",
      gap: 12,
    },
    tile: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    meta: {
      alignItems: "flex-end",
      gap: 6,
    },
    time: {
      color: colors.onSurfaceVariant,
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
