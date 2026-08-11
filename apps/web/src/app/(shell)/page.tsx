import { cookies } from "next/headers";
import { getServerAccessToken } from "@/lib/supabase/server";
import { listTracks } from "@/lib/api/resources/tracks";
import { listTrackLessons } from "@/lib/api/resources/lessons";
import { getMe } from "@/lib/api/resources/users";
import { lessonNodePresentation } from "@/lib/api/mocks/fixtures/lessons";
import { getThemeByTopic } from "@/lib/api/mocks/fixtures/themes";
import { THEME_COOKIE } from "@/lib/theme/constants";
import { Icon } from "@/components/ui/Icon";
import { DailyGoalCard } from "@/components/features/home/DailyGoalCard";
import { LevelProgressCard } from "@/components/features/home/LevelProgressCard";
import { LearningMap, type LearningMapUnit } from "@/components/features/home/LearningMap";
import { AllDonePrompt } from "@/components/features/home/AllDonePrompt";
import type { LessonNodeVariant } from "@/components/features/home/LessonNode";
import type { UnitNodeData } from "@/components/features/home/UnitSection";
import type { TrackLesson } from "@/types/api";
import type { UnitStatus } from "@/components/features/home/UnitSection";

const DAILY_GOAL_XP = 50;
const MAX_UNITS_SHOWN = 3;
// Quantas missões à frente da atual ficam visíveis ("locked" normal) antes da névoa começar —
// a pedido do usuário: só revela o que está perto de ser alcançado, o resto vira "foggy".
const FOG_WINDOW = 5;

function variantFor(progressStatus: string, isCheckpoint: boolean | undefined): LessonNodeVariant {
  if (isCheckpoint) return "checkpoint";
  if (progressStatus === "completed") return "completed";
  if (progressStatus === "in_progress") return "current";
  return "locked";
}

// Só some quando a pessoa se aproxima (índice dentro da janela de FOG_WINDOW a partir da lição
// atual) — checkpoints ficam de fora de propósito, servem de marco visível mesmo à distância.
function applyFog(nodes: UnitNodeData[]): UnitNodeData[] {
  const currentIndex = nodes.findIndex((n) => n.variant === "current");
  if (currentIndex === -1) return nodes;
  return nodes.map((node, index) =>
    node.variant === "locked" && index > currentIndex + FOG_WINDOW
      ? { ...node, variant: "foggy" as const }
      : node,
  );
}

function unitStatusFor(lessons: { progress_status: string }[]): UnitStatus {
  if (lessons.every((l) => l.progress_status === "completed")) return "completed";
  if (lessons.some((l) => l.progress_status === "in_progress")) return "current";
  return "locked";
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
  const [{ gamification }, tracksResponse] = await Promise.all([
    getMe(accessToken),
    listTracks({}, accessToken),
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
        nodes: applyFog(
          trackLessons.map(({ lesson, progress_status }) => {
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
        ),
      };
    }),
  );

  // "Todas as tarefas da Home" = a trilha em destaque (primeiro item de units, ver orderedTracks
  // acima) concluída — não as outras trilhas mostradas de raspão (essas ficam "locked" até serem
  // escolhidas como tema, não é o que a pessoa veio fazer hoje). Só oferece Modo Infinito se o
  // tema realmente tem conteúdo (hasContent) — sem isso, nem o Modo Infinito teria pergunta.
  const featuredUnit = units[0];
  const allDone = Boolean(featuredUnit && featuredUnit.status === "completed" && selectedTheme.hasContent);

  return (
    <div className="max-w-container-max mx-auto px-lg py-section">
      <DailyGoalCard xpToday={gamification.xp_today} goal={DAILY_GOAL_XP} />
      <LevelProgressCard level={gamification.level} xpTotal={gamification.xp_total} />
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
      {allDone && <AllDonePrompt topic={featuredTopic} themeLabel={selectedTheme.label} />}
    </div>
  );
}
