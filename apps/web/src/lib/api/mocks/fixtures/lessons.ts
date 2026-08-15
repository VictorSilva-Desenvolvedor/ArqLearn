import type { TrackLesson } from "@/types/api";

export const mockLessonsByTrack: Record<string, TrackLesson[]> = {
  "track-fundamentos": [
    {
      lesson: { id: "t1-l1", track_id: "track-fundamentos", title: "Elementos Estruturais", order: 1 },
      progress_status: "completed",
      has_questions: true,
    },
    {
      lesson: { id: "t1-l2", track_id: "track-fundamentos", title: "Materiais de Construção", order: 2 },
      progress_status: "completed",
      has_questions: true,
    },
    {
      lesson: { id: "t1-l3", track_id: "track-fundamentos", title: "Avaliação de Unidade", order: 3 },
      progress_status: "completed",
      has_questions: true,
    },
  ],
  "track-historia": [
    {
      lesson: { id: "t2-l1", track_id: "track-historia", title: "Grécia e Roma Antiga", order: 1 },
      progress_status: "in_progress",
      has_questions: true,
    },
    {
      lesson: { id: "t2-l2", track_id: "track-historia", title: "Arquitetura Gótica", order: 2 },
      progress_status: "not_started",
      has_questions: true,
    },
  ],
  "track-urbanismo": [
    {
      lesson: { id: "t3-l1", track_id: "track-urbanismo", title: "Introdução ao Urbanismo", order: 1 },
      progress_status: "not_started",
      has_questions: true,
    },
  ],
  "track-sistemas-construtivos": [
    {
      lesson: {
        id: "t4-l1",
        track_id: "track-sistemas-construtivos",
        title: "Alvenaria Estrutural vs. Vedação",
        order: 1,
      },
      progress_status: "not_started",
      has_questions: true,
    },
    {
      lesson: { id: "t4-l2", track_id: "track-sistemas-construtivos", title: "Modulação e Instalações", order: 2 },
      progress_status: "not_started",
      has_questions: true,
    },
  ],
  "track-arquitetura-moderna-br": [
    {
      lesson: {
        id: "t5-l1",
        track_id: "track-arquitetura-moderna-br",
        title: "Oscar Niemeyer e o Concreto Armado",
        order: 1,
      },
      progress_status: "not_started",
      has_questions: true,
    },
    {
      lesson: {
        id: "t5-l2",
        track_id: "track-arquitetura-moderna-br",
        title: "Brutalismo Paulista",
        order: 2,
      },
      progress_status: "not_started",
      has_questions: true,
    },
  ],
  "track-conforto-termico": [
    {
      lesson: { id: "t6-l1", track_id: "track-conforto-termico", title: "Ventilação Natural", order: 1 },
      progress_status: "not_started",
      has_questions: true,
    },
    {
      lesson: { id: "t6-l2", track_id: "track-conforto-termico", title: "Inércia Térmica", order: 2 },
      progress_status: "not_started",
      has_questions: true,
    },
  ],
  "track-estruturas": [
    {
      lesson: { id: "t7-l1", track_id: "track-estruturas", title: "Treliças Isostáticas", order: 1 },
      progress_status: "not_started",
      has_questions: true,
    },
    {
      lesson: { id: "t7-l2", track_id: "track-estruturas", title: "Flambagem de Pilares", order: 2 },
      progress_status: "not_started",
      has_questions: true,
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
  "t1-l1": { icon: "foundation" },
  "t1-l2": { icon: "foundation" },
  "t1-l3": { icon: "emoji_events", isCheckpoint: true },
  "t2-l1": { icon: "account_balance" },
  "t2-l2": { icon: "castle" },
  "t3-l1": { icon: "location_city" },
  "t4-l1": { icon: "handyman" },
  "t4-l2": { icon: "plumbing" },
  "t5-l1": { icon: "villa" },
  "t5-l2": { icon: "apartment" },
  "t6-l1": { icon: "air" },
  "t6-l2": { icon: "thermostat" },
  "t7-l1": { icon: "architecture" },
  "t7-l2": { icon: "vertical_align_bottom" },
};
