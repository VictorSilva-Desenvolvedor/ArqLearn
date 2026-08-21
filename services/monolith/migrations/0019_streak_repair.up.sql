-- Reparo de streak (grace window de 3 dias, RS-08 do backlog): quando a sequência zera sem
-- freeze disponível, o valor perdido e o prazo pra restaurar ficam guardados aqui até a próxima
-- lição concluída dentro da janela — ver PrepararReparoStreak/AplicarReparoStreak
-- (internal/gamification/algorithms.go, TDD §5). O par só existe junto ou não existe (CHECK
-- abaixo) — nunca um valor perdido sem prazo, ou vice-versa.
ALTER TABLE user_gamification
  ADD COLUMN streak_repair_value INTEGER,
  ADD COLUMN streak_repair_deadline DATE,
  ADD CONSTRAINT streak_repair_pair_check
    CHECK ((streak_repair_value IS NULL) = (streak_repair_deadline IS NULL));
