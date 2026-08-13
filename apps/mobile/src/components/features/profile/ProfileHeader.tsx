import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { levelTitleFor } from "@/lib/gamification/levelTitle";
import { xpForLevel } from "@/lib/api/mocks/fixtures/levelCurve";
import { colors, type } from "@/theme/tokens";

interface ProfileHeaderProps {
  name: string;
  level: number;
  xpTotal: number;
}

// Espelha apps/web/src/components/features/profile/ProfileHeader.tsx.
export function ProfileHeader({ name, level, xpTotal }: ProfileHeaderProps) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xpTotal - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <View style={styles.container}>
      <Avatar name={name} size={96} />
      <View style={styles.textBlock}>
        <Text style={[type.headlineMd, styles.name]}>{name}</Text>
        <Text style={[type.labelCaps, styles.subtitle]}>
          Nível {level} • {levelTitleFor(level)}
        </Text>
        <ProgressBar value={xpIntoLevel} max={xpNeededForLevel} variant="thin" tone="secondary" style={styles.progress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
  },
  textBlock: {
    width: "100%",
    maxWidth: 256,
    alignItems: "center",
  },
  name: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  progress: {
    marginTop: 12,
  },
});
