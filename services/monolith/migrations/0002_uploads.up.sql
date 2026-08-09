-- Tabela uploads (Docs/ArqLearn_Database_Design.md, ingestão real) — fecha a pendência #1 de
-- Docs/PENDENCIAS_IA.md: content_chunks.upload_id já existia mas sem tabela dona nem FK.
-- Rodar com: migrate -path ./migrations -database "$DATABASE_URL" up

CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- pdf | docx | pptx | image | video
  storage_key VARCHAR(500) NOT NULL,
  size_bytes BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processing','ready_for_review','published','failed')),
  progress_percent INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_uploads_user ON uploads(user_id);

-- content_chunks.upload_id (0001_init) nunca teve dono formal — agora tem.
ALTER TABLE content_chunks
  ADD CONSTRAINT fk_content_chunks_upload
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE;
