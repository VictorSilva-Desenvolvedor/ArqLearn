-- Baú Diário (a pedido do usuário) — abre 1x por dia após responder 10 perguntas no dia local
-- (lição OU Modo Infinito, contagem acumulada — TDD não documentava isso antes, ver
-- ArqLearn_TDD_Technical_Design_Document.md §5 pro padrão de reset preguiçoso equivalente já
-- usado em xp_today/streak). chest_questions_today/chest_questions_date seguem exatamente o
-- padrão de xp_today/xp_today_date; chest_claimed_date marca o último dia em que o baú foi
-- aberto, pra travar em 1 abertura por dia local.
ALTER TABLE user_gamification
  ADD COLUMN chest_questions_today SMALLINT NOT NULL DEFAULT 0 CHECK (chest_questions_today >= 0),
  ADD COLUMN chest_questions_date DATE,
  ADD COLUMN chest_claimed_date DATE;
