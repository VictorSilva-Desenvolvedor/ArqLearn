-- Bandit de template (Thompson Sampling, Beta-Bernoulli) pra escolher qual variação de mensagem
-- enviar em cada gatilho de notificação (TDD §11) — hoje só existia uma mensagem fixa por gatilho,
-- sem variação nem teto diário nem cooldown. successes/failures começam em 1 (prior uniforme
-- Beta(1,1)) e só sobem — nunca resetam, cada observação (recompensa avaliada 24h depois do envio)
-- incrementa um dos dois.
CREATE TABLE notification_template_stats (
  trigger_type VARCHAR(40) NOT NULL,
  template_id VARCHAR(60) NOT NULL,
  successes INTEGER NOT NULL DEFAULT 1 CHECK (successes > 0),
  failures INTEGER NOT NULL DEFAULT 1 CHECK (failures > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trigger_type, template_id)
);

-- Um envio real por linha — histórico usado pra três coisas: (1) cooldown (não repetir o mesmo
-- template pro mesmo usuário em menos de 3 dias), (2) avaliação de recompensa (24h depois,
-- evaluated_at/rewarded preenchidos por AvaliarRecompensasPendentes), (3) não mandar o mesmo
-- trigger_type duas vezes no mesmo dia local pro mesmo usuário.
CREATE TABLE notification_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type VARCHAR(40) NOT NULL,
  template_id VARCHAR(60) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_at TIMESTAMPTZ,
  rewarded BOOLEAN
);
CREATE INDEX idx_notification_sends_user_sent ON notification_sends(user_id, sent_at DESC);
CREATE INDEX idx_notification_sends_pending_eval ON notification_sends(evaluated_at) WHERE evaluated_at IS NULL;

-- Seed: as 4 variações de streak_at_risk entram já com prior (1,1) — dado de referência ship no
-- próprio migration (mesmo padrão de migrations/0004_shop_items_seed), não upsert em runtime. Uma
-- nova variação no futuro é uma nova migration própria (INSERT ... ON CONFLICT DO NOTHING), nunca
-- upsert solto em código de aplicação.
INSERT INTO notification_template_stats (trigger_type, template_id) VALUES
  ('streak_at_risk', 'streak_risco_classico'),
  ('streak_at_risk', 'streak_risco_encorajador'),
  ('streak_at_risk', 'streak_risco_curto'),
  ('streak_at_risk', 'streak_risco_pergunta');
