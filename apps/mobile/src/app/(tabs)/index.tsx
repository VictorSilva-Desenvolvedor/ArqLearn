import { ScrollView, StyleSheet, View } from "react-native";
import { DailyGoalCard } from "@/components/home/DailyGoalCard";
import { LearningMap, type LearningMapUnit } from "@/components/home/LearningMap";
import { TopAppBar } from "@/components/home/TopAppBar";
import type { LessonNodeVariant } from "@/components/home/LessonNode";
import type { UnitStatus } from "@/components/home/UnitSection";
import { useAuth } from "@/contexts/AuthContext";
import { lessonNodePresentation, mockLessonsByTrack, mockTracks } from "@/mocks/fixtures";
import { colors } from "@/theme/tokens";

const DAILY_GOAL_XP = 50;

function variantFor(progressStatus: string, isCheckpoint: boolean | undefined): LessonNodeVariant {
  if (isCheckpoint) return "checkpoint";
  if (progressStatus === "completed") return "completed";
  if (progressStatus === "in_progress") return "current";
  return "locked";
}

function unitStatusFor(lessons: { progress_status: string }[]): UnitStatus {
  if (lessons.every((l) => l.progress_status === "completed")) return "completed";
  if (lessons.some((l) => l.progress_status === "in_progress")) return "current";
  return "locked";
}

// Mesma derivação de apps/web/src/app/(shell)/page.tsx, mas lendo direto dos mocks locais —
// a troca para GET /v1/tracks + GET /v1/tracks/{id}/lessons entra junto com a auth real.
const units: LearningMapUnit[] = mockTracks.map((track) => {
  const trackLessons = mockLessonsByTrack[track.id] ?? [];
  const status = unitStatusFor(trackLessons);

  return {
    trackId: track.id,
    title: track.title,
    subtitle: track.description,
    status,
    nodes: trackLessons.map(({ lesson, progress_status }) => {
      const presentation = lessonNodePresentation[lesson.id];
      const variant = variantFor(progress_status, presentation?.isCheckpoint);
      return {
        lessonId: lesson.id,
        icon: presentation?.icon ?? "school",
        variant,
        href: `/trilhas/${track.id}/${lesson.id}/sessao`,
        ctaLabel: variant === "current" ? "Continuar lição" : undefined,
      };
    }),
  };
});

export default function HomeScreen() {
  const { gamification } = useAuth();

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
        <LearningMap units={units} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
});
