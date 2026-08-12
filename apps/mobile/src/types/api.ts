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
  hearts_current: number; // 0-5
  // Instante da próxima regeneração de vida (TDD §5.4, 1 vida a cada 3h) — null quando
  // hearts_current já está no teto (5).
  hearts_next_at: string | null;
  gems: number;
  league_tier: LeagueTier;
}

export type AchievementType = string;

export interface Achievement {
  type: AchievementType;
  unlocked_at: string;
}

export interface LeagueRankingEntry {
  user_id: string;
  name: string;
  xp_this_week: number;
  position: number;
}

export interface League {
  league_id: string;
  tier: LeagueTier;
  week_reference: string;
  ranking: LeagueRankingEntry[];
}

export type ShopItemType = "hearts_refill" | "streak_freeze" | "cosmetic";

export interface ShopItem {
  id: string;
  tipo: ShopItemType;
  name: string;
  description: string;
  price_gems: number;
  requires_level?: number;
  is_new?: boolean;
  locked?: boolean;
}

export interface PurchaseResult {
  gems_restantes: number;
  item: { id: string; tipo: ShopItemType };
}

export interface Paginated<T> {
  data: T[];
  next_cursor: string | null;
}

export interface ApiErrorBody {
  error_code: string;
  message: string;
  trace_id: string;
  details?: Record<string, unknown>;
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

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "matching"
  | "fill_blank"
  | "image_identification";

export type QuestionDifficulty = "easy" | "medium" | "hard" | "impossible";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface SessionQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  image_url?: string;
  options: QuestionOption[];
}

export interface LessonSession {
  session_id: string;
  questions: SessionQuestion[];
  hearts_available: number;
}

export interface AnswerResult {
  correct: boolean;
  xp_ganho: number;
  xp_daily_cap_reached: boolean;
  vidas_restantes: number;
  streak_atual: number;
  explicacao: string;
}
