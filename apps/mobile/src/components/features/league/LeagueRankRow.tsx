import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import { colors, type } from "@/theme/tokens";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankRowProps {
  entry: LeagueRankingEntry;
  isCurrentUser: boolean;
  // Top N (promotion_slots) da divisão — destaque em tertiary (verde), espelhando o mockup de
  // referência do usuário (posição/avatar em destaque pra quem já avançaria de divisão).
  inPromotionZone?: boolean;
}

// Espelha apps/web/src/components/features/league/LeagueRankRow.tsx — lá a linha não reage ao
// clique (não existe tela de perfil público de outro usuário em nenhum dos dois apps ainda);
// aqui o toque mostra um toast com nome+XP da semana, em vez de ficar mudo.
export function LeagueRankRow({ entry, isCurrentUser, inPromotionZone }: LeagueRankRowProps) {
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
      <Text style={[type.bodySm, styles.position, inPromotionZone && styles.positionPromotion]}>
        {entry.position}
      </Text>
      <View style={[styles.avatarWrap, inPromotionZone && styles.avatarWrapPromotion]}>
        <Avatar name={entry.name} size={32} />
      </View>
      <Text style={[type.bodyLg, styles.name]} numberOfLines={1}>
        {isCurrentUser ? "Você" : entry.name}
      </Text>
      <Text style={[type.bodySm, styles.xp, inPromotionZone && styles.xpPromotion]}>{entry.xp_this_week} XP</Text>
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
    textAlign: "center",
  },
  positionPromotion: {
    color: colors.tertiary,
  },
  avatarWrap: {
    borderRadius: 9999,
  },
  avatarWrapPromotion: {
    borderWidth: 2,
    borderColor: colors.tertiary,
  },
  name: {
    flex: 1,
    color: colors.onSurface,
  },
  xp: {
    color: colors.primary,
    fontWeight: "700",
  },
  xpPromotion: {
    color: colors.tertiary,
  },
});
