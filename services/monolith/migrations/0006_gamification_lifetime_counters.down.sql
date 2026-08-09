ALTER TABLE user_gamification DROP COLUMN lessons_completed_total;
ALTER TABLE user_gamification DROP COLUMN answers_correct_total;
ALTER TABLE user_gamification DROP COLUMN perfect_lessons_total;
ALTER TABLE user_gamification DROP COLUMN explain_used_total;

ALTER TABLE user_gamification DROP COLUMN infinite_questions_total;
ALTER TABLE user_gamification DROP COLUMN infinite_correct_streak_current;
ALTER TABLE user_gamification DROP COLUMN infinite_correct_streak_best;
ALTER TABLE user_gamification DROP COLUMN infinite_sessions_total;

ALTER TABLE user_gamification DROP COLUMN shop_purchases_total;
ALTER TABLE user_gamification DROP COLUMN gems_spent_total;

ALTER TABLE user_gamification DROP COLUMN uploads_total;
ALTER TABLE user_gamification DROP COLUMN summaries_generated_total;
ALTER TABLE user_gamification DROP COLUMN material_chat_messages_total;

ALTER TABLE user_gamification DROP COLUMN bug_reports_total;
ALTER TABLE user_gamification DROP COLUMN bug_reports_resolved_total;
