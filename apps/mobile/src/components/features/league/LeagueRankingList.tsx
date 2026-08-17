import { StyleSheet, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { LeagueRankRow } from "./LeagueRankRow";
import { LeagueZoneBanner } from "./LeagueZoneBanner";
import type { LeagueRankingEntry } from "@/types/api";

interface LeagueRankingListProps {
  ranking: LeagueRankingEntry[];
  currentUserId: string;
  promotionSlots?: number;
  demotionSlots?: number;
}

// Espelha apps/web/src/components/features/league/LeagueRankingList.tsx. promotionSlots/
// demotionSlots vêm da própria resposta da API (league.promotion_slots/demotion_slots) em vez de
// valores mockados fixos — a hierarquia de 10 ligas x 3 divisões usa 3, não os 5 antigos.
export function LeagueRankingList({ ranking, currentUserId, promotionSlots = 3, demotionSlots = 3 }: LeagueRankingListProps) {
  const demotionStartsAt = ranking.length - demotionSlots + 1;

  return (
    <Card padding="sm" radius="lg" style={styles.card}>
      {ranking.map((entry, index) => (
        <View key={entry.user_id}>
          {index === 0 && <LeagueZoneBanner kind="promotion" />}
          {entry.position === demotionStartsAt && <LeagueZoneBanner kind="demotion" />}
          <LeagueRankRow
            entry={entry}
            isCurrentUser={entry.user_id === currentUserId}
            inPromotionZone={entry.position <= promotionSlots}
          />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
});
