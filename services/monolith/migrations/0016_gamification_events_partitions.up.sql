-- gamification_events (migration 0001) nasceu só com a partição de agosto/2026 — TODO explícito
-- no schema original avisando que setembro quebraria sem isso. Cria um colchão de meses à frente
-- pra não depender só do cron mensal (cmd/ensure-event-partitions, ver .github/workflows/
-- ensure-event-partitions.yml) já estar rodando antes da virada.
CREATE TABLE IF NOT EXISTS gamification_events_2026_09
  PARTITION OF gamification_events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS gamification_events_2026_10
  PARTITION OF gamification_events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS gamification_events_2026_11
  PARTITION OF gamification_events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
