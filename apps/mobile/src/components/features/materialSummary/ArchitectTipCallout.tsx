import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ArchitectTipCalloutProps {
  tip: string;
}

// Espelha apps/web/src/components/features/materialSummary/ArchitectTipCallout.tsx.
export function ArchitectTipCallout({ tip }: ArchitectTipCalloutProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Card padding="md" radius="lg" bordered={false} style={styles.card}>
      <Icon name="lightbulb" size={24} color={colors.secondary} />
      <View style={styles.textBlock}>
        <Text style={[type.labelCaps, styles.label]}>Dica do Arquiteto</Text>
        <Text style={[type.bodyMd, styles.tip]}>{tip}</Text>
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      backgroundColor: colors.secondaryFixed,
    },
    textBlock: {
      flex: 1,
    },
    label: {
      color: colors.onSecondaryFixedVariant,
      textTransform: "uppercase",
    },
    tip: {
      color: colors.onSecondaryFixed,
    },
  });
