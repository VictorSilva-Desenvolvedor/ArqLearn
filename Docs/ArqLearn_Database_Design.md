# DATABASE DESIGN
## ArqLearn

Modelo de dados detalhado: esquema relacional, documentos, vetores, cache e estratégias de persistência.

Versão 1.21 | Agosto de 2026
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
| 1.8 | 08/08/2026 | Equipe de Engenharia / Dados | Adiciona `confidence` a `questions` (já exigido pelo Persona Prompt §4.6-4.7 na geração, nunca persistido) — encontrado ao implementar `cmd/generate-questions`/`cmd/review-questions` (`ai-content-pipeline`); sem o campo, quem revisa não vê a autoavaliação de confiança do modelo |
| 1.9 | 09/08/2026 | Equipe de Engenharia / Dados | Adiciona a tabela `uploads` (Postgres) — nunca desenhada até então, deixava `content_chunks.upload_id` sem FK real. Ingestão real (R2 + extração de PDF + chunking + embeddings) implementada e testada ao vivo ponta a ponta |
| 1.10 | 09/08/2026 | Equipe de Engenharia / Dados | Documenta o schema real de `infinite_mode_sessions` (§4.4.2) — o índice já listado em §4.5 desde a v1.1 era especulativo (`{user_id, status}`, campo `status` nunca existiu) e nunca tinha sido criado de fato; implementação real do Modo Infinito usa TTL sobre `expires_at`, mesmo padrão de `practice_sessions` |
| 1.11 | 09/08/2026 | Equipe de Engenharia / Dados | Adiciona a coleção `infinite_mode_generation_state` (§4.4.3) — trava de geração em segundo plano do Modo Infinito de Maquetes (decisão revisada em Docs/PENDENCIAS_IA.md #7, API Spec §6.1). Remove o §4.6 antigo (schema especulativo da v1.1 com campos `status`/`started_at`/`ended_at` que nunca chegaram a existir — divergia do schema real já documentado em §4.4.2 desde a v1.10, mantê-lo era ativamente enganoso) |
| 1.12 | 09/08/2026 | Equipe de Engenharia / Dados | Adiciona a coleção `notifications` (§4.4.4) — schema nunca desenhado antes (endpoint stub desde a v1.0). Adiciona `notifications_enabled`/`push_enabled`/`email_enabled` a `users` (§3.2) — `PATCH /v1/users/me` e `PATCH /v1/notifications/preferences` agora reais |
| 1.13 | 09/08/2026 | Equipe de Engenharia / Dados | Adiciona a coleção `bug_reports` (§4.4.5, a pedido do usuário) — print embutido como base64 pra não depender do R2 bloqueado. Adiciona `bug_fixed` ao enum de `notifications.type` (§4.4.4) — primeiro gatilho síncrono real que insere notificação, sem depender de job |
| 1.14 | 09/08/2026 | Equipe de Engenharia / Dados | `bug_reports` (§4.4.5) ganha `type` (`bug \| suggestion`) e `device_model`/`device_type` (a pedido do usuário) — mesma coleção passa a cobrir sugestões de melhoria, não só bugs. Adiciona `suggestion_implemented` ao enum de `notifications.type` (§4.4.4) |
| 1.15 | 09/08/2026 | Equipe de Engenharia / Dados | Adiciona 15 contadores vitalícios a `user_gamification` (migrations/0006, a pedido do usuário) — nenhum contador cumulativo existia antes, só saldos atuais (xp_total/gems), que não servem pra checar limiar tipo "responda 100 perguntas ao todo". `achievements` (schema inalterado desde v1.0) passa a ser gravada de verdade pela primeira vez — catálogo completo em `internal/gamification/achievements.go` |
| 1.16 | 15/08/2026 | Equipe de Engenharia / Dados | VIP "Mestre Arquiteto" (migrations/0011, a pedido do usuário) — adiciona `is_vip`/`vip_expires_at` e contadores de reset de baú a `user_gamification`, e a tabela `vip_coupons` (ativação por cupom de 10 dígitos; assinatura recorrente tem schema pronto porém desabilitada, ver API Spec §8.3). **Nota:** as colunas de `migrations/0009_daily_chest`/`0010_weekly_chest` (Baú Diário/Semanal) ainda não estavam documentadas aqui antes desta entrada — divergência pré-existente entre código e este documento, sinalizada e não resolvida retroativamente nesta mudança (fora do escopo desta demanda) |
| 1.17 | 18/08/2026 | Equipe de Engenharia / Dados | Adiciona a tabela `user_push_tokens` (§3.2 DDL, §3.3 dicionário, migrations/0012, a pedido do usuário) — infraestrutura de push notification real (API Spec §9 v1.21); um usuário pode ter várias linhas (vários devices), `token` é `UNIQUE` |
| 1.18 | 18/08/2026 | Equipe de Engenharia / Dados | Adiciona a tabela `answer_submissions` (§3.2 DDL, §3.3 dicionário, migrations/0013) — achado em `/impeccable critique`: `POST .../answers` (lição e Modo Infinito) não tinham nenhuma proteção contra reprocessamento em retry, diferente de `purchases`. Mesmo padrão de `idempotency_key UNIQUE`, mas guardando o corpo da resposta 200 (`response` JSONB) pra devolver no replay, já que os efeitos colaterais (XP/vidas/streak/baú/conquista) precisam ser vistos como já processados, não como conflito (API Spec §6/§6.1/§2.6 v1.22) |
| 1.19 | 20/08/2026 | Equipe de Engenharia / Dados | Adiciona a tabela `user_cosmetics` (§3.2 DDL, migrations/0015) — inventário de posse dos itens `category='cosmetic'` da Loja; achado do porte de gamificação (`Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`): comprar um cosmético não tinha nenhum efeito/registro de posse antes disso |
| 1.20 | 20/08/2026 | Equipe de Engenharia / Dados | §3.4: `gamification_events` nunca recebeu nenhum `INSERT` desde a v1.0 — só tinha a partição de agosto/2026 (a de setembro quebraria em ~10 dias, achado do porte de gamificação, `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`). Migration 0016 cria set/out/nov como colchão; `cmd/ensure-event-partitions` (cron mensal) garante as próximas daqui pra frente — documentado abaixo. Tabela passa a ser escrita de verdade por `internal/gamification.RecordEvent` |
| 1.21 | 20/08/2026 | Equipe de Engenharia / Dados | §4.4.1: adiciona `combo_atual`/`combo_maximo` a `practice_sessions` (TDD §3.0.1) — bônus de combo substitui o antigo bônus de velocidade no cálculo de XP (achado do porte de gamificação, `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`: premiar velocidade cria incentivo a responder apressado) |

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Preferências de notificação (migrations/0003 e 0005, v1.11) — notifications_enabled é a
  -- preferência geral (PATCH /v1/users/me); push_enabled/email_enabled são por canal
  -- (PATCH /v1/notifications/preferences, API Spec §9). Duas rotas distintas, três colunas.
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true
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
  streak_freezes_available SMALLINT NOT NULL DEFAULT 0,
  -- Contadores vitalícios (migrations/0006, v1.15) — usados só pra avaliar condição de
  -- desbloqueio de conquistas (tabela `achievements` abaixo); nenhum outro lugar do produto lê
  -- estas colunas. Nunca resetam (diferente de xp_today), cada um incrementado no handler da
  -- ação correspondente.
  lessons_completed_total INTEGER NOT NULL DEFAULT 0,
  answers_correct_total INTEGER NOT NULL DEFAULT 0,
  perfect_lessons_total INTEGER NOT NULL DEFAULT 0,
  explain_used_total INTEGER NOT NULL DEFAULT 0,
  infinite_questions_total INTEGER NOT NULL DEFAULT 0,
  infinite_correct_streak_current INTEGER NOT NULL DEFAULT 0,
  infinite_correct_streak_best INTEGER NOT NULL DEFAULT 0,
  infinite_sessions_total INTEGER NOT NULL DEFAULT 0,
  shop_purchases_total INTEGER NOT NULL DEFAULT 0,
  gems_spent_total INTEGER NOT NULL DEFAULT 0,
  uploads_total INTEGER NOT NULL DEFAULT 0,
  summaries_generated_total INTEGER NOT NULL DEFAULT 0,
  material_chat_messages_total INTEGER NOT NULL DEFAULT 0,
  bug_reports_total INTEGER NOT NULL DEFAULT 0,
  bug_reports_resolved_total INTEGER NOT NULL DEFAULT 0,
  -- VIP "Mestre Arquiteto" (migrations/0011, v1.16, a pedido do usuário). Expiração preguiçosa —
  -- ver EhVIPAtivo em internal/gamification/algorithms.go, mesmo espírito de hearts_updated_at.
  -- Os contadores de reset de baú seguem o mesmo padrão preguiçoso de xp_today/xp_today_date:
  -- vip_daily_chest_resets_date compara contra o dia local vigente; vip_weekly_chest_resets_
  -- cycle_start compara contra o chest_weekly_cycle_start já existente acima (não é um ciclo
  -- próprio). Nota: as colunas do Baú Diário/Semanal em si (chest_questions_today,
  -- chest_questions_date, chest_claimed_date, chest_weekly_questions, chest_weekly_cycle_start,
  -- chest_weekly_claimed_cycle_start — migrations/0009 e 0010) faltavam nesta tabela documentada
  -- até esta versão; adicionadas aqui junto das colunas VIP que dependem delas.
  chest_questions_today SMALLINT NOT NULL DEFAULT 0 CHECK (chest_questions_today >= 0),
  chest_questions_date DATE,
  chest_claimed_date DATE,
  chest_weekly_questions SMALLINT NOT NULL DEFAULT 0 CHECK (chest_weekly_questions >= 0),
  chest_weekly_cycle_start DATE,
  chest_weekly_claimed_cycle_start DATE,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  vip_expires_at TIMESTAMPTZ,
  vip_daily_chest_resets_used SMALLINT NOT NULL DEFAULT 0 CHECK (vip_daily_chest_resets_used >= 0),
  vip_daily_chest_resets_date DATE,
  vip_weekly_chest_resets_used SMALLINT NOT NULL DEFAULT 0 CHECK (vip_weekly_chest_resets_used >= 0),
  vip_weekly_chest_resets_cycle_start DATE,
  vip_subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (vip_subscription_status IN ('none', 'pending', 'active', 'canceled'))
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

-- Schema inalterado desde a v1.0 — o que mudou na v1.15 foi o código que grava aqui (nada
-- gravava antes). Conquistas em nível (ex.: "infinito_sem_erros_1".."_5") são uma linha por
-- nível, não uma coluna "tier" — UNIQUE(user_id, type) trata cada nível como desbloqueio
-- independente. Catálogo completo (condições, níveis, recompensas) em
-- services/monolith/internal/gamification/achievements.go — não duplicado aqui.
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

-- VIP "Mestre Arquiteto" (migrations/0011, v1.16, a pedido do usuário). Cupons de 10 dígitos
-- numéricos gerados por um admin (POST /v1/vip/coupons) e entregues manualmente fora do sistema
-- (sem painel admin ainda). redeemed_by NULL = ainda não resgatado; UNIQUE(code) + WHERE
-- redeemed_by IS NULL na trava de resgate evitam a corrida de duas requisições resgatando o mesmo
-- código ao mesmo tempo.
CREATE TABLE vip_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(10) NOT NULL UNIQUE,
  duration_days SMALLINT NOT NULL CHECK (duration_days > 0),
  created_by UUID NOT NULL REFERENCES users(id),
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tokens de push notification real (migrations/0012, v1.17, a pedido do usuário) — API Spec §9
-- v1.21. Um usuário pode ter várias linhas (vários devices); token é UNIQUE, não user_id: um
-- device trocando de conta atualiza a linha existente em vez de acumular token órfão. id sem
-- DEFAULT — gerado em Go via uuid.NewString(), mesmo padrão do resto do pacote notifications
-- (não gen_random_uuid() do Postgres).
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_push_tokens_user ON user_push_tokens(user_id);

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

-- Inventário de posse dos itens category='cosmetic' (migrations/0015, v1.19) — antes desta
-- tabela, comprar um cosmético só gravava a transação em `purchases` (comprovante), sem nenhum
-- registro de "o que o usuário tem hoje" nem efeito visível (achado do porte de gamificação,
-- Docs/ArqLearn_Backlog_Gamificacao_Atelie.md). `equipped` default true: sem tela de "trocar
-- equipado" ainda, comprar já ativa o efeito.
CREATE TABLE user_cosmetics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shop_items(id),
  equipped BOOLEAN NOT NULL DEFAULT true,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX idx_user_cosmetics_user_equipped ON user_cosmetics(user_id) WHERE equipped;

-- Idempotência de POST /v1/lessons/{lesson_id}/answers e
-- POST /v1/infinite-mode/sessions/{session_id}/answers (migrations/0013, v1.22) — mesmo espírito
-- de purchases.idempotency_key acima, mas guarda o corpo da resposta 200 inteiro (`response`) pra
-- devolver o mesmo resultado num replay, em vez de só bloquear a repetição: os dois endpoints têm
-- efeitos colaterais (XP/vidas/streak/baú/conquista) que precisam ser vistos como já processados
-- pelo cliente, não como um erro de conflito.
CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL,   -- practice_sessions._id ou infinite_mode_sessions._id (Mongo) — sem FK, banco diferente
  question_id TEXT NOT NULL,  -- questions._id (Mongo) — sem FK, banco diferente
  idempotency_key VARCHAR(64) NOT NULL UNIQUE,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_answer_submissions_user ON answer_submissions(user_id);

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
| `user_cosmetics` | `user_id` + `item_id` (PK composta) | Inventário de posse dos itens `category='cosmetic'` — `purchases` já registrava a transação, mas nada marcava "o que o usuário tem hoje"; `ON CONFLICT DO NOTHING` na inserção evita duplicar linha numa recompra do mesmo item. |
| `vip_coupons` | `code` (UNIQUE) | Cupons VIP de 10 dígitos numéricos; `redeemed_by IS NULL` distingue disponível de já resgatado — não há coluna booleana solta pra isso, evitando os dois campos divergirem. |
| `user_push_tokens` | `token` (UNIQUE) | Token de push Expo por device; `UNIQUE` é no token, não no `user_id` — um usuário tem 1 linha por device (múltiplos devices = múltiplas linhas), e um device que troca de conta atualiza a linha existente em vez de acumular token órfão. |
| `answer_submissions` | `idempotency_key` (UNIQUE) | Garante que retries de submissão de resposta (lição ou Modo Infinito) não concedam XP/vidas/streak/baú/conquista em dobro — `response` guarda o corpo 200 original pra devolver no replay. |

*Tabela 2 — Dicionário de dados das tabelas relacionais principais.*

### 3.4 Índices e Particionamento

- `gamification_events` particionada por mês (RANGE em `created_at`); partições com mais de 13 meses são
  movidas para armazenamento frio (arquivamento) e removidas da instância operacional. Partições futuras
  são criadas por `cmd/ensure-event-partitions` (`.github/workflows/ensure-event-partitions.yml`, cron
  mensal, `CREATE TABLE IF NOT EXISTS` idempotente) — a tabela nasceu (v1.4/migrations/0001) só com a
  partição do mês de criação, sem automação nenhuma até a migration 0016/v1.20.
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
  "difficulty": "easy" | "medium" | "hard" | "impossible",
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
  "confidence": "high | medium | low",
  "source_upload_id": "uuid | null",
  "source_excerpt_ref": { "page": 12 },
  "review_status": "approved"
}
```

> **v1.8 — `confidence`.** Autoavaliação do modelo na geração (Persona Prompt §4, pontos 6-7) — `low`
> deveria ir obrigatoriamente para revisão humana antes de publicar. Existia na saída estruturada da IA
> desde sempre, mas nunca tinha sido persistida; sem o campo, `cmd/review-questions` não tinha como
> mostrar pra quem revisa o quão confiante o modelo estava.

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
  "combo_atual": 0,
  "combo_maximo": 0,
  "created_at": "datetime",
  "expires_at": "datetime"
}
```

`combo_atual`/`combo_maximo` *(v1.21)*: estado do bônus de combo (TDD §3.0.1) — `combo_atual` zera a
cada resposta errada, `combo_maximo` guarda o pico da sessão e nunca decresce; é sobre ele que
`calcularXP` (TDD §3) calcula o bônus, uma única vez, na última pergunta. Substitui o antigo bônus de
velocidade por resposta individual.

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

### 4.4.2 Coleção: `infinite_mode_sessions` *(v1.9)*

Estado efêmero de uma sessão de Modo Infinito (`POST /v1/infinite-mode/sessions` e sub-rotas, API
Spec §6.1) — mesmo motivo de `practice_sessions` (§4.4.1) existir: os endpoints já eram
documentados desde a v1.1, mas nunca foi definido onde o estado vive até a implementação real.
Schema efetivamente implementado diverge do índice que já estava listado em §4.5 antes desta
versão (`{user_id, status}` — especulativo, nunca existiu campo `status`); corrigido abaixo.

```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "topic": "maquetes",
  "shown_question_ids": ["q_001", "q_002"],
  "questions_answered": 2,
  "correct_count": 1,
  "total_time_ms": 8500,
  "total_xp_earned": 45,
  "created_at": "datetime",
  "expires_at": "datetime"
}
```

Mesmo padrão de expiração de `practice_sessions`: TTL de 30 minutos sobre `expires_at`
(`expireAfterSeconds: 0`), sem job de limpeza dedicado. `shown_question_ids` evita repetir
pergunta dentro da mesma sessão; quando o pool de perguntas aprovadas do tópico se esgota,
`next_question` sai ausente da resposta (API Spec §6.1) e o cliente trata como fim natural.

### 4.4.3 Coleção: `infinite_mode_generation_state` *(v1.11)*

Trava de geração em segundo plano do Modo Infinito (API Spec §6.1, decisão revisada em
Docs/PENDENCIAS_IA.md #7) — um documento por `topic`, `_id` = o próprio topic. Garante que no
máximo um lote de perguntas seja gerado por vez para o mesmo tópico, mesmo se duas sessões
cruzarem o limiar de 20 perguntas quase simultaneamente (evita duplicar custo de chamada ao
Gemini). `next_unit_number` roda entre 1-4, alternando qual unidade-fonte
(`questiongen/sourcetext/unidadeN.txt`) alimenta o próximo lote.

```json
{
  "_id": "maquetes",
  "in_progress": false,
  "next_unit_number": 3,
  "next_batch_label": 5,
  "updated_at": "datetime"
}
```

`in_progress: true` só persiste enquanto a goroutine de geração roda (tipicamente segundos); um
documento travado há mais de 5 minutos é tratado como órfão (processo morreu no meio) e
destravado automaticamente na próxima tentativa — sem isso, uma falha no meio da geração
travaria o crescimento do pool para sempre. Sem TTL: diferente de `practice_sessions` e
`infinite_mode_sessions`, este documento é permanente (um por tópico, não por sessão de usuário).

### 4.4.4 Coleção: `notifications` *(v1.11)*

Notificações in-app do usuário (`GET /v1/notifications`, API Spec §9) — schema nunca tinha sido
desenhado antes (endpoint stub desde a v1.0). Permanente, sem TTL — diferente das coleções de
sessão efêmera acima, notificação não expira sozinha.

```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "type": "streak_at_risk | league_promotion | league_demotion | new_challenge | questions_ready_for_review | welcome | bug_fixed | suggestion_implemented",
  "message": "string",
  "read": false,
  "created_at": "datetime"
}
```

Nenhum código ainda insere documento nesta coleção — os gatilhos (streak em risco, promoção de
liga etc.) dependem de jobs agendados que não existem (mesmo motivo de `cmd/worker` não consumir
fila real, ver `Docs/CLAUDE.md`). `GET /v1/notifications` é real e funcional, só que
legitimamente devolve lista vazia até algum gatilho passar a escrever aqui. **Exceção (v1.13):**
`bug_fixed`/`suggestion_implemented` *(v1.14)* SÃO inseridos de verdade por
`POST /v1/bug-reports/{id}/resolve` (§4.4.5, API Spec §14) — primeiro gatilho síncrono real desta
coleção, sem depender de job nenhum.

### 4.4.5 Coleção: `bug_reports` *(v1.13, v1.14 — a pedido do usuário)*

Relatos enviados pela aba "Ajuda e Bugs" (API Spec §14) — nome da coleção mantido por continuidade
mesmo cobrindo dois `type` desde a v1.14 (`bug` e `suggestion`, sugestão de melhoria), não é uma
coleção separada. Permanente, sem TTL. `screenshot_base64` guarda o print embutido no próprio
documento — decisão explícita pra não depender do R2, que está bloqueado
(`Docs/PENDENCIAS_IA.md` #1); ver a nota de decisão na API Spec §14 sobre migrar pra `storage_key`
do R2 depois.

```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "type": "bug | suggestion",
  "description": "string",
  "screenshot_base64": "string | null",
  "device_model": "string | null",
  "device_type": "mobile | desktop | tablet | null",
  "status": "open | fixed",
  "created_at": "datetime",
  "resolved_at": "datetime | null"
}
```

`device_model`/`device_type` *(v1.14)* só são preenchidos quando `type: "bug"` — o formulário só
mostra esses campos nesse caso, mas o schema não impõe a regra (documento com `type: "suggestion"`
e os dois campos nulos é o caminho normal).

`status: "fixed"` só é alcançado via `POST /v1/bug-reports/{id}/resolve` (admin), que também credita
gemas ao `user_id` do relato (`user_gamification.gems`, Postgres — **10** se `type: "bug"`, **50**
se `type: "suggestion"`, API Spec §14) e insere a notificação correspondente (`bug_fixed` ou
`suggestion_implemented`, acima) pro mesmo usuário — dois efeitos síncronos no mesmo handler, sem
fila (volume baixo demais pra justificar um evento dedicado, diferente de `gamification.xp_awarded`).

### 4.5 Estratégia de Indexação (MongoDB)

| Coleção | Índices |
|---|---|
| `tracks` | `{topic: 1, origin: 1}` — suporta filtros da listagem de trilhas. |
| `lessons` | `{track_id: 1}` — recuperação ordenada das lições de uma trilha. |
| `questions` | `{lesson_id: 1, review_status: 1}` — fila de revisão e composição de sessão. |
| `user_progress` | `{user_id: 1, "srs_state.next_review_at": 1}` (composto) — consulta de itens vencidos para repetição espaçada. `{user_id: 1, lesson_id: 1}` (composto, adicionado ao implementar `GET /v1/tracks/{track_id}/lessons`) — monta o `progress_status` de todas as lições de uma trilha para o usuário autenticado sem varrer a coleção inteira. *(v1.5)* |
| `infinite_mode_sessions` | `{expires_at: 1}` (TTL, `expireAfterSeconds: 0`) — mesmo padrão de `practice_sessions`. *(v1.1, corrigido na v1.9 — ver §4.4.2)* |
| `content_summaries` | `{upload_id: 1}` (único) — um resumo ativo por upload. *(v1.1)* |
| `material_chat_messages` | `{upload_id: 1, user_id: 1, created_at: 1}` — histórico ordenado por thread. *(v1.1)* |
| `notifications` | `{user_id: 1, created_at: -1}` — listagem paginada, mais recentes primeiro. *(v1.11)* |
| `practice_sessions` | `{expires_at: 1}` (TTL, `expireAfterSeconds: 0`) — autolimpeza de sessões abandonadas. *(v1.6)* |
| `infinite_mode_generation_state` | Nenhum índice adicional — um documento por tópico, sempre buscado por `_id` (já indexado por padrão). *(v1.11)* |
| `bug_reports` | `{status: 1, type: 1, created_at: -1}` — fila de admin filtrada por status e/ou tipo, mais recentes primeiro. *(v1.13, `type` adicionado na v1.14)* |

*Tabela 3 — Índices recomendados por coleção MongoDB.*

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

`content_chunks.upload_id` referencia `uploads.id` (tabela definida logo abaixo) — o registro de
upload em si (dono, arquivo original, status de processamento) vive no Postgres, não no MongoDB, pra
manter a FK nativa em vez de um join manual entre um `_id` string (Mongo) e um `UUID` (Postgres). Ver
`migrations/0002_uploads.up.sql`.

```sql
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
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
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

Ingestão real (PDF → R2 → extração → chunk → embedding) implementada e testada ao vivo — ver
`ai-content-pipeline/internal/pdfextract`, `internal/pgstore` e `cmd/ingest-file`. Sem OCR/Speech-to-Text
ainda (fora de escopo até um PDF escaneado ou vídeo aparecer de verdade — ver `Docs/PENDENCIAS_IA.md`).

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
