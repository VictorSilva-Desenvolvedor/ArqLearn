import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { AchievementBadge } from "./AchievementBadge";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { Achievement } from "@/types/api";

// Quantas conquistas ficam visíveis antes de "Ver todas" — 3 linhas do grid de 3 colunas.
const COLLAPSED_COUNT = 9;

// Espelha apps/web/src/components/features/profile/AchievementGrid.tsx (grid de 3 colunas via
// linhas manuais, RN não tem CSS grid), inclusive o recolhimento: o catálogo tem 44 conquistas e
// renderizar todas enchia o perfil com ~40 selos "Bloqueada" idênticos, enterrando as
// desbloqueadas.
export function AchievementGrid({ unlocked }: { unlocked: Achievement[] }) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const unlockedAtByType = new Map(unlocked.map((a) => [a.type, a.unlocked_at]));

  const entries = Object.entries(achievementCatalog);
  const unlockedEntries = entries.filter(([type_]) => unlockedAtByType.has(type_));
  const lockedEntries = entries.filter(([type_]) => !unlockedAtByType.has(type_));
  const visible = expanded
    ? entries
    : [...unlockedEntries, ...lockedEntries].slice(0, COLLAPSED_COUNT);
  const hasMore = entries.length > COLLAPSED_COUNT;

  const rows: (typeof entries)[number][][] = [];
  for (let i = 0; i < visible.length; i += 3) {
    rows.push(visible.slice(i, i + 3));
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={[type.headlineMd, styles.title]}>Conquistas</Text>
        <Text style={[type.labelCaps, styles.count]}>
          {unlockedEntries.length} de {entries.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map(([type_, entry]) => (
              <AchievementBadge
                key={type_}
                entry={entry}
                unlocked={unlockedAtByType.has(type_)}
                unlockedAt={unlockedAtByType.get(type_)}
              />
            ))}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, i) => <View key={`spacer-${i}`} style={styles.spacer} />)}
          </View>
        ))}
      </View>
      {hasMore && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={styles.toggle}
        >
          <Text style={[type.labelCaps, styles.toggleLabel]}>
            {expanded ? "Ver menos" : `Ver todas (${entries.length})`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 8,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    count: {
      color: colors.onSurfaceVariant,
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
    toggle: {
      marginTop: 16,
      paddingVertical: 8,
      alignItems: "center",
    },
    toggleLabel: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
