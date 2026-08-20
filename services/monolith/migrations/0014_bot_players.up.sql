-- Jogadores bot pra popular ligas com poucos usuários reais (competitividade baixa, pedido do
-- usuário 20/08/2026). users.id era FK obrigatória pra auth.users (Supabase Auth) — bot não tem
-- conta de autenticação de verdade, então a FK precisa cair pra permitir linhas sintéticas.
-- Perde-se integridade referencial de banco pros usuários reais (agora garantida só pelo trigger
-- on_auth_user_created, não mais reforçada por constraint); aceito conscientemente aqui pra evitar
-- criar 200 contas reais no Supabase Auth de produção.
ALTER TABLE users DROP CONSTRAINT users_id_fkey;

ALTER TABLE users ADD COLUMN is_bot BOOLEAN NOT NULL DEFAULT false;

-- Índice parcial: filtro "excluir bots" (analytics, métricas de usuários ativos) é o uso comum,
-- não "listar todos os bots" — poucos bots relativos ao total esperado a médio prazo.
CREATE INDEX idx_users_is_bot ON users(is_bot) WHERE is_bot = true;
