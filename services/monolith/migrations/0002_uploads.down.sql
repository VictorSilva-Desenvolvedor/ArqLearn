-- Reverte 0002_uploads.up.sql, em ordem reversa de dependência.

ALTER TABLE content_chunks DROP CONSTRAINT IF EXISTS fk_content_chunks_upload;
DROP TABLE IF EXISTS uploads;
