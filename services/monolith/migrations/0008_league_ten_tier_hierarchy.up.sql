-- Hierarquia de liga expandida de 5 tiers pra 10 ligas x 3 divisões internas = 30 posições
-- lineares (rank 1 = Madeira 3, a base; rank 30 = Diamante 1, o topo). Ver
-- internal/gamification/gamification.go (leagueTierNames, tierName, rankDivision) pra como o
-- rank vira nome de liga + divisão.
ALTER TABLE user_gamification DROP CONSTRAINT user_gamification_current_tier_check;
ALTER TABLE user_gamification
  ADD CONSTRAINT user_gamification_current_tier_check CHECK (current_tier BETWEEN 1 AND 30);
