import { StyleSheet, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface DiagramCardProps {
  caption: string;
}

// Placeholder honesto: o material enviado pelo usuário não tem um diagrama gerado disponível no
// mock (o pipeline de IA que geraria isso ainda é stub no backend) — mostra um espaço reservado
// identificado, em vez de inventar uma imagem. Espelha
// apps/web/src/components/features/materialSummary/DiagramCard.tsx.
export function DiagramCard({ caption }: DiagramCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Card padding="lg" radius="lg" style={styles.card}>
      <Icon name="diagram" size={48} color={colors.outline} />
      <Text style={[type.labelCaps, styles.caption]}>{caption}</Text>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      minHeight: 192,
      backgroundColor: colors.surfaceGray,
    },
    caption: {
      color: colors.onSurfaceVariant,
      textTransform: "uppercase",
      textAlign: "center",
    },
  });
