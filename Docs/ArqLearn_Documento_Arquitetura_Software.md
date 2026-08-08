# DOCUMENTO DE ARQUITETURA DE SOFTWARE (SAD)
## ArqLearn

Plataforma gamificada de aprendizado de Arquitetura, com geração automática de exercícios a partir de
arquivos e vídeos enviados pelo usuário.

Versão 1.7 | Agosto de 2026
Classificação: Uso Interno — Documento Técnico de Produto

> **Sobre esta versão:** esta é a versão em Markdown, mantida como fonte da verdade a partir de agora
> (ver `CLAUDE.md`). O arquivo `ArqLearn_Documento_Arquitetura_Software.docx` original (v1.0) permanece
> na pasta como snapshot histórico, mas não é mais atualizado.

### Controle de Versão

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 08/08/2026 | Equipe de Arquitetura | Versão inicial do documento |
| 1.1 | 08/08/2026 | Equipe de Arquitetura | Formaliza Modo Infinito, Resumo Inteligente e Chat sobre material como escopo V1, a partir da identidade visual (Stitch) |
| 1.2 | 08/08/2026 | Equipe de Arquitetura | Adiciona limite diário de XP e formaliza a curva de dificuldade progressiva de nível |
| 1.3 | 08/08/2026 | Equipe de Arquitetura | Fecha a decisão de stack (backend em Go, mobile em React Native); primeira versão consolidada em Markdown |
| 1.4 | 08/08/2026 | Equipe de Arquitetura | Fecha a decisão de mensageria (Amazon SQS/SNS) |
| 1.5 | 08/08/2026 | Equipe de Arquitetura | Referencia a `ArqLearn_Estrategia_Bootstrap.md` — a arquitetura deste documento é o alvo de escala; as Fases 0–2 do roadmap (§18) rodam em topologia gratuita até haver tração |
| 1.6 | 08/08/2026 | Equipe de Arquitetura | Fecha banco relacional/vetorial (Postgres+pgvector via Supabase) e delega identidade ao Supabase Auth (§8.2) |
| 1.7 | 08/08/2026 | Equipe de Arquitetura | Fecha banco de documentos (MongoDB via Atlas) |

---

## 1. Sumário Executivo

O ArqLearn é uma plataforma de aprendizado gamificada, inspirada em mecânicas de aplicativos como
Duolingo, voltada especificamente para o ensino e a prática de Arquitetura (arquitetura de edificações,
urbanismo, história da arquitetura, teoria de projeto e tecnologia da construção). A proposta central é
permitir que o usuário — estudante, professor ou profissional — envie materiais próprios (PDFs, apostilas,
slides, plantas, imagens de projetos e vídeos de aulas ou visitas técnicas) e que o sistema, por meio de
um pipeline de Inteligência Artificial, transforme esse conteúdo em lições, quizzes e desafios
interativos.

O produto combina três pilares: (1) um motor de geração de conteúdo educacional a partir de arquivos e
vídeos, (2) um sistema de gamificação robusto (XP, streaks, ligas, conquistas, vidas/corações, eventos
sazonais) e (3) uma arquitetura de microsserviços escalável, orientada a eventos, capaz de sustentar
processamento assíncrono pesado (transcrição de vídeo, OCR, geração de perguntas via LLM) sem comprometer
a responsividade da experiência do usuário.

Este documento descreve a arquitetura de software proposta para a v1.0 do produto: requisitos, visão
arquitetural, componentes, modelo de dados, pipeline de IA, sistema de gamificação, stack tecnológica,
segurança, escalabilidade, observabilidade e roadmap de implantação.

## 2. Visão Geral do Produto

### 2.1 Objetivo

Reduzir a fricção entre "ter material de estudo" e "praticar ativamente" no domínio de Arquitetura,
automatizando a criação de exercícios a partir de conteúdo real do usuário, e sustentar o hábito de
estudo diário por meio de mecânicas de gamificação comprovadas.

### 2.2 Público-Alvo

- Estudantes de graduação e pós-graduação em Arquitetura e Urbanismo.
- Candidatos a concursos e certificações profissionais (ex.: exames de habilitação, CAU).
- Professores que desejam transformar material de aula em exercícios automaticamente.
- Escritórios que treinam equipes juniores em normas técnicas, história e teoria.

### 2.3 Proposta de Valor

- Upload de qualquer material (PDF, DOCX, PPTX, imagens, vídeo) → lições prontas em minutos.
- Prática diária curta (5–10 min), gamificada, com progressão visível.
- Repetição espaçada (spaced repetition) adaptada ao desempenho do usuário.
- Trilhas de conhecimento organizadas por tema (História, Estruturas, Urbanismo, Conforto Ambiental,
  Legislação, Projeto de Interiores, BIM, etc.).

## 3. Escopo

### 3.1 Incluído na V1

- Upload e processamento de PDF, DOCX, PPTX, imagens e vídeo (MP4/MOV).
- Pipeline de IA para extração de conteúdo e geração automática de perguntas (múltipla escolha,
  verdadeiro/falso, associação, preenchimento de lacunas, identificação em imagem/planta).
- Sistema de gamificação: XP, streak diário, vidas/corações, ligas semanais, conquistas, avatar e loja de
  itens cosméticos.
- Trilhas de aprendizado estruturadas e trilhas geradas dinamicamente a partir do material do usuário.
- Aplicativos mobile (iOS/Android) e web responsiva.
- Notificações push e por e-mail para retenção de streak.
- Painel do professor/criador com métricas básicas de engajamento da turma.
- **Modo Infinito**: sessão de prática sem fim por tema/tópico, com contador de questões, taxa de acerto
  e XP acumulado — mecânica de treino intensivo, distinta da progressão estruturada por trilha/lição.
  *(adicionado na v1.1)*
- **Resumo Inteligente**: síntese estruturada gerada por IA de um material enviado (pontos-chave +
  explicações), oferecida como alternativa mais rápida que o quiz para revisar o conteúdo.
  *(adicionado na v1.1)*
- **Chat sobre o material**: pergunta livre em linguagem natural sobre um upload específico, respondida
  com RAG ancorado exclusivamente naquele material e citando o trecho-fonte. *(adicionado na v1.1)*

### 3.2 Fora de Escopo (V1)

- Correção automática de projetos arquitetônicos completos (pranchas de projeto).
- Videochamadas ao vivo ou mentoria 1:1.
- Marketplace de conteúdo entre usuários.
- Suporte a idiomas além de Português e Inglês.

## 4. Requisitos

### 4.1 Requisitos Funcionais (principais)

| ID | Descrição |
|---|---|
| RF-01 | O sistema deve permitir upload de arquivos (PDF, DOCX, PPTX, PNG/JPG, MP4/MOV) até 2 GB por arquivo. |
| RF-02 | O sistema deve extrair texto, imagens e áudio dos arquivos enviados e gerar uma representação estruturada do conteúdo. |
| RF-03 | O sistema deve gerar automaticamente perguntas de múltiplos formatos a partir do conteúdo extraído, com nível de dificuldade estimado. |
| RF-04 | O usuário deve poder revisar, editar, aprovar ou descartar perguntas geradas antes de publicá-las em uma trilha. |
| RF-05 | O sistema deve registrar XP, streak diário e progresso por trilha/lição para cada usuário. |
| RF-06 | O sistema deve implementar mecânica de "vidas"/corações que se regeneram com o tempo ou podem ser repostas com moeda virtual. |
| RF-07 | O sistema deve agrupar usuários em ligas semanais com base em XP acumulado, promovendo e rebaixando ao final do ciclo. |
| RF-08 | O sistema deve enviar notificações para incentivar a manutenção do streak diário. |
| RF-09 | O sistema deve aplicar repetição espaçada, reintroduzindo perguntas erradas ou antigas conforme algoritmo de retenção. |
| RF-10 | O sistema deve oferecer um painel para professores acompanharem progresso agregado de uma turma/grupo. |
| RF-11 | O sistema deve oferecer um "Modo Infinito" por tópico, apresentando questões continuamente (sem fim de trilha fixo), registrando contador de questões respondidas, taxa de acerto acumulada e XP total da sessão, encerrável a qualquer momento pelo usuário. *(v1.1)* |
| RF-12 | O sistema deve gerar, a partir de um upload processado, um resumo estruturado do material (pontos-chave e explicações de apoio), fundamentado exclusivamente no conteúdo extraído. *(v1.1)* |
| RF-13 | O sistema deve permitir que o usuário faça perguntas em linguagem natural sobre um material específico já processado, respondendo via RAG restrito ao conteúdo daquele upload, com citação do trecho-fonte, e recusando educadamente perguntas fora do escopo do material. *(v1.1)* |

*Tabela 1 — Requisitos funcionais principais.*

### 4.2 Requisitos Não Funcionais

| Categoria | Requisito |
|---|---|
| Desempenho | Tempo de resposta da API síncrona ≤ 300 ms (p95) para operações de leitura de lição/exercício. |
| Processamento assíncrono | Geração de perguntas a partir de um vídeo de até 60 min deve concluir em até 15 minutos (p95). |
| Disponibilidade | SLA de 99,9% para os serviços core (autenticação, lições, gamificação). |
| Escalabilidade | Suportar picos de 50x o tráfego médio (horário de estudo noturno) sem degradação perceptível. |
| Segurança | Conformidade com LGPD; criptografia em trânsito (TLS 1.2+) e em repouso (AES-256). |
| Portabilidade | Backend containerizado, orquestrado via Kubernetes, independente de nuvem específica (evitar lock-in crítico). |
| Observabilidade | 100% dos serviços com métricas, logs estruturados e tracing distribuído. |
| Custo de IA | Custo médio de geração de conteúdo por hora de vídeo processado monitorado e sujeito a orçamento (FinOps). |

*Tabela 2 — Requisitos não funcionais.*

## 5. Visão Arquitetural

### 5.1 Estilo Arquitetural

Arquitetura de microsserviços orientada a eventos (Event-Driven Microservices), com separação clara
entre:

- **Plano síncrono de baixa latência**: autenticação, navegação de trilhas, respostas de exercícios,
  gamificação em tempo real.
- **Plano assíncrono de processamento pesado**: ingestão de arquivos/vídeos, extração de conteúdo,
  geração de perguntas via IA, moderação.

A comunicação entre serviços síncronos ocorre via REST/gRPC através de um API Gateway; a comunicação
entre o pipeline de ingestão e os demais serviços ocorre via um barramento de eventos (message broker),
garantindo desacoplamento e resiliência a picos de processamento.

### 5.2 Princípios Arquiteturais

- **Domain-Driven Design**: cada serviço possui um domínio de negócio claro e seu próprio banco de dados
  (Database per Service).
- **Escalabilidade independente**: o pipeline de IA escala horizontalmente de forma independente dos
  serviços de gamificação.
- **Resiliência**: filas com reprocessamento (retry/DLQ) para falhas transitórias em transcrição, OCR e
  chamadas a modelos de IA.
- **API-first**: todo recurso do backend é exposto por API versionada, consumida igualmente por apps
  mobile, web e painel do professor.
- **Segurança por padrão**: princípio do menor privilégio entre serviços, autenticação mútua (mTLS) na
  malha de serviços.

## 6. Diagrama de Contexto (C4 — Nível 1)

```
                [Aluno]              [Professor / Criador]
                   \                        /
                    v                      v
       +---------------------------------+
       |             ArqLearn             |
       |   Plataforma SaaS de aprendizado |
       |   gamificado de Arquitetura      |
       +-----------------+-----------------+
             |            |            |
             v            v            v
     +-----------+  +-------------+  +-------------+
     | Pagamentos|  | Envio       |  | Provedores  |
     | (Stripe)  |  | push/e-mail |  | LLM/STT/OCR |
     +-----------+  +-------------+  +-------------+
```

*Figura 1 — Diagrama de contexto (C4 Nível 1): atores e sistemas externos.*

## 7. Diagrama de Contêineres (C4 — Nível 2)

```
[App Mobile] [Web App] [Painel Professor]
       \        |          /
        v        v         v
           +-------------------+
           |    API Gateway    |  (AuthN/AuthZ, rate limit, roteamento)
           +---------+---------+
                     |
   +-----------------+------------------------------------+
   |                 |                |             |     |
   v                 v                v             v     v
+-------+   +----------------+  +-----------+  +---------+ +-------------+
| Users |   | Learning &     |  | Gamifica- |  | Notify  | | Analytics   |
| /Auth |   | Content Svc    |  | tion Svc  |  | Svc     | | Svc         |
+-------+   +----------------+  +-----------+  +---------+ +-------------+
                     |
                     v  (evento: arquivo enviado)
           +-------------------+        +--------------------------+
           |  Message Broker   | -----> |  Ingestion Worker         |
           |  (Amazon SQS/SNS) |        |  (extração + normaliza)   |
           +-------------------+        +------------+-------------+
                                                       v
                                          +-------------------------+
                                          | AI Content Pipeline      |
                                          | (OCR / STT / Geração de  |
                                          |  Perguntas via LLM+RAG)  |
                                          +------------+-------------+
                                                       v
                                          +-------------------------+
                                          | Question Bank & Review   |
                                          +-------------------------+
```

*Figura 2 — Diagrama de contêineres (C4 Nível 2): principais serviços e fluxo de ingestão.*

## 8. Componentes Principais

### 8.1 API Gateway
Ponto único de entrada para clientes mobile e web. Responsável por autenticação (JWT/OAuth2),
autorização, rate limiting, agregação de respostas (BFF leve) e roteamento para os microsserviços
internos.

### 8.2 Serviço de Usuários e Autenticação
Cadastro, login e OAuth social são delegados ao **Supabase Auth** (gerenciado) a partir da v1.3 — o
cliente (`apps/web`/`apps/mobile`) fala direto com ele, e o backend só valida o JWT resultante. Este
serviço mantém o **perfil de domínio** (nome, papel, timezone, preferências) e papéis (aluno, professor,
admin), criado automaticamente via trigger de banco quando o Supabase Auth cria um novo usuário — ver
`ArqLearn_Database_Design.md` §3.2 e `ArqLearn_API_Specification.md` §4. SSO institucional para escolas
permanece em aberto para quando a Fase 5 (multi-tenant, §18) justificar a complexidade adicional.

### 8.3 Serviço de Conteúdo e Aprendizagem (Learning Service)
Gerencia trilhas, unidades, lições e o vínculo entre perguntas do banco de questões e as lições
publicadas. Controla o progresso do usuário por lição e a lógica de repetição espaçada (spaced
repetition, ex.: variação do algoritmo SM-2).

### 8.4 Serviço de Ingestão (Ingestion Service)
Recebe uploads, valida formato/tamanho, armazena o arquivo bruto em object storage e publica um evento
"conteúdo recebido" no barramento de mensagens, disparando o pipeline assíncrono de IA.

### 8.5 Pipeline de IA (AI Content Pipeline)
Conjunto de workers especializados (descritos em detalhe na Seção 9) responsáveis por transformar o
arquivo bruto em perguntas estruturadas e revisáveis.

### 8.6 Serviço de Gamificação
Centraliza XP, streaks, vidas, ligas, conquistas e a loja de itens virtuais. Consome eventos de
"exercício concluído" emitidos pelo Learning Service e aplica as regras de negócio de recompensa (Seção
10).

### 8.7 Serviço de Notificações
Orquestra envio de push notifications, e-mails e notificações in-app, com regras de disparo (ex.: streak
em risco, liga terminando, novo desafio disponível).

### 8.8 Serviço de Analytics
Coleta eventos de uso (funil de onboarding, engajamento, retenção D1/D7/D30, taxa de acerto por tópico)
para dashboards internos e para o painel do professor.

## 9. Pipeline de Geração de Conteúdo via IA

Este é o diferencial central do produto: transformar material bruto de Arquitetura em exercícios de
qualidade. O pipeline é dividido em estágios assíncronos, cada um implementado como um worker
independente e escalável horizontalmente, conectado por filas de mensagens.

### 9.1 Estágio 1 — Ingestão e Normalização
- Detecção de tipo de arquivo e roteamento para o extrator apropriado.
- PDF/DOCX/PPTX: extração de texto, estrutura (títulos, tópicos) e imagens embutidas.
- Imagens (plantas, fotos de projeto, croquis): pré-processamento e enfileiramento para OCR/Visão
  Computacional.
- Vídeo: extração de faixa de áudio e amostragem de frames-chave (detecção de slide/quadro mudando).

### 9.2 Estágio 2 — Extração de Conteúdo
- OCR (reconhecimento óptico de caracteres) para texto em imagens, plantas e slides digitalizados.
- Speech-to-Text (transcrição) para o áudio de vídeos de aula, com timestamps por trecho.
- Visão computacional para identificar elementos em plantas/imagens (ex.: reconhecer tipologia de planta,
  elementos estruturais) quando aplicável — usado como enriquecimento, não como fonte única.

### 9.3 Estágio 3 — Estruturação Semântica (RAG)
O conteúdo extraído é dividido em blocos (chunking) semanticamente coerentes, vetorizado (embeddings) e
indexado em um banco vetorial. Isso permite que a geração de perguntas seja feita com contexto recuperado
(Retrieval-Augmented Generation), reduzindo alucinação e garantindo que as perguntas reflitam fielmente o
material enviado.

### 9.4 Estágio 4 — Geração de Perguntas (LLM)
Um modelo de linguagem, orientado por prompts especializados por tipo de questão e por tópico de
Arquitetura, gera candidatos de pergunta em formatos variados: múltipla escolha, verdadeiro/falso,
associação de conceitos, preenchimento de lacunas e identificação de elementos em imagem. Cada pergunta
gerada recebe metadados: nível de dificuldade estimado, tópico, trecho-fonte (para rastreabilidade) e
tipo.

### 9.5 Estágio 5 — Validação e Moderação
- Validação automática: checagem de formato, unicidade de resposta correta, ausência de ambiguidade
  óbvia (heurísticas + segunda chamada de LLM como "crítico").
- Validação humana (opcional, mas recomendada): fila de revisão onde o próprio usuário/professor aprova,
  edita ou rejeita perguntas antes de publicá-las em uma trilha ativa.
- Moderação de conteúdo: bloqueio de material protegido por direitos autorais de terceiros enviado
  indevidamente e de conteúdo impróprio, antes do processamento.

### 9.6 Estágio 6 — Publicação
Perguntas aprovadas são gravadas no banco de questões e disponibilizadas ao Learning Service para
composição de lições, alimentando também o algoritmo de repetição espaçada.

> **Nota (v1.1):** os Estágios 3–5 (estruturação semântica/RAG, geração e validação) são reaproveitados
> sem alteração de infraestrutura para alimentar o Resumo Inteligente (RF-12) e o Chat sobre material
> (RF-13) — ambos consultam o mesmo índice vetorial (`content_chunks`, pgvector) já construído para a
> geração de perguntas, evitando duplicar o pipeline de ingestão. Ver
> `ArqLearn_TDD_Technical_Design_Document.md` e `ArqLearn_Database_Design.md` / `ArqLearn_API_Specification.md`
> para o desenho técnico completo.

## 10. Sistema de Gamificação

### 10.1 Mecânicas Principais

| Mecânica | Descrição |
|---|---|
| XP (Pontos de Experiência) | Concedidos por exercício correto, lição concluída e bônus de precisão. Determinam nível do usuário e posição na liga. |
| Streak (sequência diária) | Contador de dias consecutivos com pelo menos uma lição concluída. Inclui "congelador de streak" (item que perdoa até 1 dia perdido) e "reparo de streak" (recuperação mediante moeda virtual). |
| Vidas / Corações | Limitam tentativas erradas por sessão; regeneram com o tempo ou são repostas com moeda virtual/anúncio/assinatura premium. |
| Ligas semanais | Usuários agrupados em grupos de ~30 por faixa de XP semanal; os melhores sobem de liga, os piores descem, ao final do ciclo. |
| Conquistas / Badges | Marcos de progresso (ex.: "10 dias de streak", "100% em Teoria da Arquitetura Moderna"). |
| Moeda virtual (Gemas) | Ganha por desempenho, gasta em congeladores de streak, reposição de vidas e itens cosméticos. |
| Desafios semanais | Metas de curto prazo (ex.: "ganhe 500 XP até domingo") com recompensa extra em gemas. |
| Trilha de progresso / mapa | Visualização em mapa de unidades e lições concluídas, reforçando sensação de avanço. |

*Tabela 3 — Mecânicas de gamificação.*

### 10.2 Regras de Negócio Notáveis

- O streak só é incrementado uma vez por dia (fuso horário do usuário), independentemente do número de
  lições concluídas naquele dia.
- A perda de streak dispara notificação preventiva algumas horas antes da virada do dia, caso o usuário
  ainda não tenha estudado.
- As ligas usam método de rebalanceamento para evitar grupos vazios em nichos pequenos (ex.: usuários
  muito avançados em tópicos específicos de Arquitetura).
- Eventos de gamificação (XP concedido, streak atualizado, liga promovida) são publicados no barramento
  de eventos para consumo por Notificações e Analytics, evitando acoplamento direto entre serviços.
- **O sistema aplica um limite diário de XP** (valor inicial ~500 XP/dia): ao atingi-lo, o usuário
  continua praticando normalmente (lições, Modo Infinito, vidas, streak inalterados) — apenas o ganho de
  XP passa a ser zero pelo resto do dia local do usuário. Não é uma mecânica de bloqueio, é um teto
  silencioso contra farming de XP. Distinto da "Meta Diária" exibida na Home (~50 XP), que continua
  existindo apenas como reforço de hábito/streak. *(v1.2 — detalhamento algorítmico em
  `ArqLearn_TDD_Technical_Design_Document.md` §3.2)*
- **A progressão de nível segue uma curva de dificuldade propositalmente crescente**: cada nível exige
  mais XP que o anterior a alcançar (nunca uma curva linear), reforçando que a jornada de longo prazo no
  ArqLearn recompensa consistência diária, não sessões isoladas de grande volume. *(v1.2 — fórmula e
  tabela de exemplo em `ArqLearn_TDD_Technical_Design_Document.md` §3.1)*

## 11. Modelo de Dados (Visão Conceitual)

| Entidade | Atributos-chave |
|---|---|
| User | id, nome, e-mail, papel, nível, xp_total, xp_hoje, xp_hoje_data, streak_atual, streak_recorde, gemas, vidas_atuais, criado_em |
| Track (Trilha) | id, título, tópico, descrição, origem (curada \| gerada_por_usuário), autor_id |
| Unit / Lesson | id, track_id, ordem, título, tipo, dificuldade |
| UploadedContent | id, user_id, tipo_arquivo, url_storage, status_processamento, criado_em |
| Question | id, lesson_id, tipo, enunciado, opções, resposta_correta, dificuldade, origem_trecho, status_revisão |
| UserProgress | user_id, lesson_id, status, acertos, erros, próxima_revisão (SRS), atualizado_em |
| GamificationEvent | id, user_id, tipo_evento, valor, timestamp |
| League | id, semana_referência, tier, membros[] |
| Achievement | id, user_id, tipo, conquistado_em |
| InfiniteModeSession | id, user_id, topic, questions_answered, correct_count, xp_earned, status, started_at, ended_at *(v1.1)* |
| ContentSummary | id, upload_id, summary_text, key_points[], generated_at *(v1.1)* |
| MaterialChatMessage | id, upload_id, user_id, role (user\|assistant), message, source_ref, created_at *(v1.1)* |

*Tabela 4 — Entidades principais e atributos-chave (modelo conceitual). Detalhamento completo (schema
MongoDB, índices, DDL) em `ArqLearn_Database_Design.md`.*

Cada microsserviço mantém seu próprio armazenamento (Database per Service): dados transacionais de
usuário e gamificação em banco relacional; catálogo de conteúdo e progresso em banco de documentos,
otimizado para leitura de trilhas; embeddings do pipeline de IA em banco vetorial dedicado.

## 12. Stack Tecnológica

> **Decisão fechada (v1.3–1.7):** backend em **Go**, apps mobile em **React Native**, mensageria em
> **Amazon SQS/SNS**, banco relacional/vetorial em **Postgres+pgvector via Supabase** (grátis nesta fase,
> ver Estrategia_Bootstrap), identidade em **Supabase Auth**, banco de documentos em **MongoDB** (Atlas
> M0 na fase atual). Só **API Gateway** (Kong ou AWS API Gateway) continua como **pendência futura** (não
> decidir sem o usuário). Ver `CLAUDE.md` para o registro consolidado de decisões pendentes.
>
> **Esta é a arquitetura-alvo, dimensionada para escala.** Com 5–20 usuários nos primeiros 3 meses (Fases
> 0–2 do roadmap, §18), nada disso precisa custar dinheiro desde o dia um — ver
> `ArqLearn_Estrategia_Bootstrap.md` para a topologia gratuita equivalente e os gatilhos de quando migrar
> para cada item desta tabela de fato.

| Camada | Tecnologias |
|---|---|
| Apps cliente | **React Native** (iOS/Android); Web em React/Next.js |
| API Gateway | Kong ou AWS API Gateway; autenticação via OAuth2/JWT |
| Serviços de negócio | **Go**, em contêineres, orquestrados via Kubernetes |
| Mensageria / eventos | **Amazon SQS/SNS** |
| Banco relacional | **PostgreSQL via Supabase** (usuários, gamificação, faturamento) |
| Banco de documentos | **MongoDB via Atlas** (catálogo de conteúdo, progresso) |
| Banco vetorial | **pgvector via Supabase** (mesma instância do banco relacional — RAG do pipeline de IA) |
| Cache | Redis (sessões, leaderboard de ligas, rate limiting) |
| Object storage | Amazon S3 (ou equivalente) para arquivos brutos e mídia |
| Processamento de IA | APIs de LLM (ex.: família Claude, via Anthropic API) para geração e revisão de perguntas; serviços de OCR e Speech-to-Text especializados |
| Infra / CI-CD | Terraform (IaC), GitHub Actions, Kubernetes (EKS/GKE), Helm |
| Observabilidade | OpenTelemetry, Prometheus + Grafana, ELK/Loki para logs, Sentry para erros |

*Tabela 5 — Stack tecnológica.*

## 13. Segurança e Privacidade

- Autenticação via OAuth2/JWT com refresh tokens de curta duração; MFA opcional para contas de
  professor/admin.
- Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256) para dados de usuário e arquivos enviados.
- Conformidade com a LGPD: consentimento explícito para upload de material, política clara de retenção e
  exclusão de dados, direito de portabilidade e apagamento sob solicitação.
- Verificação de direitos autorais no upload: aviso e checagem heurística para reduzir o risco de
  ingestão de material protegido de terceiros sem autorização.
- Segregação de dados entre tenants institucionais (escolas/faculdades) quando aplicável, com isolamento
  lógico por schema/namespace.
- mTLS entre serviços internos e política de menor privilégio via service mesh (ex.: Istio/Linkerd).
- Auditoria de acessos administrativos e de alterações em conteúdo publicado.

## 14. Escalabilidade e Performance

- Serviços síncronos escalam horizontalmente via HPA (Horizontal Pod Autoscaler) com base em
  CPU/latência.
- Pipeline de IA escala de forma independente por fila (worker pool elástico), absorvendo picos de
  upload sem impactar a API principal.
- Cache de leitura (Redis) para trilhas populares, leaderboard de ligas e perfis de usuário ativo.
- Particionamento de dados de gamificação por faixa temporal (semana da liga) para manter consultas de
  ranking performáticas.
- CDN para entrega de mídia estática (imagens de lições, ícones, avatares).

## 15. Infraestrutura e DevOps

- Infraestrutura como código (Terraform) versionada, com ambientes isolados: dev, staging e produção.
- Pipelines de CI/CD com testes automatizados, análise estática e deploy progressivo (canary/blue-green)
  para serviços core.
- Orquestração via Kubernetes, com políticas de autoscaling e resiliência a falhas de nó (pod disruption
  budgets).
- Estratégia multi-AZ para alta disponibilidade; backups automatizados dos bancos relacionais com teste
  periódico de restauração.

## 16. Observabilidade

- Logs estruturados (JSON) centralizados, correlacionados por trace ID de ponta a ponta (cliente →
  gateway → serviços → pipeline de IA).
- Métricas de negócio (DAU, streak médio, taxa de conclusão de lição, tempo de geração de conteúdo) e
  métricas técnicas (latência, taxa de erro, saturação de filas) em dashboards Grafana.
- Tracing distribuído para diagnosticar gargalos, especialmente no pipeline assíncrono de IA
  (OCR/STT/LLM).
- Alertas automatizados para SLOs críticos (disponibilidade da API, atraso na fila de ingestão, taxa de
  falha na geração de perguntas).

## 17. Estratégia de Testes

- Testes unitários por serviço, cobrindo regras de gamificação (cálculo de XP, streak, promoção de liga)
  e regras de geração/validação de perguntas.
- Testes de contrato entre serviços (ex.: Pact) para evitar quebras na comunicação via eventos.
- Testes de integração do pipeline de IA com conjuntos de arquivos de referência (golden set) para
  monitorar qualidade das perguntas geradas ao longo do tempo.
- Testes de carga simulando picos de uso (horário de pico noturno) sobre API Gateway e pipeline de
  ingestão.

## 18. Roadmap de Implementação

| Fase | Entregas | Infraestrutura |
|---|---|---|
| Fase 0 — Fundação | Autenticação, estrutura de trilhas curadas manualmente, gamificação básica (XP e streak), apps mobile/web mínimos. | Bootstrap (grátis) |
| Fase 1 — Ingestão | Upload de PDF/DOCX/imagens, extração de texto/OCR, geração de perguntas de múltipla escolha via LLM com revisão humana obrigatória. | Bootstrap (grátis) |
| Fase 2 — Vídeo | Suporte a upload de vídeo, transcrição, geração de perguntas a partir de aulas gravadas. | Bootstrap (grátis) |
| Fase 3 — Gamificação avançada | Ligas semanais, loja de itens, desafios, congelador/reparo de streak. | Reavaliar gatilhos de graduação |
| Fase 4 — Inteligência adaptativa | Repetição espaçada completa, recomendação personalizada de trilhas, painel avançado do professor. | Arquitetura-alvo (§5–16) |
| Fase 5 — Escala e institucional | Multi-tenant para instituições de ensino, relatórios agregados, integrações LMS (ex.: Moodle). | Arquitetura-alvo (§5–16) |

*Tabela 6 — Roadmap de implementação faseado. Fases 0–2 seguem `ArqLearn_Estrategia_Bootstrap.md`
(premissa: 5–20 usuários nos primeiros 3 meses); a partir da Fase 3, reavaliar os gatilhos de graduação
daquele documento antes de assumir que a infraestrutura-alvo já é necessária.*

## 19. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Qualidade insuficiente das perguntas geradas por IA | Baixa confiança do usuário no produto | Revisão humana obrigatória em fases iniciais; conjunto golden set para monitorar qualidade continuamente |
| Custo elevado de processamento de vídeo/LLM em escala | Margem comprometida | Cache de resultados, limites de uso por plano, otimização de prompts e escolha de modelo por complexidade da tarefa |
| Upload de conteúdo protegido por direitos autorais | Exposição legal | Termos de uso claros, checagem heurística no upload, canal de denúncia e remoção rápida |
| Picos de uso concentrados (horário noturno) | Degradação de performance | Autoscaling agressivo, filas com priorização, testes de carga recorrentes |
| Abandono do hábito de estudo (churn) | Baixa retenção | Mecânicas de streak/ligas, notificações inteligentes, conteúdo curto e de baixo atrito |

*Tabela 7 — Riscos e mitigações.*

## 20. Glossário

- **RAG (Retrieval-Augmented Generation)**: técnica que combina busca em base de conhecimento com geração
  de texto por LLM para reduzir alucinação.
- **SRS (Spaced Repetition System)**: sistema de repetição espaçada que reapresenta conteúdo em
  intervalos crescentes conforme o desempenho do usuário.
- **OCR (Optical Character Recognition)**: reconhecimento óptico de caracteres, usado para extrair texto
  de imagens/PDFs escaneados.
- **STT (Speech-to-Text)**: transcrição automática de áudio para texto.
- **DLQ (Dead Letter Queue)**: fila para mensagens que falharam repetidamente no processamento, usada
  para análise e reprocessamento manual.
- **HPA (Horizontal Pod Autoscaler)**: mecanismo do Kubernetes que ajusta automaticamente o número de
  réplicas de um serviço conforme a carga.

— Fim do documento —
