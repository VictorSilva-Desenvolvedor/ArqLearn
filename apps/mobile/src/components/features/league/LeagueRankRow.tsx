import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import { colors, type } from "@/theme/tokens";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
}

// Espelha apps/web/src/components/features/league/LeagueRankRow.tsx — lá a linha não reage ao
// clique (não existe tela de perfil público de outro usuário em nenhum dos dois apps ainda);
// aqui o toque mostra um toast com nome+XP da semana, em vez de ficar mudo.
export function LeagueRankRow({ entry, isCurrentUser }: LeagueRankRowProps) {
  const { showToast } = useToast();

  return (
    <Pressable
      style={[styles.row, isCurrentUser && styles.currentUserRow]}
      onPress={() =>
        showToast(
          isCurrentUser
            ? `Você está em ${entry.position}º lugar com ${entry.xp_this_week} XP essa semana.`
            : `${entry.name} está em ${entry.position}º lugar com ${entry.xp_this_week} XP essa semana.`,
          "success",
        )
      }
    >
      <Text style={[type.bodySm, styles.position]}>{entry.position}</Text>
      <Avatar name={entry.name} size={32} />
      <Text style={[type.bodyLg, styles.name]} numberOfLines={1}>
        {isCurrentUser ? "Você" : entry.name}
      </Text>
      <Text style={[type.bodySm, styles.xp]}>{entry.xp_this_week} XP</Text>
    </Pressable>
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
