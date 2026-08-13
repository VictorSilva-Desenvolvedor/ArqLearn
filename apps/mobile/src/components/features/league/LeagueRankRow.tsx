import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { colors, type } from "@/theme/tokens";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
}

// Espelha apps/web/src/components/features/league/LeagueRankRow.tsx.
export function LeagueRankRow({ entry, isCurrentUser }: LeagueRankRowProps) {
  return (
    <View style={[styles.row, isCurrentUser && styles.currentUserRow]}>
      <Text style={[type.bodySm, styles.position]}>{entry.position}</Text>
      <Avatar name={entry.name} size={32} />
      <Text style={[type.bodyLg, styles.name]} numberOfLines={1}>
        {isCurrentUser ? "Você" : entry.name}
      </Text>
      <Text style={[type.bodySm, styles.xp]}>{entry.xp_this_week} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  currentUserRow: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  position: {
    width: 24,
    color: colors.onSurfaceVariant,
    fontWeight: "700",
  },
  name: {
    flex: 1,
    color: colors.onSurface,
  },
  xp: {
    color: colors.primary,
    fontWeight: "700",
  },
});
