import type { GamificationProfile, Track, TrackLesson, User } from "@/types/api";
import type { IconName } from "@/components/ui/Icon";

// Espelha apps/web/src/lib/api/mocks/fixtures/{user,gamification,tracks,lessons}.ts — mesmos
// dados, para a Home renderizar igual nas duas plataformas antes da API real entrar.

export const mockUser: User = {
  id: "3f6a2b8e-1c4d-4a2e-9b8f-7d5c6a1e0f3a",
  name: "Alex Silva",
  email: "alex.silva@arqlearn.com",
  role: "student",
  timezone: "America/Sao_Paulo",
  created_at: "2026-02-10T12:00:00Z",
};

export const mockGamificationProfile: GamificationProfile = {
  xp_total: 520,
  xp_today: 30,
  level: 8,
  streak_current: 12,
  streak_best: 24,
  hearts_current: 5,
  gems: 340,
  league_tier: "prata",
};

export const mockTracks: Track[] = [
  { id: "track-fundamentos", title: "Fundamentos de Arquitetura", topic: "fundamentos", origin: "curated" },
  {
    id: "track-historia",
    title: "História da Arquitetura",
    topic: "historia",
    origin: "curated",
    description: "Grécia e Roma Antiga",
  },
  { id: "track-urbanismo", title: "Urbanismo", topic: "urbanismo", origin: "curated" },
];

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
