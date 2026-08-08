# CLAUDE.md

Este arquivo orienta o Claude (via Claude Code ou qualquer agente de IA) ao trabalhar neste
repositório. Ele resume as decisões já tomadas nos documentos formais do projeto — leia-os antes de
propor mudanças arquiteturais; não os reescreva a partir do código sem sincronizar as duas pontas.

> **Fase atual: bootstrap.** Alvo de **5–20 usuários nos primeiros 3 meses** — não de escala. Antes de
> sugerir Kubernetes, um novo microsserviço separado, ou qualquer infraestrutura paga, leia
> `ArqLearn_Estrategia_Bootstrap.md`. O SAD descreve a arquitetura-alvo; este projeto **ainda não está
> nela**.

## Documentos de referência (fonte da verdade)

Os documentos abaixo em **Markdown são a fonte da verdade atual** — mantidos diretamente, sem
intermediário de addendum. Os `.docx` de mesmo nome que ainda existem na pasta são o **snapshot
histórico da v1.0** (pré-consolidação) e não são mais atualizados; não edite-os nem os use como
referência para trabalho novo.

| Documento | Conteúdo | Quando consultar |
|---|---|---|
| `Docs/ArqLearn_Documento_Arquitetura_Software.md` (SAD) | Visão arquitetural, requisitos, componentes, riscos | Antes de criar um novo serviço ou mudar o estilo arquitetural |
| `Docs/ArqLearn_TDD_Technical_Design_Document.md` (TDD) | Algoritmos de negócio (calcularXP, limite diário de XP, curva de nível, SRS/SM-2, streak, fechamento de liga), contratos de evento, sequence flows | Antes de implementar lógica de negócio ou integração assíncrona entre serviços |
| `Docs/ArqLearn_API_Specification.md` | Contrato REST completo (rotas, payloads, erros) | Antes de alterar/criar qualquer endpoint |
| `Docs/ArqLearn_Database_Design.md` | DDL Postgres, schemas MongoDB, pgvector, cache, backup/retenção | Antes de migrar schema ou adicionar tabela/coleção |
| `Docs/ArqLearn_IA_Persona_System_Prompt.md` | System prompt e guardrails da IA (Arq) | Antes de alterar prompts do AI Content Pipeline |
| `Docs/ArqLearn_Documento_Tecnico_Design.docx` (UX) | Arquitetura de informação, fluxos de tela, tokens de design, especificação visual da gamificação | Antes de implementar UI em `apps/mobile`/`apps/web` |
| `Docs/stitch_app_visual_identity/` | Identidade visual completa (17/17 telas — ver `PENDENCIAS_TELAS.md`): logo, telas de alta fidelidade em `code.html`/`screen.png`, tokens em `blueprint_narrative/DESIGN.md` | Ao construir componentes visuais — usar como referência de layout/cor/tipografia, não copiar o HTML estático direto para produção |
| `Docs/ArqLearn_Estrategia_Bootstrap.md` | Topologia gratuita/de baixo custo para a fase de 5–20 usuários (Fases 0–2 do roadmap), tabela de substituição por camada, gatilhos de graduação para a arquitetura-alvo | **Sempre, nesta fase** — antes de escolher onde/como implantar qualquer coisa |

**Nota sobre "TDD":** dois documentos usam esse nome de formas diferentes. O
`ArqLearn_TDD_Technical_Design_Document.md` (linha acima) é o TDD no sentido "Technical Design Document"
— algoritmos e contratos de evento. O `ArqLearn_Documento_Tecnico_Design.docx` é sobre UX/sistema de
design, apesar do nome parecido. Não confundir os dois ao seguir uma referência "ver TDD".

Se o código e um documento divergirem, pare e sinalize a divergência em vez de assumir qual dos dois
está certo — não resolva isso silenciosamente.

## O que é o projeto

ArqLearn é uma plataforma gamificada (estilo Duolingo) de estudo de Arquitetura e Urbanismo. O usuário
envia arquivos/vídeos; um pipeline de IA gera exercícios; o usuário pratica diariamente e é recompensado
com XP, streak, vidas, ligas e conquistas.

Arquitetura: microsserviços orientados a eventos, plano síncrono (API Gateway + serviços de negócio) e
plano assíncrono (Ingestion + AI Content Pipeline) conectados por barramento de eventos (Amazon SQS/SNS).

## Estrutura de repositório esperada

**Fase atual (bootstrap — ver `ArqLearn_Estrategia_Bootstrap.md` §2, Monólito Modular). Esta é a
estrutura real já criada no repositório, não um plano:**

```
/services
  /monolith             (Go — módulo próprio, go.mod "arqlearn/monolith". Pacotes internos por
                          domínio em /internal:
                            - users: perfil (GET /v1/users/me real, Postgres via internal/db).
                            - learning: GET /v1/tracks, GET /v1/tracks/{track_id}/lessons, POST
                              .../session, POST .../answers e POST
                              .../questions/{question_id}/explain reais (session.go/answers.go/
                              explain.go) — cruza MongoDB (lessons/questions/user_progress/
                              practice_sessions) com Postgres (user_gamification), chamando
                              internal/gamification para calcularXP/SRS/streak e
                              internal/groqclient (Groq, "explique melhor") pra aprofundamento
                              sob demanda (API Spec §6, v1.6). practice_sessions tem TTL de 30min
                              (Database Design §4.4.1); Modo Infinito/Resumo/Chat ainda stub.
                              Três pegadinhas de contrato encontradas ao integrar com apps/web,
                              já corrigidas nos dois lados — não reintroduzir: (1) question.options
                              é {id,label}[] com id por posição ("a","b"...), NUNCA o texto — API
                              Spec §3.3/§6 e Database Design §4.3 explicam o porquê; (2)
                              lesson.order não existe no banco, é calculado a partir de
                              track.units (Database Design §4.2) — nunca ordenar lições por _id;
                              (3) track.description existe em types/api.ts do web/mobile e em
                              alguns documentos de tracks no MongoDB (ex.: seeds/*.js), mas o
                              struct `track` em internal/learning/learning.go NÃO tem esse campo
                              (nem lê, nem serializa) e ele também não está na API Spec nem no
                              schema documentado de `tracks` (Database Design §4.1) — é só
                              convenção do mock do frontend. Gravar description no Mongo é
                              inofensivo (Go ignora campo bson desconhecido), mas não esperar que
                              apareça em GET /v1/tracks até alguém decidir formalizar o campo nos
                              três lugares. (4) `review_status` de `questions` (Database Design
                              §4.3) NÃO é filtrado em nenhum lugar do código hoje —
                              `handleStartSession` busca perguntas só por
                              `_id: {$in: l.QuestionIDs}`, sem checar `review_status`. Uma pergunta
                              `pending` aparece numa sessão real exatamente como uma `approved`.
                              `seeds/002_maquetes_licoes_perguntas.js` grava as 20 perguntas de
                              Maquetes como `pending` de propósito (nunca foram revisadas por
                              humano), mas isso hoje é só metadado — não filtra nada. Implementar
                              esse filtro antes de tratar `review_status` como controle de
                              publicação de verdade. (5) Saída do Gemini (geminiclient.
                              GenerateQuestions) NÃO garante `correct_answer` idêntico a um item
                              de `options[]`, mesmo com responseSchema — confirmado ao vivo: numa
                              chamada de teste real, uma pergunta veio com correct_answer faltando
                              uma palavra em relação à option correspondente. Se isso for gravado
                              como está, correctOptionID() (session.go) não acha a opção certa e
                              toda resposta do usuário pra aquela pergunta é avaliada como errada.
                              geminiclient.Validate() confere esse e outros invariantes — SEMPRE
                              rodar antes de aceitar output do modelo como publicável (nunca
                              gravar direto no Mongo sem passar por ele).
                            - gamification: algorithms.go tem calcularXP/Nivel/AtualizarSRS/
                              AtualizarStreak como funções puras testadas (algorithms_test.go),
                              usadas por learning — as rotas HTTP deste pacote (/v1/gamification/*)
                              continuam stub.
                            - ingestion, notifications, analytics: stub.
                          Toda rota sem menção acima é stub 501 NOT_IMPLEMENTED via
                          internal/apierror — ver ArqLearn_API_Specification.md para o contrato
                          real de cada uma antes de implementar. internal/authmiddleware valida o
                          JWT do Supabase Auth (chama /auth/v1/user, não verifica assinatura
                          localmente — ver comentário no arquivo). internal/db (Postgres/pgx) e
                          internal/documentdb (MongoDB) abrem os pools a partir de
                          DATABASE_URL/MONGODB_URI — ambos com fallback gracioso: sem a env var, o
                          serviço sobe mesmo assim e /ready reporta 503 com o motivo, em vez de
                          derrubar o processo. migrations/0001_init.{up,down}.sql é a tradução 1:1
                          do schema Postgres em ArqLearn_Database_Design.md §3.2/§5, já aplicada
                          no Supabase real — ver nota sobre o pooler abaixo.
                          **Armadilha de teste manual (não é bug de código):** neste ambiente,
                          `curl -d "string com acento"` via Git Bash → curl.exe do Windows corrompe
                          UTF-8 (ex.: "í" vira replacement character). Sempre testar payload com
                          acento gravando um arquivo JSON e usando `curl --data-binary @arquivo`,
                          nunca `-d` inline, ou um falso-positivo de bug de comparação de string
                          vai aparecer onde não existe.)
  /ai-content-pipeline  (Go — módulo próprio, go.mod "arqlearn/ai-content-pipeline". Processo
                          assíncrono separado — já nasce desacoplado por fila no SAD §9, não
                          muda nesta fase. internal/pipeline define os 6 estágios do SAD §9.1–9.6;
                          o motor de chamada de IA do estágio 4 (geração de perguntas) já é real
                          — internal/geminiclient, testado ao vivo contra a API do Gemini — mas a
                          função generateQuestions() em si continua stub porque os estágios 1-3
                          (extração/RAG) não existem ainda pra alimentá-la com texto de verdade
                          dentro do fluxo de evento. Usável hoje fora desse fluxo via
                          `go run ./cmd/generate-questions -text=arquivo.txt -page=N -count=N`
                          (texto colado manualmente, saída em JSON validada por
                          geminiclient.Validate() antes de imprimir). cmd/worker/main.go ainda não
                          consome SQS de verdade — TODO explícito no código.)
/apps
  /web    (Next.js — App Router, TypeScript, Tailwind v4. Tokens de
           blueprint_narrative/DESIGN.md portados para src/app/globals.css via @theme; fontes
           Hanken Grotesk/Inter/JetBrains Mono carregadas em src/app/layout.tsx. O Painel do
           Professor (SAD §8, UX doc §5.M) é um route group aqui dentro, não um app separado —
           mais simples e mais barato na fase bootstrap; criar como app à parte só se um gatilho
           real de graduação (Estrategia_Bootstrap §7) justificar o isolamento.)
  /mobile (Expo + React Native + TypeScript, expo-router (file-based routing). **Raiz das rotas é
           `src/app`, não `app/`** — expo-router detecta e usa `src/app` automaticamente por existir
           um diretório `src/` no projeto (código não roteável fica em `src/theme`, `src/components`,
           `src/contexts`, `src/mocks`, `src/types`, fora de `src/app`); confundir os dois quebra o
           roteamento em silêncio. `src/app/(tabs)/_layout.tsx` implementa a navegação por abas
           Home/Explorar/Liga/Perfil (UX doc §11) via `Tabs` do expo-router. Home
           (`(tabs)/index.tsx`) espelha `apps/web`'s `(shell)/page.tsx` — mesma derivação de
           unit/variant a partir de mocks locais (`src/mocks/fixtures.ts`, mesmos dados de
           `apps/web/src/lib/api/mocks/fixtures`), mesmo `AuthContext` mockado (troca para Supabase
           Auth real entra junto com a do web). Explorar/Liga/Perfil ainda são placeholders. Tokens de
           `blueprint_narrative/DESIGN.md` portados para `src/theme/tokens.ts` (RN não lê o `@theme`
           CSS do web; os dois arquivos têm que ser mantidos manualmente em sync); fontes
           Hanken Grotesk/Inter/JetBrains Mono via `@expo-google-fonts/*` + `useFonts` em
           `src/app/_layout.tsx`. Ícones: web usa Material Symbols (webfont), RN usa
           `MaterialCommunityIcons` de `@expo/vector-icons` — nomes de glifo diferentes, mapeados em
           `src/components/ui/Icon.tsx`; não assumir que um nome de ícone do web existe em RN sem
           checar esse mapa.)
/infra
  (sem Terraform/K8s ainda — implantação em Cloud Run/free tier, ver Estrategia_Bootstrap §3)
/Docs   (os documentos listados acima)
```

`apps/web` e `apps/mobile` são workspaces npm (`package.json` raiz) — `npm install` uma vez na raiz
cobre os dois. Cada serviço em `/services` é seu próprio módulo Go, sem workspace do Go (`go.work`) por
enquanto — não há necessidade com só 2 módulos.

**Arquitetura-alvo (pós-graduação — SAD §8, só depois de cruzar um gatilho da Estrategia_Bootstrap §7):**

```
/services
  /api-gateway
  /users-auth-svc
  /learning-svc
  /gamification-svc
  /ingestion-svc
  /ai-content-pipeline
  /notifications-svc
  /analytics-svc
/infra
  /terraform
  /k8s
```

Extrair um pacote do monólito para um serviço de verdade é o único caminho de migração — nunca pular
direto para a estrutura-alvo sem passar pela extração incremental. Se a estrutura real do repositório
divergir do que está descrito aqui, atualize esta seção — não deixe o mapa dessincronizado do território.

## Stack tecnológica (decisão fechada — ver SAD §12; equivalente gratuito na fase atual — ver Estrategia_Bootstrap)

- **Backend: Go**, containerizado. Alvo: Kubernetes. **Fase atual: Google Cloud Run** (ou Fly.io), sem
  K8s — todo o backend síncrono em `/services/monolith` (§ "Estrutura de repositório"), sem exceção. Não
  introduzir Node/outra linguagem sem discussão prévia.
- **Mobile: React Native** (iOS/Android, via Expo na fase atual). Web em React/Next.js (Vercel free tier
  na fase atual). Ambos em TypeScript.
- **Bancos: PostgreSQL + pgvector via Supabase** (decidido e já conectado — projeto `hbsfrrhctwmgiofzqmnv`,
  credenciais em `services/monolith/.env`, nunca commitado). **Identidade: Supabase Auth** — cliente fala
  direto com ele, backend só valida o JWT (ver `ArqLearn_API_Specification.md` §4). **Banco de
  documentos: MongoDB** (decidido — bate com o schema já documentado em `Database_Design.md` §4 sem
  rework; fase atual: Atlas M0 free tier, aguardando connection string). Redis (fase atual: Upstash free
  tier, ainda não conectado).
- **Mensageria: Amazon SQS/SNS** — já gratuita nesta fase (free tier permanente cobre o volume atual),
  sem equivalente a trocar.
- **IA (decisão revista em 08/2026 — NÃO é mais Anthropic/Claude):** critério fechado com o usuário foi
  "sem cartão de crédito pra funcionar". Claude e OpenAI foram descartados porque a chave de API de ambos
  só funciona (ou só é emitida, no caso da OpenAI) com cartão cadastrado, mesmo tendo crédito grátis
  inicial. **DeepSeek também foi descartado** — testado ao vivo, autentica mas devolve `402 Insufficient
  Balance` na geração; o usuário confirmou no próprio dashboard do DeepSeek que uso real exige cartão,
  mesmo com o crédito inicial. Ficou: **Gemini** (Google AI Studio, tier grátis, sem cartão —
  `GEMINI_API_KEY`) para geração de perguntas (`services/ai-content-pipeline/internal/geminiclient`, lê
  texto/imagem nativamente) e **Groq** (tier grátis, sem cartão — `GROQ_API_KEY`) para "explique melhor"
  (`services/monolith/internal/groqclient`, escolhido pela latência baixa — é uma chamada síncrona que o
  usuário está esperando responder). `OPENAI_API_KEY` está salva mas **não é usada em lugar nenhum do
  código** — decisão pendente com o usuário sobre usá-la mesmo exigindo cartão. Ver Estrategia_Bootstrap
  §4 para o racional completo da divisão Gemini/Groq.
- Infra alvo: Terraform, GitHub Actions, Helm. GitHub Actions já é usado desde já (free tier); Terraform/
  Helm só entram na graduação para a arquitetura-alvo.

**Pendência futura — não decidir sem o usuário:**
- API Gateway: Kong ou AWS API Gateway.
- Se a chave da OpenAI deve ser usada em algo (hoje não é, ver bullet de IA acima).

## Convenções de código

- **Go idiomático** em `/services` (gofmt/golangci-lint, sem exceção) — **TypeScript estrito** (sem `any`
  não justificado) em `/apps` (mobile React Native + web Next.js). Não misture as duas coisas no lugar
  errado; não introduza uma terceira linguagem sem discussão prévia.
- snake_case em payloads JSON e colunas SQL; camelCase em variáveis internas de aplicação (TS) / conforme
  convenção do pacote em Go.
- Todo endpoint novo precisa: (1) estar documentado em `ArqLearn_API_Specification.md` antes do merge,
  (2) ter teste de contrato, (3) seguir o formato de erro padrão
  `{error_code, message, trace_id, details}`.
- Toda migração de banco é versionada (ex.: `golang-migrate`/Flyway) — nunca alterar schema manualmente
  em produção.
- Cada serviço expõe `/health` e `/ready`.

## Regras de negócio críticas (não reimplementar de memória — usar como estão no TDD)

- **XP**: calculado por `calcularXP` (TDD §3) — base por dificuldade + bônus de velocidade + bônus de
  primeira conclusão, sujeito a um **limite diário de XP** (`DAILY_XP_CAP`, TDD §3.2) que zera o ganho
  sem bloquear a prática. Nunca é definido pelo cliente/frontend — o cliente só exibe `xp_ganho` e
  `daily_cap_reached` retornados pela API.
- **Nível**: curva de dificuldade progressiva intencional (`nivel(xp_total)`, TDD §3.1) — cada nível
  exige mais XP que o anterior; não trocar por uma curva linear.
- **Streak**: job diário por fuso do usuário (TDD §5); streak freeze consome item antes de zerar.
- **SRS (repetição espaçada)**: variação do SM-2 (TDD §4) — não trocar o algoritmo sem atualizar o TDD.
- **Ligas**: fechamento semanal (TDD §6), grupos pequenos (<15 membros ativos) são mesclados antes do
  fechamento.
- **Geração de perguntas pela IA**: segue estritamente o system prompt em
  `ArqLearn_IA_Persona_System_Prompt.md` — especialmente a exigência de `source_ref` e o campo
  `confidence`, que determina se a pergunta vai para revisão humana antes de publicar.
- **Autenticação**: cadastro/login/OAuth são Supabase Auth, chamado direto pelo cliente — o monólito
  nunca recebe senha, nunca emite token, só valida o JWT recebido (ver API Spec §4, Database Design §3.2
  para o trigger que cria o perfil de domínio). Não reintroduzir um fluxo de auth próprio.

## O que NÃO fazer

- Não adicionar Co-author nos Commits.
- Não gerar XP, streak ou recompensas fora do Gamification Service — nenhum outro serviço calcula isso.
- Não permitir que o AI Content Pipeline publique perguntas com `confidence: "low"` sem revisão humana.
- Não armazenar nem processar senha em nenhum serviço nosso — isso é do Supabase Auth. Não expor
  `SUPABASE_SECRET_KEY` (nem nenhuma outra chave/segredo) em código de `apps/web`/`apps/mobile` ou em
  qualquer payload de API.
- Não fazer proxy de upload de arquivo pela API — uploads usam URL pré-assinada direto ao object storage
  (ver API Spec, `POST /v1/uploads`).
- Não adicionar dependências externas de peso (novo banco, novo broker) sem atualizar o SAD.
- Não criar um novo microsserviço separado (deployment próprio) nem provisionar Kubernetes/infra paga
  enquanto o projeto estiver na fase bootstrap — novo domínio de negócio vira um pacote dentro de
  `/services/monolith`, não um novo serviço. Ver `ArqLearn_Estrategia_Bootstrap.md` §7 para os gatilhos
  que encerram essa regra.

## Processo de trabalho: uma branch + PR por demanda

**Regra permanente (desde 08/2026).** Toda demanda (uma tarefa/feature/correção discreta pedida pelo
usuário — não cada arquivo individual, não uma epic inteira de várias semanas) segue este fluxo
completo, sem pular etapa e sem pausar para pedir autorização a cada passo — só parar se algo
genuinely bloquear (conflito de merge real, decisão que só o usuário pode tomar):

1. Atualizar e sair da `main`: `git checkout main && git pull`.
2. Criar uma branch nova a partir dela: `git checkout -b tipo/descricao-curta` (`feat/`, `fix/`, `docs/`,
   `chore/`...).
3. Commitar o trabalho da demanda nessa branch. **Sem trailer `Co-Authored-By`** (já valia, ver "O que
   NÃO fazer" acima) **e sem rodapé "🤖 Generated with Claude Code"** — nem no commit nem no corpo do PR.
4. `git push -u origin tipo/descricao-curta` e abrir PR com `gh pr create` (base `main`).
5. `gh pr merge --squash --delete-branch` — squash merge (1 commit limpo por demanda na main) e apaga a
   branch local **e** remota no mesmo passo. Não esperar review/aprovação (projeto solo) nem bloquear
   no resultado do CI, a menos que o usuário peça o contrário.
6. `git checkout main && git pull` para sincronizar, e seguir direto para a próxima demanda.

Repositório é **público**
(`github.com/VictorSilva-Desenvolvedor/ArqLearn`) — decisão explícita do usuário, apesar do projeto já
lidar com credenciais reais (Supabase, MongoDB) em `.env` local. Isso reforça, não afrouxa, a regra de
nunca commitar segredo: antes de um `git add` amplo (início de uma demanda que toca muito arquivo),
rodar uma varredura por padrões de segredo conhecidos na árvore que será adicionada, mesmo com esse
processo automatizado — o `.gitignore` cobre `.env*` e `Docs/ignorar/`, mas não substitui a checagem.

## Comandos úteis (verificados no scaffold — expandir conforme o projeto cresce)

```bash
# --- /services/monolith (Go — fase bootstrap, um único binário) ---
cd services/monolith
go build ./...                    # confirma que compila
go run ./cmd/server                # roda todos os domínios internos de uma vez (porta $PORT, padrão 8080)
go test ./...                     # testes unitários (todos os pacotes/domínios)
go vet ./...
# golangci-lint run                # instalar separadamente quando o time crescer

# migrate CLI (uma vez, globalmente): go install -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -path ./migrations -database "$DATABASE_URL" up     # aplica migrations/0001_init.up.sql em diante
migrate -path ./migrations -database "$DATABASE_URL" down 1 # reverte a última

# --- /services/ai-content-pipeline (Go — processo assíncrono, já separado) ---
cd services/ai-content-pipeline
go build ./...
go run ./cmd/worker                # bloqueia até SIGINT/SIGTERM

# --- /apps (React Native + Next.js — workspaces npm, não pnpm: ver nota abaixo) ---
npm install                        # uma vez, na raiz do repositório — cobre web + mobile
npm run web                        # next dev (apps/web)
npm run mobile                     # expo start (apps/mobile)
npm run build --workspace=apps/web # next build
npm exec --workspace=apps/mobile -- tsc --noEmit   # checagem de tipos do app mobile
# (nota: "npx tsc --workspace=..." NÃO funciona — --workspace é flag do npm, não do tsc;
#  descoberto ao montar o workflow de CI)
```

**Nota sobre gerenciador de pacotes:** `pnpm` não pôde ser ativado neste ambiente (`corepack enable`
falhou por permissão de escrita em `Program Files\nodejs`) — usamos **npm workspaces** no lugar, já
configurado no `package.json` da raiz. Se `pnpm` for viabilizado depois (ambiente com permissão de admin,
ou instalação isolada por usuário), a migração é trocar `workspaces` por `pnpm-workspace.yaml` — não é
urgente, `npm` cobre a fase bootstrap sem atrito.

## Ao propor mudanças arquiteturais

1. Explique o trade-off em relação ao que já está descrito no SAD.
2. Se a mudança afetar contrato de API, edite `ArqLearn_API_Specification.md` diretamente (já é a fonte
   da verdade em Markdown — sem necessidade de addendum separado).
3. Se afetar schema de dados, edite `ArqLearn_Database_Design.md` diretamente pelo mesmo motivo.
4. Não implemente silenciosamente uma divergência do TDD — primeiro reporte, depois implemente.
