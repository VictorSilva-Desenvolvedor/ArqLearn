-- PATCH /v1/notifications/preferences (API Spec §9) aceita push_enabled/email_enabled — canais
-- distintos de notifications_enabled (migrations/0003, preferência geral do PATCH /v1/users/me).
ALTER TABLE users ADD COLUMN push_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN email_enabled BOOLEAN NOT NULL DEFAULT true;
