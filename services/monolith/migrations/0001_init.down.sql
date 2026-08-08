-- Reverte 0001_init.up.sql, em ordem reversa de dependência.
-- Extensões (pgcrypto, vector) não são removidas de propósito — podem ser usadas por outros
-- schemas do projeto Supabase; dropar extensão é uma decisão manual, não automática.

DROP TABLE IF EXISTS content_chunks;

DROP TABLE IF EXISTS gamification_events_2026_08;
DROP TABLE IF EXISTS gamification_events;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS shop_items;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS league_members;
DROP TABLE IF EXISTS leagues;
DROP TABLE IF EXISTS user_gamification;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();

DROP TABLE IF EXISTS users;
