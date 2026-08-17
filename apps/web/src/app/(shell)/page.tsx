import { cookies } from "next/headers";
import { getServerAccessToken } from "@/lib/supabase/server";
import { listTracks } from "@/lib/api/resources/tracks";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { getMe } from "@/lib/api/resources/users";
import { getDailyChestStatus, getWeeklyChestStatus } from "@/lib/api/resources/gamification";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { getThemeByTopic } from "@/lib/api/mocks/fixtures/themes";
import { THEME_COOKIE } from "@/lib/theme/constants";
import { Icon } from "@/components/ui/Icon";
import { ChestProgressCard } from "@/components/features/home/ChestProgressCard";
import { DailyGoalCard } from "@/components/features/home/DailyGoalCard";
import { ExploreMoreCard } from "@/components/features/home/ExploreMoreCard";
import { LevelProgressCard } from "@/components/features/home/LevelProgressCard";
import { LearningMap, type LearningMapUnit } from "@/components/features/home/LearningMap";
import { AllDonePrompt } from "@/components/features/home/AllDonePrompt";
import type { LessonNodeVariant } from "@/components/features/home/LessonNode";
import type { TrackLesson } from "@/types/api";
import type { UnitStatus } from "@/components/features/home/UnitSection";

const DAILY_GOAL_XP = 50;
// Só a trilha em destaque (tema selecionado) — mostrar outras trilhas junto no mapa não fazia
// mais sentido com a tela de Explorar já madura (busca, seletor de tema); ver ExploreMoreCard.
const MAX_UNITS_SHOWN = 1;

// hasQuestions decide entre "available" (navegável, fora de ordem) e "construction" (sem
// conteúdo aprovado ainda) — substitui o antigo bloqueio por sequência (+ a "névoa" que escondia
// lições distantes), que não refletia se a lição tinha pergunta de verdade por trás.
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

// O tema selecionado (ThemeSelector no TopAppBar) vira o "conteúdo principal": a trilha
// correspondente sempre aparece primeiro no mapa e, se ainda não tiver nenhuma lição em
// andamento, a primeira lição dela vira a atual — sem sobrescrever progresso real já existente.
function featureSelectedTheme(lessons: TrackLesson[]): TrackLesson[] {
  const alreadyActive = lessons.some((l) => l.progress_status !== "not_started");
  if (alreadyActive || lessons.length === 0) return lessons;

  return lessons.map((entry, index) =>
    index === 0 ? { ...entry, progress_status: "in_progress" as const } : entry,
  );
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const selectedTopic = cookieStore.get(THEME_COOKIE)?.value;
  const selectedTheme = getThemeByTopic(selectedTopic);
  const featuredTopic = selectedTheme.topic;

  const accessToken = await getServerAccessToken();
  const [{ gamification }, tracksResponse, dailyChest, weeklyChest] = await Promise.all([
    getMe(accessToken),
    listTracks({}, accessToken),
    getDailyChestStatus(accessToken),
    getWeeklyChestStatus(accessToken),
  ]);

  const featuredTrack = tracksResponse.data.find((track) => track.topic === featuredTopic);
  const otherTracks = tracksResponse.data.filter((track) => track.topic !== featuredTopic);
  const orderedTracks = [
    ...(featuredTrack ? [featuredTrack] : []),
    ...otherTracks,
  ].slice(0, MAX_UNITS_SHOWN);

  const units: LearningMapUnit[] = await Promise.all(
    orderedTracks.map(async (track) => {
      const { data: rawLessons } = await listTrackLessons(track.id, accessToken);
      const trackLessons = track.topic === featuredTopic ? featureSelectedTheme(rawLessons) : rawLessons;
      const status = unitStatusFor(trackLessons);

      return {
        trackId: track.id,
        title: track.title,
        subtitle: track.description,
        status,
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
    }),
  );

  // "Todas as tarefas da Home" = a única unidade mostrada (a trilha em destaque, MAX_UNITS_SHOWN
  // = 1) concluída. Só oferece Modo Infinito se o tema realmente tem conteúdo (hasContent) — sem
  // isso, nem o Modo Infinito teria pergunta.
  const featuredUnit = units[0];
  const allDone = Boolean(featuredUnit && featuredUnit.status === "completed" && selectedTheme.hasContent);

  return (
    <div className="max-w-container-max mx-auto px-lg py-section">
      <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
      <LevelProgressCard level={gamification.level} xpTotal={gamification.xp_total} />
      <div className="grid grid-cols-2 gap-md mb-section">
        <ChestProgressCard
          title="Baú Diário"
          questionsCurrent={dailyChest.questions_today}
          questionsRequired={dailyChest.questions_required}
          available={dailyChest.available}
          claimed={dailyChest.claimed_today}
          href="/bau?tipo=diario"
        />
        <ChestProgressCard
          title="Baú Semanal"
          questionsCurrent={weeklyChest.questions_this_cycle}
          questionsRequired={weeklyChest.questions_required}
          available={weeklyChest.available}
          claimed={weeklyChest.claimed_this_cycle}
          href="/bau?tipo=semanal"
        />
      </div>
      {!selectedTheme.hasContent && (
        <div className="mb-section bg-surface-gray border-2 border-outline-variant rounded-xl p-md flex items-center gap-sm">
          <Icon name="construction" className="text-primary" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ainda estamos preparando as lições de <strong>{selectedTheme.label}</strong> — mostrando sua
            trilha atual enquanto isso.
          </p>
        </div>
      )}
      <LearningMap units={units} />
      <ExploreMoreCard />
      {allDone && (
        <AllDonePrompt
          topic={featuredTopic}
          themeLabel={selectedTheme.label}
          suppressAutoOpen={gamification.streak_at_risk}
        />
      )}
    </div>
  );
}
