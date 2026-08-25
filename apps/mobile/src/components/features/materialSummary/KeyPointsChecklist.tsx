import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { UploadSummaryKeyPoint } from "@/types/api";

interface KeyPointsChecklistProps {
  points: UploadSummaryKeyPoint[];
}

// Espelha apps/web/src/components/features/materialSummary/KeyPointsChecklist.tsx.
export function KeyPointsChecklist({ points }: KeyPointsChecklistProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon name="factCheck" size={24} color={colors.primary} />
        <Text style={[type.headlineMd, styles.title]}>O que você precisa saber</Text>
      </View>
      {/* Superfície opaca (auditoria de 25/08/2026, rodada 4 — mesma correção do web): esta é a
          tela de leitura mais longa do app e o texto ficava direto sobre o fundo blueprint. A
          referência do Stitch também agrupa os pontos-chave num card branco com divisores. */}
      <Card padding="md" radius="lg">
        {points.map((point, index) => (
          <View key={point.title} style={[styles.row, index > 0 && styles.rowDivided]}>
            {/* Marcador de item de lista, não estado de sucesso: verde é reservado a
                sucesso/validação pela One Job Per Color Rule (DESIGN.md). */}
            <Icon name="taskAlt" size={24} color={colors.primary} />
            <View style={styles.textBlock}>
              <Text style={[type.bodyLgBold, styles.pointTitle]}>{point.title}</Text>
              <Text style={[type.bodyMd, styles.explanation]}>{point.explanation}</Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      color: colors.onSurface,
      flex: 1,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    rowDivided: {
      borderTopWidth: 2,
      borderTopColor: colors.outlineVariant,
      marginTop: spacing.md,
      paddingTop: spacing.md,
    },
    textBlock: {
      flex: 1,
    },
    pointTitle: {
      color: colors.onSurface,
    },
    explanation: {
      color: colors.onSurfaceVariant,
    },
  });
