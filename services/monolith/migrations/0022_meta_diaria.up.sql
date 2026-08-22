-- Meta Diária personalizável (TDD §13) — nível escolhido pelo usuário entre 4 presets, medido em
-- perguntas certas OU minutos estudados no dia (o que vier primeiro), nunca só em XP (evita
-- inflar por VIP/XP Boost/combo). Substitui o gatilho fixo "10 perguntas" do Baú Diário
-- (ChestQuestionsRequired, algorithms.go) por um alvo dinâmico por usuário — chest_questions_today
-- (migration 0009) já cobre a métrica de perguntas, reaproveitada sem coluna nova; só a métrica de
-- minutos precisa de rastro novo, no mesmo padrão de reset preguiçoso de xp_today/
-- chest_questions_today (comparação de data, sem cron).
ALTER TABLE user_gamification
  ADD COLUMN daily_goal_level TEXT NOT NULL DEFAULT 'regular'
    CHECK (daily_goal_level IN ('leve', 'regular', 'consistente', 'intensa')),
  ADD COLUMN study_seconds_today INT NOT NULL DEFAULT 0 CHECK (study_seconds_today >= 0),
  ADD COLUMN study_seconds_today_date DATE;
