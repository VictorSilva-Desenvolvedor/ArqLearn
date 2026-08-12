import type { TrackLesson } from "@/types/api";
import type { IconName } from "@/components/ui/Icon";

export const mockLessonsByTrack: Record<string, TrackLesson[]> = {
  "track-fundamentos": [
    {
      lesson: { id: "t1-l1", track_id: "track-fundamentos", title: "Elementos Estruturais", order: 1 },
      progress_status: "completed",
    },
    {
      lesson: { id: "t1-l2", track_id: "track-fundamentos", title: "Materiais de Construção", order: 2 },
      progress_status: "completed",
    },
    {
      lesson: { id: "t1-l3", track_id: "track-fundamentos", title: "Avaliação de Unidade", order: 3 },
      progress_status: "completed",
    },
  ],
  "track-historia": [
    {
      lesson: { id: "t2-l1", track_id: "track-historia", title: "Grécia e Roma Antiga", order: 1 },
      progress_status: "in_progress",
    },
    {
      lesson: { id: "t2-l2", track_id: "track-historia", title: "Arquitetura Gótica", order: 2 },
      progress_status: "not_started",
    },
  ],
  "track-urbanismo": [
    {
      lesson: { id: "t3-l1", track_id: "track-urbanismo", title: "Introdução ao Urbanismo", order: 1 },
      progress_status: "not_started",
    },
  ],
};

// Metadados só de apresentação (ícone do nó, se é checkpoint) — não fazem parte do contrato de
// API, ficam separados dos tipos em types/api.ts. Espelha
// apps/web/src/lib/api/mocks/fixtures/lessons.ts#lessonNodePresentation (nomes de ícone
// diferentes: aqui usa o glifo já mapeado em components/ui/Icon.tsx, não Material Symbols cru).
export interface LessonNodePresentation {
  icon: IconName;
  isCheckpoint?: boolean;
}

export const lessonNodePresentation: Record<string, LessonNodePresentation> = {
  "t1-l1": { icon: "check" },
  "t1-l2": { icon: "check" },
  "t1-l3": { icon: "checkpoint", isCheckpoint: true },
  "t2-l1": { icon: "accountBalance" },
  "t2-l2": { icon: "castle" },
  "t3-l1": { icon: "locationCity" },
};
