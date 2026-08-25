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
  // variant (TDD §10.3): "review" troca título/selo/rótulo de saída pra refletir a fila de
  // revisão do SRS ("Revisar agora") em vez do Modo Infinito por tópico — mesmo componente, sem
  // duplicar a tela inteira.
  variant?: "infinite" | "review";
}

// Espelha apps/web/src/components/features/infiniteMode/InfiniteModeHeader.tsx — mais simples que
// QuizHeader: sem hearts, sem gems, sem toggle de download.
export function InfiniteModeHeader({ topicLabel, current, total, level, variant = "infinite" }: InfiniteModeHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const isReview = variant === "review";

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <IconButton
          icon={<Icon name="close" />}
          label={isReview ? "Sair da Revisão" : "Sair do Modo Infinito"}
          onPress={() => router.push("/explorar")}
        />
        <Text style={[type.questionSm, styles.title]} numberOfLines={1}>
          {isReview ? "Revisão" : `Modo Infinito: ${topicLabel}`}
        </Text>
      </View>
      {/* Selos em linha própria (auditoria de 25/08/2026, rodada 4). No web o título quebrava em
          3 linhas ao dividir a linha com os dois selos; aqui o `numberOfLines={1}` transformava o
          mesmo aperto em truncamento — sobravam ~90px e o nome do tema, que é o assunto da tela,
          sumia atrás das reticências. Largura de telefone é sempre estreita, então aqui os selos
          ficam sempre embaixo (o web só faz isso abaixo de `sm`). */}
      <View style={styles.badgeRow}>
        <Badge tone="primary">{`Nível ${level}`}</Badge>
        <Badge tone="error">{isReview ? "Revisão" : "Dificuldade Elevada"}</Badge>
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
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexWrap: "wrap",
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
