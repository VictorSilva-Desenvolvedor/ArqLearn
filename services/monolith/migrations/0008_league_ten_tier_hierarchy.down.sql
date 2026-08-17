ALTER TABLE user_gamification DROP CONSTRAINT user_gamification_current_tier_check;
ALTER TABLE user_gamification
  ADD CONSTRAINT user_gamification_current_tier_check CHECK (current_tier BETWEEN 1 AND 5);
