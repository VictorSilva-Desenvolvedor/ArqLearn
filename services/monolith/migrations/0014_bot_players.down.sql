-- Reversão só funciona se nenhum bot existir ainda (a FK vai rejeitar qualquer users.id que não
-- exista em auth.users) — rodar DELETE FROM users WHERE is_bot antes, se necessário.
DROP INDEX IF EXISTS idx_users_is_bot;
ALTER TABLE users DROP COLUMN is_bot;
ALTER TABLE users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
