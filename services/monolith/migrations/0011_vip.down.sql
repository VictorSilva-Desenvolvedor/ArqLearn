DROP TABLE vip_coupons;

ALTER TABLE user_gamification
  DROP COLUMN is_vip,
  DROP COLUMN vip_expires_at,
  DROP COLUMN vip_daily_chest_resets_used,
  DROP COLUMN vip_daily_chest_resets_date,
  DROP COLUMN vip_weekly_chest_resets_used,
  DROP COLUMN vip_weekly_chest_resets_cycle_start,
  DROP COLUMN vip_subscription_status;
