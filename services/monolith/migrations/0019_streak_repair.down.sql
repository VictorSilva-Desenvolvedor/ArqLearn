ALTER TABLE user_gamification
  DROP COLUMN IF EXISTS streak_repair_value,
  DROP COLUMN IF EXISTS streak_repair_deadline;
