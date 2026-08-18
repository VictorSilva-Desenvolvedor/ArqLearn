import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ChestProgressCardProps {
  title: string;
  questionsCurrent: number;
  questionsRequired: number;
  available: boolean;
  claimed: boolean;
  onPress: () => void;
}

// Cards de progresso do Baú Diário/Semanal na Home (a pedido do usuário, mockup Stitch com os dois
// baús lado a lado) — sempre visíveis (não só quando disponível), pra dar visibilidade contínua do
// progresso. Toque sempre navega, mesmo indisponível: leva pra /bau, que já trata o estado "ainda
// não disponível" (mensagem + botão voltar), então não é um beco sem saída. Espelha
// apps/web/.../ChestProgressCard.tsx. Sem `disabled` no Pressable — mesma armadilha de scroll já
// corrigida em Button.tsx/ThemeSelector.tsx (este card vive numa Home com ScrollView).
export function ChestProgressCard({
  title,
  questionsCurrent,
  questionsRequired,
  available,
  claimed,
  onPress,
}: ChestProgressCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const statusLabel = available
    ? "Disponível!"
    : claimed
      ? "Já resgatado"
      : `${Math.min(questionsCurrent, questionsRequired)}/${questionsRequired} questões`;

  return (
    <Pressable
      style={styles.flex}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${statusLabel}`}
    >
      <Card
        radius="xl"
        style={[styles.card, { borderColor: available ? colors.secondary : colors.primary }]}
      >
        <Icon name="chest" size={32} color={available ? colors.secondary : colors.primary} />
        <View style={styles.textBlock}>
          <Text style={[type.bodyMdBold, styles.title]}>{title}</Text>
          <Text style={[type.statsNum, styles.status]}>{statusLabel}</Text>
        </View>
        <ProgressBar value={questionsCurrent} max={questionsRequired} variant="thin" tone="secondary" />
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    card: {
      alignItems: "center",
      gap: 8,
    },
    textBlock: {
      alignItems: "center",
    },
    title: {
      color: colors.primary,
    },
    status: {
      color: colors.secondary,
      fontSize: 14,
    },
  });
