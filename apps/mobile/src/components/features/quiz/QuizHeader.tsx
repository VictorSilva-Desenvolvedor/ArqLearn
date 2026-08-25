import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatPill } from "@/components/ui/StatPill";
import { useLessonDownload } from "@/hooks/useLessonDownload";
import { spacing } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import { HeartsRow } from "./HeartsRow";

interface QuizHeaderProps {
  currentIndex: number;
  total: number;
  hearts: number;
  gems: number;
  // Só a sessão de lição de trilha tem esse conceito — Modo Infinito é geração sob demanda, não
  // tem "lição" fixa pra marcar como disponível offline.
  lessonId?: string;
}

// Espelha apps/web/src/components/features/quiz/QuizHeader.tsx.
export function QuizHeader({ currentIndex, total, hearts, gems, lessonId }: QuizHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      {/* Barra de progresso numa linha própria: em largura de telefone, sair + download + 5
          corações + gemas não deixam espaço nenhum pra ela na mesma linha (no web equivalente
          media 10px — auditoria de 25/08/2026). Mesma correção lá, via flex-wrap. */}
      <View style={styles.controls}>
        <IconButton
          icon={<Icon name="close" />}
          label="Sair da lição"
          onPress={() => router.push("/")}
        />
        <View style={styles.spacer} />
        {lessonId && <LessonDownloadToggle lessonId={lessonId} />}
        <HeartsRow hearts={hearts} />
        {/* tone secondary: mesma cor de gema do TopAppBar deste app e do QuizHeader do web —
            estava em `primary` só aqui, único ponto do app que pintava gema de azul. */}
        <StatPill tone="secondary" icon="gems" value={gems} />
      </View>
      <ProgressBar value={currentIndex} max={total} variant="thin" tone="primary" />
    </View>
  );
}

function LessonDownloadToggle({ lessonId }: { lessonId: string }) {
  const { downloaded, toggle } = useLessonDownload(lessonId);
  const colors = useColors();
  return (
    <IconButton
      icon={<Icon name={downloaded ? "downloadDone" : "download"} color={downloaded ? colors.secondary : colors.onSurface} />}
      label={downloaded ? "Remover download — lição não ficará disponível offline" : "Baixar lição para uso offline"}
      onPress={toggle}
    />
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: colors.outlineVariant,
      backgroundColor: colors.surfaceBright,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    spacer: {
      flex: 1,
    },
  });
