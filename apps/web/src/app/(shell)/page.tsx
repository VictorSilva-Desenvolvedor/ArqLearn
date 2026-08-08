import { listTracks } from "@/lib/api/resources/tracks";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { getMe } from "@/lib/api/resources/users";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { DailyGoalCard } from "@/components/features/home/DailyGoalCard";
import { LearningMap, type LearningMapUnit } from "@/components/features/home/LearningMap";
import type { LessonNodeVariant } from "@/components/features/home/LessonNode";
import type { UnitStatus } from "@/components/features/home/UnitSection";

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

export default async function HomePage() {
  const [{ gamification }, tracksResponse] = await Promise.all([getMe(), listTracks()]);

  const units: LearningMapUnit[] = await Promise.all(
    tracksResponse.data.map(async (track) => {
      const { data: trackLessons } = await listTrackLessons(track.id);
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
    }),
  );

  return (
    <div className="max-w-container-max mx-auto px-lg py-section">
      <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
      <LearningMap units={units} />
    </div>
  );
}
