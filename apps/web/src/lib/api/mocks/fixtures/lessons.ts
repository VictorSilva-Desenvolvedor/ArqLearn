import type { TrackLesson } from "@/types/api";

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

// Metadados só de apresentação (ícone do nó, se é checkpoint) — não fazem parte do contrato
// de API, então ficam separados dos tipos em types/api.ts. Fonte visual:
// Docs/stitch_app_visual_identity/home_mapa_de_aprendizado/code.html.
export interface LessonNodePresentation {
  icon: string;
  isCheckpoint?: boolean;
}

export const lessonNodePresentation: Record<string, LessonNodePresentation> = {
  "t1-l1": { icon: "check" },
  "t1-l2": { icon: "check" },
  "t1-l3": { icon: "emoji_events", isCheckpoint: true },
  "t2-l1": { icon: "account_balance" },
  "t2-l2": { icon: "castle" },
  "t3-l1": { icon: "location_city" },
};
