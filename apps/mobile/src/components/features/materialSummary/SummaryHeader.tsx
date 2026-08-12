import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { colors, spacing, type } from "@/theme/tokens";

interface SummaryHeaderProps {
  title: string;
  eyebrow?: string;
}

// Espelha apps/web/src/components/features/materialSummary/SummaryHeader.tsx.
export function SummaryHeader({ title, eyebrow = "Resumo Inteligente" }: SummaryHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <IconButton icon={<Icon name="back" />} label="Voltar" onPress={() => router.back()} />
      <View style={styles.textBlock}>
        <Text style={[type.labelCaps, styles.eyebrow]}>{eyebrow}</Text>
        <Text style={[type.questionLg, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceBright,
  },
  textBlock: {
    flex: 1,
  },
  eyebrow: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
});
