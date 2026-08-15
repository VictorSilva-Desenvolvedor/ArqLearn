// Tipos do contrato ArqLearn_API_Specification.md (v1.3). snake_case para bater 1:1 com o
// payload JSON real da API — não converter para camelCase aqui, converter só na UI se preciso.

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
  created_at: string;
}

// Payload de GET /v1/users/me/export (LGPD, portabilidade de dados).
export interface ExportedUserData {
  exported_at: string;
  user: User;
  gamification: {
    xp_total: number;
    level: number;
    streak_current: number;
    streak_best: number;
    hearts_current: number;
    gems: number;
    current_tier: number;
  };
  achievements: Achievement[];
  progress: ProgressSummary;
}

// Espelha LEAGUE_TIERS de lib/gamification/leagueTiers.ts (hierarquia de 10 ligas).
export type LeagueTier =
  | "madeira"
  | "pedra"
  | "bronze"
  | "prata"
  | "ouro"
  | "platina"
  | "esmeralda"
  | "safira"
  | "rubi"
  | "diamante"
  | null;

export interface GamificationProfile {
  xp_total: number;
  xp_today: number;
  level: number;
  streak_current: number;
  streak_best: number;
  streak_freezes_available: number;
  // Streak positiva e ainda sem prática hoje (TDD §5.2) — gatilho pra oferecer usar um
  // Bloqueio de Ofensiva assim que o app abre, em vez de só descobrir a perda no dia seguinte.
  streak_at_risk: boolean;
  hearts_current: number; // 0-5
  // Instante da próxima regeneração de vida (TDD §5.4, 1 vida a cada 3h) — null quando
  // hearts_current já está no teto (5). *(v1.10)*
  hearts_next_at: string | null;
  gems: number;
  league_tier: LeagueTier;
}

export type AchievementType = string;

export interface Achievement {
  type: AchievementType;
  unlocked_at: string;
}

export type TrackOrigin = "curated" | "user_generated";

export interface Track {
  id: string;
  // "title", não "name" — bate com Database Design §4.1 e o que o backend de fato serializa
  // (internal/learning/learning.go); descasamento encontrado ao integrar com a API real.
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
  // false = "em construção" (sem pergunta aprovada ainda) — deveria ficar acessível quando true,
  // independente de progress_status (sem bloqueio por sequência fake).
  has_questions: boolean;
}

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "matching"
  | "fill_blank"
  | "image_identification";

export type QuestionDifficulty = "easy" | "medium" | "hard" | "impossible";

export type QuestionReviewStatus = "pending" | "approved" | "rejected" | "edited";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface SessionQuestion {
  id: string;
  // TODO: confirmar nome do campo com o backend — o spec usa nomes divergentes
  // entre a sessão de lição (inglês) e a revisão de perguntas geradas por IA
  // (português, "enunciado"). Isolado aqui para renomear em 1 lugar.
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
  // Baú Diário (v1.18) — 10 perguntas no dia (lição + Modo Infinito somados) liberam 1 abertura.
  daily_chest_available: boolean;
  daily_chest_questions: number;
}

export interface ProgressSummary {
  tracks_in_progress: number;
  tracks_completed: number;
  lessons_completed_last_7d: number;
  accuracy_rate: number;
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
  division: number;
  week_reference: string;
  ranking: LeagueRankingEntry[];
  promotion_slots: number;
  demotion_slots: number;
  // Só vêm preenchidos quando é a liga do próprio usuário (sem passar `tier` pra getLeague) —
  // null ao navegar o ranking de outra liga, ou quando o grupo é pequeno demais pra uma promoção
  // real acontecer essa semana, ou o usuário já está na tier mais alta.
  viewer_position: number | null;
  xp_to_promotion: number | null;
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

export type NotificationType =
  | "streak_at_risk"
  | "league_promotion"
  | "league_demotion"
  | "new_challenge"
  | "questions_ready_for_review"
  | "welcome"
  | "bug_fixed"
  | "suggestion_implemented";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

export type BugReportStatus = "open" | "fixed";
export type BugReportType = "bug" | "suggestion";
export type DeviceType = "mobile" | "desktop" | "tablet";

// Ver API Spec §14 — enviado por qualquer usuário (POST /v1/bug-reports), listado e resolvido só
// por admin (GET /v1/bug-reports, POST .../resolve). reporter_name/reporter_email só vêm
// preenchidos na listagem de admin, nunca no retorno do próprio envio. device_model/device_type
// só fazem sentido pra type "bug" (v1.15) — o formulário só os mostra nesse caso.
export interface BugReport {
  id: string;
  user_id: string;
  reporter_name?: string;
  reporter_email?: string;
  type: BugReportType;
  description: string;
  screenshot_base64?: string;
  device_model?: string;
  device_type?: DeviceType;
  status: BugReportStatus;
  created_at: string;
  resolved_at?: string | null;
}

export interface ResolveBugReportResult {
  id: string;
  status: BugReportStatus;
  gems_awarded: number;
  reporter_gems_total: number;
}

export type UploadFileType = "pdf" | "docx" | "pptx" | "image" | "video";
export type UploadStatus =
  | "received"
  | "processing"
  | "ready_for_review"
  | "published"
  | "failed";

export interface UploadedContent {
  id: string;
  filename: string;
  file_type: UploadFileType;
  status: UploadStatus;
  size_bytes: number;
  progress_percent?: number;
  created_at: string;
}

// Modo Infinito (§6.1)
export interface InfiniteModeQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  image_url?: string;
  options: QuestionOption[];
}

export interface InfiniteModeSession {
  session_id: string;
  topic: string;
  question: InfiniteModeQuestion;
}

export interface InfiniteModeAnswerResult {
  correct: boolean;
  xp_ganho: number;
  xp_daily_cap_reached: boolean;
  questions_answered: number;
  correct_count: number;
  level: number;
  next_question?: InfiniteModeQuestion;
  // Baú Diário (v1.18) — mesmo contador acumulado do dia de AnswerResult, Modo Infinito soma junto.
  daily_chest_available: boolean;
  daily_chest_questions: number;
}

// --- Baú Diário (v1.18) ---

export interface DailyChestStatus {
  questions_today: number;
  questions_required: number;
  available: boolean;
  claimed_today: boolean;
}

export type ChestRewardType = "gems" | "streak_freeze" | "hearts_refill";

export interface ChestOpenResult {
  reward_type: ChestRewardType;
  // Só preenchido quando reward_type === "gems".
  gems_earned?: number;
  // Saldo total de gemas após a abertura (não é quanto foi ganho, ver gems_earned).
  gems: number;
}

export interface InfiniteModeEndResult {
  questions_answered: number;
  correct_count: number;
  accuracy_rate: number;
  xp_earned: number;
  avg_time_ms: number;
}

// Resumo Inteligente (§6.2)
export interface UploadSummaryKeyPoint {
  title: string;
  explanation: string;
}

export interface UploadSummary {
  upload_id: string;
  title: string;
  synopsis: string;
  key_points: UploadSummaryKeyPoint[];
  architect_tip: string | null;
  generated_at: string;
}

// Chat sobre Material (§6.3)
export interface ChatSourceRef {
  page?: number;
  timestamp_ms?: number;
}

export interface ChatAnswer {
  message_id: string;
  answer: string;
  source_excerpt: string;
  source_ref: ChatSourceRef;
  created_at: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  message_id: string;
  role: ChatRole;
  message: string;
  created_at: string;
}

// Revisão de perguntas geradas por IA (§7) — nomes em português porque é exatamente o que
// PATCH /v1/uploads/{id}/questions/{id} usa em edited_fields (enunciado/opcoes/resposta_correta),
// diferente do inglês usado em SessionQuestion/prompt+options.
export interface ReviewQuestionOption {
  id: string;
  label: string;
}

export interface ReviewQuestion {
  id: string;
  enunciado: string;
  opcoes: ReviewQuestionOption[];
  resposta_correta: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  review_status: QuestionReviewStatus;
  source_excerpt: string;
}

export type QuestionReviewAction = "approve" | "edit" | "reject";

export interface ReviewQuestionEditedFields {
  enunciado?: string;
  opcoes?: ReviewQuestionOption[];
  resposta_correta?: string;
}

// Teacher / Analytics (§10)
export interface WeakTopic {
  topic: string;
  accuracy_rate: number;
}

export interface TeacherClassSummary {
  students_count: number;
  avg_streak: number;
  avg_accuracy: number;
  weak_topics: WeakTopic[];
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
