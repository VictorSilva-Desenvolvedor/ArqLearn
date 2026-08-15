-- Tier persistido do usuário entre semanas (TDD §6, fechamento semanal de ligas). Sem esta
-- coluna, ensureLeagueMembership não teria como saber em qual liga colocar o usuário na semana
-- seguinte depois de uma promoção/rebaixamento — 1=bronze (pior) .. 5=diamante (melhor), mesma
-- numeração de internal/gamification/gamification.go tierNamesByNumber.
ALTER TABLE user_gamification
  ADD COLUMN current_tier SMALLINT NOT NULL DEFAULT 1 CHECK (current_tier BETWEEN 1 AND 5);
