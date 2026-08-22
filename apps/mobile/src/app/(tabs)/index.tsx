import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AllDonePrompt } from "@/components/home/AllDonePrompt";
import { ChestProgressCard } from "@/components/home/ChestProgressCard";
import { DailyGoalCard } from "@/components/home/DailyGoalCard";
import { ExploreMoreCard } from "@/components/home/ExploreMoreCard";
import { LevelProgressCard } from "@/components/home/LevelProgressCard";
import { LearningMap, type LearningMapUnit } from "@/components/home/LearningMap";
import { TopAppBar } from "@/components/home/TopAppBar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import type { LessonNodeVariant } from "@/components/home/LessonNode";
import type { UnitStatus } from "@/components/home/UnitSection";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { listTracks } from "@/lib/api/resources/tracks";
import { getDailyChestStatus, getDailyGoalStatus, getWeeklyChestStatus } from "@/lib/api/resources/gamification";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { DailyChestStatus, DailyGoalStatus, Track, TrackLesson, WeeklyChestStatus } from "@/types/api";

// Só a trilha em destaque (tema selecionado) — mostrar outras trilhas junto no mapa não fazia
// mais sentido com a tela de Explorar já madura (busca, seletor de tema); ver ExploreMoreCard.
const MAX_UNITS_SHOWN = 1;

// hasQuestions decide entre "available" (navegável, fora de ordem) e "construction" (sem
// conteúdo aprovado ainda) — substitui o antigo bloqueio por sequência, que não refletia se a
// lição tinha pergunta de verdade por trás.
function variantFor(progressStatus: string, isCheckpoint: boolean | undefined, hasQuestions: boolean): LessonNodeVariant {
  if (isCheckpoint) return "checkpoint";
  if (progressStatus === "completed") return "completed";
  if (progressStatus === "in_progress") return "current";
  return hasQuestions ? "available" : "construction";
}

function unitStatusFor(lessons: { progress_status: string; has_questions: boolean }[]): UnitStatus {
  // Trilha sem nenhuma lição (units: [] no Mongo, ex.: track ainda não populada) é "em
  // construção", não "concluída" — `every` em array vazio é vacuosamente true e mentia "CONCLUÍDO"
  // pra uma trilha que na real nunca teve conteúdo nenhum (achado ao vivo com a trilha real
  // "Arquitetura Brasileira", 0 lições).
  if (lessons.length === 0) return "construction";
  if (lessons.every((l) => l.progress_status === "completed")) return "completed";
  if (lessons.some((l) => l.progress_status === "in_progress")) return "current";
  if (lessons.some((l) => l.has_questions)) return "available";
  return "construction";
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
    nodes: trackLessons.map(({ lesson, progress_status, has_questions }) => {
      const presentation = lessonNodePresentation[lesson.id];
      const variant = variantFor(progress_status, presentation?.isCheckpoint, has_questions);
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
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { gamification } = useAuth();
  const { theme: selectedTheme } = useTheme();
  const [units, setUnits] = useState<LearningMapUnit[] | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [dailyChest, setDailyChest] = useState<DailyChestStatus | null>(null);
  const [weeklyChest, setWeeklyChest] = useState<WeeklyChestStatus | null>(null);
  const [dailyGoal, setDailyGoal] = useState<DailyGoalStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Extraído do useEffect original pra ser reaproveitado pelo pull-to-refresh (onRefresh abaixo)
  // sem duplicar a lógica de busca/derivação de trilha em destaque.
  const loadMap = useCallback(async () => {
    setMapLoadError(false);
    try {
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
      setUnits(withLessons);
    } catch {
      setMapLoadError(true);
    }
  }, [selectedTheme.topic]);

  const loadChests = useCallback(async () => {
    const [daily, weekly, goal] = await Promise.all([
      getDailyChestStatus(),
      getWeeklyChestStatus(),
      getDailyGoalStatus(),
    ]);
    setDailyChest(daily);
    setWeeklyChest(weekly);
    setDailyGoal(goal);
  }, []);

  useEffect(() => {
    void loadMap();
  }, [loadMap, retryToken]);

  useEffect(() => {
    void loadChests();
  }, [loadChests]);

  // Pull-to-refresh (achado do teste em device real, PENDENCIAS_MOBILE.md #21): reusa loadMap/
  // loadChests em vez de duplicar a busca. Não zera `units`/chests antes de recarregar — o spinner
  // nativo do RefreshControl já é o indicador de carregamento; zerar acionaria o skeleton
  // fullscreen (LoadingBlueprint) por cima do mapa que o usuário já está vendo.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadMap(), loadChests()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadMap, loadChests]);

  // "Tudo em dia" = a trilha em destaque (primeiro item de units, ver orderedTracks acima)
  // concluída — só oferece Modo Infinito se o tema realmente tem conteúdo (hasContent).
  const featuredUnit = units?.[0];
  const allDone = Boolean(featuredUnit && featuredUnit.status === "completed" && selectedTheme.hasContent);

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {dailyGoal && <DailyGoalCard status={dailyGoal} />}
        <LevelProgressCard level={gamification.level} xpTotal={gamification.xp_total} />
        {dailyChest && weeklyChest && (
          <View style={styles.chestRow}>
            <ChestProgressCard
              title="Baú Diário"
              questionsCurrent={dailyChest.questions_today}
              questionsRequired={dailyChest.questions_required}
              available={dailyChest.available}
              claimed={dailyChest.claimed_today}
              onPress={() => router.push("/bau?tipo=diario")}
            />
            <ChestProgressCard
              title="Baú Semanal"
              questionsCurrent={weeklyChest.questions_this_cycle}
              questionsRequired={weeklyChest.questions_required}
              available={weeklyChest.available}
              claimed={weeklyChest.claimed_this_cycle}
              onPress={() => router.push("/bau?tipo=semanal")}
            />
          </View>
        )}
        {!selectedTheme.hasContent && (
          <View style={styles.notice}>
            <Icon name="construction" size={20} color={colors.primary} />
            <Text style={[type.bodySm, styles.noticeText]}>
              Ainda estamos preparando as lições de <Text style={styles.bold}>{selectedTheme.label}</Text> —
              mostrando sua trilha atual enquanto isso.
            </Text>
          </View>
        )}
        {mapLoadError && <ErrorBanner onRetry={() => setRetryToken((t) => t + 1)} />}
        {!mapLoadError && !units && (
          <View style={styles.mapLoading}>
            <LoadingBlueprint />
          </View>
        )}
        {!mapLoadError && units && <LearningMap units={units} />}
        <ExploreMoreCard />
      </ScrollView>
      {allDone && (
        <AllDonePrompt
          topic={selectedTheme.topic}
          themeLabel={selectedTheme.label}
          suppressAutoOpen={gamification.streak_at_risk}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      // Transparente de propósito (a pedido do usuário): deixa o fundo animado
      // (AnimatedBlueprintBackground, montado em app/_layout.tsx) aparecer atrás.
      backgroundColor: "transparent",
    },
    content: {
      paddingHorizontal: 24,
      paddingVertical: 48,
      // maxWidth/alignSelf: mesmo limite que LearningMap.tsx já aplicava só a si mesmo — sem isso,
      // em iPad (ios.supportsTablet: true no app.json) todo o resto da Home (goal/nível/baús/aviso)
      // esticava full-width enquanto só o mapa ficava contido, um "phone UI esticado" inconsistente
      // (achado do /impeccable audit).
      maxWidth: 448,
      width: "100%",
      alignSelf: "center",
    },
    chestRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    mapLoading: {
      alignItems: "center",
      paddingVertical: spacing.section,
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
