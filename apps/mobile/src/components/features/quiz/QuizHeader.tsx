import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatPill } from "@/components/ui/StatPill";
import { useLessonDownload } from "@/hooks/useLessonDownload";
import { colors, spacing } from "@/theme/tokens";
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

  return (
    <View style={styles.header}>
      <IconButton
        icon={<Icon name="close" />}
        label="Sair da lição"
        onPress={() => router.push("/")}
      />
      <ProgressBar value={currentIndex} max={total} variant="thin" tone="primary" style={styles.progress} />
      {lessonId && <LessonDownloadToggle lessonId={lessonId} />}
      <HeartsRow hearts={hearts} />
      <StatPill tone="primary" icon="gems" value={gems} />
    </View>
  );
}

function LessonDownloadToggle({ lessonId }: { lessonId: string }) {
  const { downloaded, toggle } = useLessonDownload(lessonId);
  return (
    <IconButton
      icon={<Icon name={downloaded ? "downloadDone" : "download"} color={downloaded ? colors.secondary : colors.onSurface} />}
      label={downloaded ? "Remover download — lição não ficará disponível offline" : "Baixar lição para uso offline"}
      onPress={toggle}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceBright,
  },
  progress: {
    flex: 1,
  },
});
