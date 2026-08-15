import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AllDonePrompt } from "@/components/home/AllDonePrompt";
import { DailyGoalCard } from "@/components/home/DailyGoalCard";
import { ExploreMoreCard } from "@/components/home/ExploreMoreCard";
import { LevelProgressCard } from "@/components/home/LevelProgressCard";
import { LearningMap, type LearningMapUnit } from "@/components/home/LearningMap";
import { TopAppBar } from "@/components/home/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import type { LessonNodeVariant } from "@/components/home/LessonNode";
import type { UnitStatus } from "@/components/home/UnitSection";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { listTracks } from "@/lib/api/resources/tracks";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { colors, spacing, type } from "@/theme/tokens";
import type { Track, TrackLesson } from "@/types/api";

const DAILY_GOAL_XP = 50;
// Só a trilha em destaque (tema selecionado) — mostrar outras trilhas junto no mapa não fazia
// mais sentido com a tela de Explorar já madura (busca, seletor de tema); ver ExploreMoreCard.
const MAX_UNITS_SHOWN = 1;

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

// O tema selecionado (ThemeSelector no TopAppBar) vira o "conteúdo principal": a primeira lição
// da trilha correspondente vira a atual, sem sobrescrever progresso real já existente. Espelha
// featureSelectedTheme em apps/web/src/app/(shell)/page.tsx.
function featureSelectedTheme(lessons: TrackLesson[]): TrackLesson[] {
  const alreadyActive = lessons.some((l) => l.progress_status !== "not_started");
  if (alreadyActive || lessons.length === 0) return lessons;

  return lessons.map((entry, index) =>
    index === 0 ? { ...entry, progress_status: "in_progress" as const } : entry,
  );
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
  const { theme: selectedTheme } = useTheme();
  const [units, setUnits] = useState<LearningMapUnit[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: tracks } = await listTracks();
      const featuredTrack = tracks.find((track) => track.topic === selectedTheme.topic);
      const otherTracks = tracks.filter((track) => track.topic !== selectedTheme.topic);
      const orderedTracks = [...(featuredTrack ? [featuredTrack] : []), ...otherTracks].slice(0, MAX_UNITS_SHOWN);

      const withLessons = await Promise.all(
        orderedTracks.map(async (track) => {
          const { data: rawLessons } = await listTrackLessons(track.id);
          const trackLessons = track.topic === selectedTheme.topic ? featureSelectedTheme(rawLessons) : rawLessons;
          return toUnit(track, trackLessons);
        }),
      );
      if (!cancelled) setUnits(withLessons);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedTheme.topic]);

  // "Tudo em dia" = a trilha em destaque (primeiro item de units, ver orderedTracks acima)
  // concluída — só oferece Modo Infinito se o tema realmente tem conteúdo (hasContent).
  const featuredUnit = units?.[0];
  const allDone = Boolean(featuredUnit && featuredUnit.status === "completed" && selectedTheme.hasContent);

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
        <LevelProgressCard level={gamification.level} xpTotal={gamification.xp_total} />
        {!selectedTheme.hasContent && (
          <View style={styles.notice}>
            <Icon name="construction" size={20} color={colors.primary} />
            <Text style={[type.bodySm, styles.noticeText]}>
              Ainda estamos preparando as lições de <Text style={styles.bold}>{selectedTheme.label}</Text> —
              mostrando sua trilha atual enquanto isso.
            </Text>
          </View>
        )}
        {units && <LearningMap units={units} />}
        <ExploreMoreCard />
      </ScrollView>
      {allDone && <AllDonePrompt topic={selectedTheme.topic} themeLabel={selectedTheme.label} />}
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
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceGray,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    flex: 1,
    color: colors.onSurfaceVariant,
  },
  bold: {
    fontWeight: "700",
  },
});
