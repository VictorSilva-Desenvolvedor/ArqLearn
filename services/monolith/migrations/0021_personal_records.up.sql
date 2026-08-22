-- Personal Records (distintos dos Awards de achievements.go — comparam contra o próprio recorde
-- do usuário, não um limiar fixo). streak_best e infinite_correct_streak_best já existem e são
-- reaproveitados como recordes sem coluna nova; estas duas são as únicas métricas que ainda não
-- tinham nenhum rastro persistido:
--   xp_day_best: maior xp_today já alcançado num único dia (xp_today reseta todo dia sem guardar
--     o pico — sem esta coluna, "mais XP em um dia" nunca poderia ser respondido).
--   league_best_tier: melhor rank de liga (mesma codificação linear 1..30 de current_tier,
--     ver 0008_league_ten_tier_hierarchy) já alcançado — current_tier sozinho só guarda a posição
--     atual, que cai de novo em caso de rebaixamento.
ALTER TABLE user_gamification
  ADD COLUMN xp_day_best INTEGER NOT NULL DEFAULT 0 CHECK (xp_day_best >= 0),
  ADD COLUMN league_best_tier SMALLINT NOT NULL DEFAULT 1 CHECK (league_best_tier BETWEEN 1 AND 30);
