import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { DailyGoalCard } from "@/components/home/DailyGoalCard";
import { LearningMap, type LearningMapUnit } from "@/components/home/LearningMap";
import { TopAppBar } from "@/components/home/TopAppBar";
import type { LessonNodeVariant } from "@/components/home/LessonNode";
import type { UnitStatus } from "@/components/home/UnitSection";
import { useAuth } from "@/hooks/useAuth";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { listTracks } from "@/lib/api/resources/tracks";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { colors } from "@/theme/tokens";
import type { Track, TrackLesson } from "@/types/api";

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

function toUnit(track: Track, trackLessons: TrackLesson[]): LearningMapUnit {
  return {
    trackId: track.id,
    title: track.title,
    subtitle: track.description,
    status: unitStatusFor(trackLessons),
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
}

export default function HomeScreen() {
  const { gamification } = useAuth();
  const [units, setUnits] = useState<LearningMapUnit[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: tracks } = await listTracks();
      const withLessons = await Promise.all(
        tracks.map(async (track) => {
          const { data: trackLessons } = await listTrackLessons(track.id);
          return toUnit(track, trackLessons);
        }),
      );
      if (!cancelled) setUnits(withLessons);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
        {units && <LearningMap units={units} />}
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
