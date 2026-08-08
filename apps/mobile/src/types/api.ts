// Subconjunto de Docs/ArqLearn_API_Specification.md necessário para a Home (mapa de
// aprendizado). Mesmos nomes/formatos de apps/web/src/types/api.ts — manter os dois em sync
// manualmente até existir um pacote compartilhado.

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
  created_at: string;
}

export type LeagueTier = "bronze" | "prata" | "ouro" | "platina" | "diamante" | null;

export interface GamificationProfile {
  xp_total: number;
  xp_today: number;
  level: number;
  streak_current: number;
  streak_best: number;
  hearts_current: number;
  gems: number;
  league_tier: LeagueTier;
}

export type TrackOrigin = "curated" | "user_generated";

export interface Track {
  id: string;
  title: string;
  topic: string;
  origin: TrackOrigin;
  description?: string;
}

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface Lesson {
  id: string;
  track_id: string;
  title: string;
  order: number;
}

export interface TrackLesson {
  lesson: Lesson;
  progress_status: LessonProgressStatus;
}
