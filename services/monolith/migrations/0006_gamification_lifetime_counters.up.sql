-- Contadores vitalícios usados pelas condições de desbloqueio de conquistas (internal/gamification
-- /achievements.go) — nenhum contador cumulativo existia antes (só saldos atuais como xp_total/
-- gems, que não servem pra checar "responda 100 perguntas ao todo" depois que o XP já foi gasto/
-- resetado). Cada coluna é incrementada no handler que representa a ação, no mesmo request que já
-- concede XP/gems, evitando um segundo round-trip de leitura.
ALTER TABLE user_gamification ADD COLUMN lessons_completed_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN answers_correct_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN perfect_lessons_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN explain_used_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_gamification ADD COLUMN infinite_questions_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN infinite_correct_streak_current INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN infinite_correct_streak_best INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN infinite_sessions_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_gamification ADD COLUMN shop_purchases_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN gems_spent_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_gamification ADD COLUMN uploads_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN summaries_generated_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN material_chat_messages_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_gamification ADD COLUMN bug_reports_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN bug_reports_resolved_total INTEGER NOT NULL DEFAULT 0;
