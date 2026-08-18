import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface InfiniteModeHeaderProps {
  topicLabel: string;
  current: number;
  total: number;
  level: number;
}

// Espelha apps/web/src/components/features/infiniteMode/InfiniteModeHeader.tsx — mais simples que
// QuizHeader: sem hearts, sem gems, sem toggle de download.
export function InfiniteModeHeader({ topicLabel, current, total, level }: InfiniteModeHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <IconButton
          icon={<Icon name="close" />}
          label="Sair do Modo Infinito"
          onPress={() => router.push("/explorar")}
        />
        <Text style={[type.questionSm, styles.title]} numberOfLines={1}>
          Modo Infinito: {topicLabel}
        </Text>
        <Badge tone="primary">{`Nível ${level}`}</Badge>
        <Badge tone="error">Dificuldade Elevada</Badge>
      </View>
      <View style={styles.progressRow}>
        <ProgressBar value={current} max={total} variant="thin" tone="secondary" style={styles.progress} />
        <Text style={[type.bodySm, styles.progressText]}>
          {current}/{total}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: colors.outlineVariant,
      backgroundColor: colors.surfaceBright,
      gap: spacing.xs,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: "700",
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    progress: {
      flex: 1,
    },
    progressText: {
      color: colors.onSurfaceVariant,
    },
  });
