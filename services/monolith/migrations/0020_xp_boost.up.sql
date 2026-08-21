-- XP Boost (TDD §3.3): multiplicador temporário de XP, concedido via recompensa de Baú Diário/
-- Semanal (ChestRewardXPBoost) — ver AtivarXPBoost/XPBoostAtivo em
-- internal/gamification/algorithms.go. NULL sempre significa "sem boost ativo" (nunca "vitalício"
-- como vip_expires_at pode significar quando pareado com is_vip=true).
ALTER TABLE user_gamification
  ADD COLUMN xp_boost_active_until TIMESTAMPTZ;
