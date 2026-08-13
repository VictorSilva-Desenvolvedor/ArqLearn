import { StyleSheet, Text, View } from "react-native";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { AchievementBadge } from "./AchievementBadge";
import { colors, type } from "@/theme/tokens";
import type { Achievement } from "@/types/api";

// Espelha apps/web/src/components/features/profile/AchievementGrid.tsx (grid de 3 colunas via
// linhas manuais, RN não tem CSS grid).
export function AchievementGrid({ unlocked }: { unlocked: Achievement[] }) {
  const unlockedTypes = new Set(unlocked.map((a) => a.type));
  const entries = Object.entries(achievementCatalog);
  const rows: (typeof entries)[number][][] = [];
  for (let i = 0; i < entries.length; i += 3) {
    rows.push(entries.slice(i, i + 3));
  }

  return (
    <View>
      <Text style={[type.headlineMd, styles.title]}>Conquistas</Text>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map(([type_, entry]) => (
              <AchievementBadge key={type_} entry={entry} unlocked={unlockedTypes.has(type_)} />
            ))}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, i) => <View key={`spacer-${i}`} style={styles.spacer} />)}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    marginBottom: 8,
  },
  grid: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  spacer: {
    flex: 1,
  },
});
