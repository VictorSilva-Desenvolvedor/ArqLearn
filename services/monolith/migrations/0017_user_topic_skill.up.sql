-- Habilidade adaptativa por tópico (TDD §10) — usada pelo Modo Infinito pra escolher a próxima
-- pergunta perto do ponto "Goldilocks" pra quem está respondendo. Uma linha por (user, topic),
-- não por track e não global, pra não achatar proficiência de tópicos diferentes numa nota só
-- (ex.: bom em Fundamentos, fraco em Estruturas). topic é VARCHAR livre sem FK — mesmo motivo de
-- gamification_events.event_type (migration 0001): tracks vivem só no Mongo, não existe
-- enum/tabela Postgres de tópicos.
CREATE TABLE user_topic_skill (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(80) NOT NULL,
  skill_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  answers_count INTEGER NOT NULL DEFAULT 0 CHECK (answers_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic)
);
