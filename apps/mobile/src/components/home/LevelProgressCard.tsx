import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { xpMinimoDoNivel } from "@/lib/gamification/level";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface LevelProgressCardProps {
  level: number;
  xpTotal: number;
}

// Espelha apps/web/src/components/features/home/LevelProgressCard.tsx (DESIGN.md "XP Bar") — não
// existia no mobile Home ainda, só no web.
export function LevelProgressCard({ level, xpTotal }: LevelProgressCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const currentLevelXp = xpMinimoDoNivel(level);
  const nextLevelXp = xpMinimoDoNivel(level + 1);
  const xpIntoLevel = Math.max(0, xpTotal - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.badge}>
        <Text style={[type.statsNum, styles.badgeText]}>{level}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[type.labelCaps, styles.label]}>Nível {level}</Text>
          <Text style={[type.bodySm, styles.xpText]}>
            {xpIntoLevel} / {xpNeededForLevel} XP
          </Text>
        </View>
        <ProgressBar value={xpIntoLevel} max={xpNeededForLevel} variant="tube" tone="secondary" style={styles.progress} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 32,
    },
    badge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: colors.onSecondary,
    },
    content: {
      flex: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    label: {
      color: colors.onSurfaceVariant,
    },
    xpText: {
      color: colors.onSurfaceVariant,
    },
    progress: {
      marginTop: 0,
    },
  });
