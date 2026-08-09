-- PATCH /v1/users/me (API Spec §5) aceita notifications_enabled — não havia coluna pra isso.
ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT true;
