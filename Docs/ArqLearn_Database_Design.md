# DATABASE DESIGN
## ArqLearn

Modelo de dados detalhado: esquema relacional, documentos, vetores, cache e estratégias de persistência.

Versão 1.7 | Agosto de 2026
Documento complementar ao SAD e ao TDD do ArqLearn v1.0

> **Sobre esta versão:** versão em Markdown, mantida como fonte da verdade a partir de agora (ver
> `CLAUDE.md`). O arquivo `ArqLearn_Database_Design.docx` original (v1.0) permanece na pasta como
> snapshot histórico, mas não é mais atualizado.

### Controle de Versão

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 08/08/2026 | Equipe de Engenharia / Dados | Versão inicial do desenho de banco de dados |
| 1.1 | 08/08/2026 | Equipe de Engenharia / Dados | Novas coleções MongoDB para Modo Infinito, Resumo Inteligente e Chat sobre material |
| 1.2 | 08/08/2026 | Equipe de Engenharia / Dados | Novas colunas em `user_gamification` para o limite diário de XP; primeira versão consolidada em Markdown |
| 1.3 | 08/08/2026 | Equipe de Engenharia / Dados | Identidade delegada ao Supabase Auth — `users` perde `password_hash` e passa a referenciar `auth.users`; adiciona trigger de sincronização |
| 1.4 | 08/08/2026 | Equipe de Engenharia / Dados | Corrige bug real encontrado ao rodar a migration contra o Postgres: `gamification_events` particionada por `created_at` precisa de chave primária composta `(id, created_at)` — Postgres exige que toda constraint única de tabela particionada inclua a coluna de particionamento |
| 1.5 | 08/08/2026 | Equipe de Engenharia / Dados | Adiciona índice `{user_id: 1, lesson_id: 1}` em `user_progress`, encontrado ao implementar `GET /v1/tracks/{track_id}/lessons` |
| 1.6 | 08/08/2026 | Equipe de Engenharia / Dados | Adiciona `explanation` a `questions` (já exigido pelo Persona Prompt, nunca persistido) e a coleção `practice_sessions` (TTL) — ambos encontrados ao implementar `POST /v1/lessons/{lesson_id}/session` e `/answers` |
| 1.7 | 08/08/2026 | Equipe de Engenharia / Dados | Documenta que `lesson.order` e `question.options[].id` são derivados na API, não campos do banco — encontrado ao integrar com o app web já em construção |

---

## 1. Introdução

Este documento detalha o desenho de banco de dados do ArqLearn, consolidando e expandindo os esquemas
introduzidos no TDD. Cobre o modelo relacional (PostgreSQL), o modelo de documentos (MongoDB), o
armazenamento vetorial (pgvector), a estratégia de cache (Redis) e as políticas de backup, retenção e
escalabilidade de dados.

## 2. Estratégia de Persistência Poliglota

| Armazenamento | Tecnologia | Uso principal |
|---|---|---|
| Relacional (OLTP) | PostgreSQL 16 | Usuários, autenticação, gamificação, ligas, conquistas, loja/compras. |
| Documentos | MongoDB 7 | Trilhas, unidades, lições, progresso do usuário (leitura otimizada para árvore de conteúdo). |
| Vetorial | PostgreSQL + pgvector | Chunks de conteúdo extraído e embeddings para RAG do pipeline de IA. |
| Cache | Redis 7 | Sessões, leaderboard de ligas, rate limiting, perfis quentes. |
| Objetos | S3-compatível | Arquivos brutos enviados, mídia processada, assets estáticos. |

*Tabela 1 — Visão geral da persistência poliglota e racional de escolha por carga de trabalho.*

A escolha por Database per Service (um esquema/instância lógica por domínio) segue o princípio de
desacoplamento do SAD (Seção 5.2), permitindo migração ou escala independente de cada armazenamento
conforme o serviço correspondente cresce.

## 3. Modelo Relacional (PostgreSQL)

### 3.1 Diagrama Entidade-Relacionamento

```
  users                 user_gamification         leagues
  +----+           1:1  +----------------+   N:1  +--------+
  | id |<----------------| user_id (FK)   |------->| id     |
  |name|                | xp_total       |        | tier   |
  |... |                | streak_current |        | week_  |
  +----+                | hearts_current |        | ref    |
    |                   | gems           |        +--------+
    | 1:N                +----------------+             |
    v                                                    | 1:N
  gamification_events                          league_members
  +----------------+                            +----------------+
  | id             |                            | league_id (FK)|
  | user_id (FK)   |                            | user_id (FK)  |
  | event_type     |                            | xp_this_week  |
  | value          |                            +----------------+
  +----------------+

  users            achievements          shop_items        purchases
  +----+     1:N   +---------------+     +-----------+ 1:N +---------------+
  | id |----------->| user_id (FK)  |     | id        |<----| item_id (FK)  |
  +----+           | type          |     | name      |     | user_id (FK)  |
                    | unlocked_at   |     | price_gems|     | purchased_at  |
                    +---------------+     +-----------+     +---------------+
```

*Figura 1 — Diagrama entidade-relacionamento simplificado do domínio relacional (Users/Gamification).*

### 3.2 DDL Completo

> **Identidade delegada ao Supabase Auth (v1.3).** `users` deixou de ser dono de credencial — não
> existe mais `password_hash` aqui. O Supabase Auth mantém seu próprio `auth.users` (schema `auth`,
> gerenciado pelo provedor) com email/senha/OAuth; esta tabela é o **perfil de domínio**, criada
> automaticamente por um trigger no momento do cadastro (ver final desta seção). `id` não tem mais
> `DEFAULT gen_random_uuid()` — vem sempre de `auth.users.id` via FK.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Trigger: cria automaticamente o perfil de domínio (users + user_gamification) quando o
-- Supabase Auth cria um novo auth.users — mantém a app sem endpoint próprio de "criar perfil".
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

CREATE TABLE gamification_events_2026_08
  PARTITION OF gamification_events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_gamevents_user_time ON gamification_events(user_id, created_at DESC);
```

### 3.3 Dicionário de Dados — Tabelas Principais

| Tabela | Campo-chave | Observações |
|---|---|---|
| `users` | `id` (PK, FK para `auth.users`) | Perfil de domínio, não credencial — senha/OAuth vivem em `auth.users` (Supabase Auth). Criada via trigger `on_auth_user_created` (§3.2), nunca via `INSERT` da aplicação. Soft delete via `deleted_at` para conformidade LGPD sem perda de integridade referencial imediata. |
| `user_gamification` | `user_id` (PK/FK) | Relação 1:1 com `users`; separada para permitir escrita de alta frequência sem contenção na tabela principal de usuários. `xp_today`/`xp_today_date` seguem o mesmo padrão de `streak_last_active_date` (contador por fuso horário do usuário), mas com reset **preguiçoso** (lazy) em vez de job agendado — não há efeito colateral a disparar no reset (diferente do streak, que consome freeze/dispara notificação), então basta zerar `xp_today` na próxima escrita quando `xp_today_date` for anterior ao dia local atual. Ver `ArqLearn_TDD_Technical_Design_Document.md` §3.2. |
| `leagues` / `league_members` | `league_id` + `user_id` (PK composta) | Recriadas semanalmente pelo job de fechamento de liga (TDD §6). |
| `gamification_events` | `id` (PK), particionada por mês | Log append-only de eventos, usado para auditoria e Analytics; particionamento mensal facilita expurgo por retenção. |
| `purchases` | `idempotency_key` (UNIQUE) | Garante que retries de compra não gerem cobrança duplicada de gemas. |

*Tabela 2 — Dicionário de dados das tabelas relacionais principais.*

### 3.4 Índices e Particionamento

- `gamification_events` particionada por mês (RANGE em `created_at`); partições com mais de 13 meses são
  movidas para armazenamento frio (arquivamento) e removidas da instância operacional.
- Índice composto `(league_id, xp_this_week DESC)` em `league_members` para consultas de ranking com
  custo O(log n).
- Índice parcial em `users(tenant_id)` filtrando `deleted_at IS NULL`, mantendo o índice compacto e
  relevante para consultas ativas.
- Réplicas de leitura (read replicas) para relatórios do painel do professor e cargas do Analytics,
  isolando-as do tráfego transacional principal.

## 4. Modelo de Documentos (MongoDB)

### 4.1 Coleção: `tracks`

```json
{
  "_id": "track_urbanismo_101",
  "title": "Fundamentos de Urbanismo",
  "topic": "urbanismo",
  "origin": "curated" | "user_generated",
  "author_id": "uuid | null",
  "tenant_id": "uuid | null",
  "units": [
    {
      "id": "unit_1",
      "title": "Introdução ao Zoneamento",
      "order": 1,
      "lesson_ids": ["lesson_1", "lesson_2"]
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 4.2 Coleção: `lessons`

```json
{
  "_id": "lesson_1",
  "track_id": "track_urbanismo_101",
  "title": "Zoneamento e Uso do Solo",
  "difficulty": "easy" | "medium" | "hard",
  "question_ids": ["q_001", "q_002", "q_003"],
  "estimated_minutes": 6
}
```

> **`order` não é um campo desta coleção (v1.7).** A ordem pedagógica de uma lição vem da posição
> dela em `tracks.units[].lesson_ids` (§4.1), não de um campo próprio — `GET
> /v1/tracks/{track_id}/lessons` (API Spec §6) calcula `lesson.order` achatando as units da trilha
> (já ordenadas pelo campo `order` de cada unit) na hora de montar a resposta. Ler `lessons` direto,
> sem passar pela trilha, não dá a ordem correta.

### 4.3 Coleção: `questions`

```json
{
  "_id": "q_001",
  "lesson_id": "lesson_1",
  "type": "multiple_choice",
  "prompt": "Qual instrumento define os limites de gabarito em uma zona urbana?",
  "options": ["Plano Diretor", "Código de Obras", "Lei de Zoneamento", "EIA/RIMA"],
  "correct_answer": "Lei de Zoneamento",
  "explanation": "string curta, citando o raciocínio a partir do trecho-fonte",
  "difficulty": "medium",
  "source_upload_id": "uuid | null",
  "source_excerpt_ref": { "page": 12 },
  "review_status": "approved"
}
```

> **v1.6:** campo `explanation` adicionado — o Persona Prompt (`ArqLearn_IA_Persona_System_Prompt.md`
> §4, ponto 6) já exige esse campo na geração desde a v1.0, mas ele nunca tinha sido persistido no
> schema. Alimenta o campo `explicacao` da resposta de
> `POST /v1/lessons/{lesson_id}/answers` (API Spec §6) — sem ele o feedback de prática (Persona Prompt
> §5) não tem o que citar.
>
> **v1.7 — `options`/`correct_answer` armazenados como texto, expostos como id (API Spec §3.3/§6).**
> O storage não muda — continua string simples por opção e o texto exato da correta. A API pública é
> quem transforma isso em `{id, label}[]` (id = posição: "a", "b", "c"...) na hora de responder, e
> `POST .../answers` recebe de volta esse id, não o texto — comparar id em vez de string evita
> falso-negativo por acento/maiúscula (caso real documentado em `Docs/CLAUDE.md`). Reordenar
> `options` no banco muda quais ids existem — evitar editar essa lista in-place depois de publicada
> a pergunta, para não invalidar sessões já iniciadas com a ordem antiga.

### 4.4 Coleção: `user_progress`

```json
{
  "_id": "uuid_user-lesson_1",
  "user_id": "uuid",
  "lesson_id": "lesson_1",
  "status": "completed",
  "correct_count": 8,
  "wrong_count": 2,
  "srs_state": {
    "ease_factor": 2.3,
    "interval_days": 4,
    "next_review_at": "2026-08-13T00:00:00Z"
  },
  "updated_at": "datetime"
}
```

### 4.4.1 Coleção: `practice_sessions` *(v1.6)*

Estado efêmero de uma sessão de prática (`POST /v1/lessons/{lesson_id}/session` /
`POST /v1/lessons/{lesson_id}/answers`, API Spec §6) — não existia até a implementação destes dois
endpoints revelar a lacuna (a API Specification já citava `session_id`/`SESSION_NOT_FOUND`/
`SESSION_EXPIRED` desde a v1.0, mas nunca foi definido onde isso vive).

```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "lesson_id": "lesson_1",
  "question_ids": ["q_001", "q_002"],
  "answered_question_ids": [],
  "hearts_at_start": 5,
  "created_at": "datetime",
  "expires_at": "datetime"
}
```

Expira 30 minutos após `created_at` (mesmo prazo já documentado em `SESSION_EXPIRED`, API Spec §12) —
via índice TTL do MongoDB (`expireAfterSeconds: 0` sobre `expires_at`), então sessões abandonadas se
autolimpam sem job dedicado. Como a limpeza física do TTL do Mongo roda em um background task
periódico (não é instantânea), o backend também checa `expires_at < now()` explicitamente antes de
confiar que a ausência do documento significa "nunca existiu" — ver TDD/código para o tratamento exato
de `SESSION_NOT_FOUND` vs `SESSION_EXPIRED`.

> **Simplificação assumida nesta versão:** a fila de perguntas da sessão é, por ora, todo
> `lesson.question_ids` da lição alvo, na ordem em que estão salvos — não uma priorização por SRS
> vencido cruzando o banco de questões inteiro. O SRS (TDD §4) segue sendo aplicado por lição em
> `user_progress.srs_state`; uma fila verdadeiramente priorizada por pergunta exigiria SRS por
> pergunta, não por lição — mudança de schema maior, fora do escopo desta implementação. Sinalizado
> aqui para não silenciar a divergência com o texto do SAD RF-09 ("reintroduzindo perguntas erradas ou
> antigas").

### 4.5 Estratégia de Indexação (MongoDB)

| Coleção | Índices |
|---|---|
| `tracks` | `{topic: 1, origin: 1}` — suporta filtros da listagem de trilhas. |
| `lessons` | `{track_id: 1}` — recuperação ordenada das lições de uma trilha. |
| `questions` | `{lesson_id: 1, review_status: 1}` — fila de revisão e composição de sessão. |
| `user_progress` | `{user_id: 1, "srs_state.next_review_at": 1}` (composto) — consulta de itens vencidos para repetição espaçada. `{user_id: 1, lesson_id: 1}` (composto, adicionado ao implementar `GET /v1/tracks/{track_id}/lessons`) — monta o `progress_status` de todas as lições de uma trilha para o usuário autenticado sem varrer a coleção inteira. *(v1.5)* |
| `infinite_mode_sessions` | `{user_id: 1, status: 1}` — recuperar sessão ativa do usuário. *(v1.1)* |
| `content_summaries` | `{upload_id: 1}` (único) — um resumo ativo por upload. *(v1.1)* |
| `material_chat_messages` | `{upload_id: 1, user_id: 1, created_at: 1}` — histórico ordenado por thread. *(v1.1)* |
| `practice_sessions` | `{expires_at: 1}` (TTL, `expireAfterSeconds: 0`) — autolimpeza de sessões abandonadas. *(v1.6)* |

*Tabela 3 — Índices recomendados por coleção MongoDB.*

### 4.6 Coleção: `infinite_mode_sessions` *(v1.1)*

```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "topic": "estruturas",
  "status": "active | ended",
  "questions_answered": 42,
  "correct_count": 41,
  "xp_earned": 620,
  "avg_time_ms": 45000,
  "started_at": "datetime",
  "ended_at": "datetime | null"
}
```

Perguntas são selecionadas dinamicamente do banco de questões existente (filtradas por `topic`), sem uma
nova coleção de perguntas — reaproveita `questions` (§4.3). A sessão não pertence a nenhuma
`lesson`/`track`; existe apenas para agregar o estado da tela "Modo Infinito".

### 4.7 Coleção: `content_summaries` *(v1.1)*

```json
{
  "_id": "uuid",
  "upload_id": "uuid",
  "title": "Sistemas Construtivos",
  "synopsis": "string",
  "key_points": [
    { "title": "Alvenaria Estrutural vs. Vedação", "explanation": "string" }
  ],
  "architect_tip": "string | null",
  "source_chunk_ids": ["uuid"],
  "generated_at": "datetime"
}
```

`source_chunk_ids` referencia `content_chunks.id` (pgvector, Seção 5) — mesma exigência de
rastreabilidade já aplicada a `questions.source_excerpt_ref` (§4.3). Um upload tem no máximo um resumo
ativo; regeneração substitui o documento (não versiona por enquanto).

### 4.8 Coleção: `material_chat_messages` *(v1.1)*

```json
{
  "_id": "uuid",
  "upload_id": "uuid",
  "user_id": "uuid",
  "role": "user | assistant",
  "message": "string",
  "source_chunk_ids": ["uuid"],
  "created_at": "datetime"
}
```

Histórico de conversa por par `(upload_id, user_id)` — cada material tem sua própria thread por usuário,
nunca compartilhada entre uploads (a resposta do assistente é sempre ancorada ao RAG daquele upload
específico, ver Persona Prompt, seção "Regras para o Chat sobre o Material").

## 5. Modelo Vetorial (pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

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
```

Os chunks são retidos por 90 dias após a publicação das perguntas geradas, permitindo reprocessamento em
caso de feedback negativo, e então arquivados/expurgados conforme a política de retenção (Seção 9). É
também a base do RAG do Resumo Inteligente e do Chat sobre material (v1.1) — nenhum novo armazenamento
vetorial foi criado para essas duas features.

## 6. Cache (Redis) — Estruturas de Dados

| Chave | Estrutura | Detalhe |
|---|---|---|
| `user:{id}:profile` | String (JSON) | TTL 5 min; invalidada em escrita via evento `gamification.xp_awarded`. |
| `league:{id}:ranking` | Sorted Set | Score = `xp_this_week`; permite `ZREVRANGE` eficiente para o ranking. |
| `track:{id}:lessons` | String (JSON) | TTL 30 min. |
| `ratelimit:{user_id}` | Counter + TTL | Janela deslizante de 60s, algoritmo token bucket. |

*Tabela 4 — Estruturas de cache Redis e políticas de invalidação.*

## 7. Armazenamento de Objetos (S3) — Recapitulação

```
s3://arqlearn-uploads/{tenant_id}/{user_id}/{upload_id}/original.{ext}
s3://arqlearn-processed/{upload_id}/transcript.json
s3://arqlearn-processed/{upload_id}/frames/{timestamp_ms}.jpg
s3://arqlearn-media/lessons/{lesson_id}/cover.jpg
```

- Bucket de uploads brutos: criptografado (SSE-KMS), acesso somente via URL pré-assinada de curta
  duração.
- Lifecycle policy: arquivos brutos movidos para storage classe fria (ex.: Glacier/Infrequent Access)
  após 30 dias sem acesso.

## 8. Backup e Recuperação de Desastres

| Armazenamento | Estratégia |
|---|---|
| PostgreSQL | Backups completos diários + WAL contínuo (PITR); RPO alvo de 5 minutos, RTO alvo de 1 hora. Teste de restauração trimestral. |
| MongoDB | Snapshots diários do replica set + oplog para PITR; RPO de 15 minutos. |
| pgvector | Incluso no backup do PostgreSQL (mesma instância/extension). |
| Redis | Considerado cache descartável — não é fonte de verdade; RDB snapshot apenas para acelerar warm-up após reinício. |
| S3 | Versionamento de objeto habilitado + replicação cross-region para os buckets de uploads e processed. |

*Tabela 5 — Estratégia de backup e disaster recovery por armazenamento.*

## 9. Retenção e Arquivamento de Dados

- `gamification_events`: retenção ativa de 13 meses em partições operacionais; dados mais antigos são
  exportados para armazenamento analítico frio antes do expurgo.
- `content_chunks` (pgvector): retenção de 90 dias pós-publicação, conforme Seção 5.
- `infinite_mode_sessions`, `content_summaries` e `material_chat_messages` seguem a mesma política de
  `content_chunks`: retidos enquanto o upload de origem existir; removidos junto no expurgo por exclusão
  de conta (LGPD) ou remoção de material pelo usuário. *(v1.1)*
- Dados de usuário mediante solicitação de exclusão (LGPD): anonimização em até 30 dias, com hard delete
  de campos identificáveis e preservação apenas de métricas agregadas anônimas.
- Arquivos brutos enviados (S3): retidos enquanto a conta estiver ativa; removidos em até 30 dias após
  exclusão de conta ou solicitação explícita do usuário.

## 10. Escalabilidade e Sharding

- PostgreSQL: réplicas de leitura para Analytics/relatórios; particionamento horizontal (sharding) por
  `tenant_id` avaliado para a Fase 5 (multi-tenant institucional) do roadmap do SAD.
- MongoDB: sharding por `track_id` em cluster dedicado caso o catálogo de conteúdo gerado por usuários
  cresça além da capacidade de um único replica set.
- pgvector: índice `ivfflat` com parâmetro `lists` ajustável conforme volume de chunks; avaliação futura
  de migração para serviço vetorial dedicado (ex.: Pinecone) se a latência de busca degradar em escala.

## 11. Segurança de Dados

- Criptografia em repouso (AES-256) em todos os armazenamentos gerenciados; TLS 1.2+ em trânsito entre
  serviços e bancos.
- Credenciais (senha/OAuth) não são mais armazenadas por nós — vivem em `auth.users`, gerenciado e
  protegido pelo Supabase Auth. Nossa aplicação nunca lê nem retorna nada desse schema além do `id`
  (via a FK de `users`).
- Mascaramento de e-mail em logs e eventos de gamificação (`metadata` JSONB não armazena e-mail em texto
  livre).
- Isolamento lógico multi-tenant via `tenant_id` em todas as tabelas e coleções relevantes, reforçado por
  Row-Level Security no PostgreSQL para tenants institucionais.

## 12. Glossário de Dados

- **PITR (Point-In-Time Recovery)**: capacidade de restaurar o banco para um instante específico no
  passado usando backups e logs de transação.
- **RPO (Recovery Point Objective)**: perda máxima aceitável de dados, medida em tempo, em caso de
  desastre.
- **RTO (Recovery Time Objective)**: tempo máximo aceitável para restabelecer o serviço após um desastre.
- **Row-Level Security (RLS)**: mecanismo do PostgreSQL que restringe linhas visíveis por usuário/papel
  diretamente no nível do banco.
- **ivfflat**: tipo de índice aproximado (ANN) usado pelo pgvector para buscas de similaridade vetorial
  em grande escala.

— Fim do documento —
