-- Baú Semanal (a pedido do usuário, mesma demanda do Baú Diário — ver migration 0009) — abre 1x
-- por ciclo de 7 dias após responder 50 perguntas dentro do ciclo. Diferente do diário (reset por
-- data de calendário), o ciclo semanal é uma janela rolante de 7 dias que começa na primeira
-- pergunta do ciclo (chest_weekly_cycle_start) e só reseta quando 7 dias já passaram desde esse
-- início — mesmo já tendo aberto o baú, o reset só acontece no fim do ciclo original (decisão
-- explícita do usuário: não emenda um ciclo novo na hora do claim). chest_weekly_claimed_cycle_start
-- guarda o cycle_start vigente no momento da última abertura — comparar os dois valores (em vez de
-- um boolean solto) já resolve sozinho o "desclaim" automático quando o ciclo vira, sem precisar
-- zerar essa coluna explicitamente em lugar nenhum.
ALTER TABLE user_gamification
  ADD COLUMN chest_weekly_questions SMALLINT NOT NULL DEFAULT 0 CHECK (chest_weekly_questions >= 0),
  ADD COLUMN chest_weekly_cycle_start DATE,
  ADD COLUMN chest_weekly_claimed_cycle_start DATE;
