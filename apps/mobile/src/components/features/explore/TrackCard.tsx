import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";
import type { RecommendedTrack } from "@/lib/api/mocks/fixtures/exploreTracks";

interface TrackCardProps extends RecommendedTrack {
  isSelectedTheme?: boolean;
}

// Espelha apps/web/src/components/features/explore/TrackCard.tsx.
export function TrackCard({ track, difficulty, durationMinutes, icon, isSelectedTheme }: TrackCardProps) {
  return (
    <Card padding="md" radius="lg" style={[styles.card, isSelectedTheme && styles.selected]}>
      {isSelectedTheme && (
        <View style={styles.badgeWrap}>
          <Badge tone="primary">Selecionado</Badge>
        </View>
      )}
      <Icon name={icon} size={28} color={colors.primary} />
      <Text style={[type.questionSm, styles.title]}>{track.title}</Text>
      <View style={styles.meta}>
        <Badge tone="primary">{difficulty}</Badge>
        <View style={styles.duration}>
          <Icon name="schedule" size={16} color={colors.onSurfaceVariant} />
          <Text style={[type.bodySm, styles.durationText]}>{durationMinutes}min</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 8,
    position: "relative",
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  badgeWrap: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  duration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    color: colors.onSurfaceVariant,
  },
});
