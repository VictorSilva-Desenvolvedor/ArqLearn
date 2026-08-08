-- Schema inicial — tradução direta de Docs/ArqLearn_Database_Design.md §3.2 e §5 (v1.3).
-- Rodar com: migrate -path ./migrations -database "$DATABASE_URL" up

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- users é o perfil de domínio, não a credencial — id vem de auth.users (Supabase Auth).
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','teacher','admin')),
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
  tenant_id UUID,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;

-- Cria automaticamente o perfil de domínio quando o Supabase Auth cria um auth.users —
-- ver Docs/ArqLearn_API_Specification.md §4 para o fluxo completo do lado do cliente.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_gamification (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE TABLE user_gamification (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  xp_today INTEGER NOT NULL DEFAULT 0 CHECK (xp_today >= 0),
  xp_today_date DATE,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  streak_last_active_date DATE,
  hearts_current SMALLINT NOT NULL DEFAULT 5 CHECK (hearts_current BETWEEN 0 AND 5),
  hearts_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  streak_freezes_available SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_reference DATE NOT NULL,
  tier SMALLINT NOT NULL,
  group_number INTEGER NOT NULL,
  UNIQUE (week_reference, tier, group_number)
);

CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  xp_this_week INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX idx_league_members_ranking ON league_members(league_id, xp_this_week DESC);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  category VARCHAR(30) NOT NULL, -- cosmetic | streak_freeze | heart_refill
  price_gems INTEGER NOT NULL CHECK (price_gems > 0),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_id UUID NOT NULL REFERENCES shop_items(id),
  price_paid_gems INTEGER NOT NULL,
  idempotency_key VARCHAR(64) UNIQUE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_events (
  id BIGSERIAL,
  user_id UUID NOT NULL REFERENCES users(id),
  event_type VARCHAR(40) NOT NULL,
  value INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at) -- Postgres exige que a chave da tabela particionada
                                -- inclua a coluna de particionamento (created_at)
) PARTITION BY RANGE (created_at);

-- TODO: automatizar a criação de partições mensais (job agendado) antes de virar o mês —
-- por ora só a partição do mês corrente existe.
CREATE TABLE gamification_events_2026_08
  PARTITION OF gamification_events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_gamevents_user_time ON gamification_events(user_id, created_at DESC);

-- pgvector — RAG do AI Content Pipeline (Database Design §5).
CREATE TABLE content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL,
  source_type VARCHAR(20) NOT NULL, -- pdf | video | image
  text_content TEXT NOT NULL,
  source_ref JSONB,        -- {page: 4} ou {timestamp_ms: 125000}
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chunks_embedding ON content_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chunks_upload ON content_chunks(upload_id);
