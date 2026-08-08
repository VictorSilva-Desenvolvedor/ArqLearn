# DOCUMENTO TÉCNICO DE DESIGN (TDD)
## ArqLearn — Algoritmos de Negócio, Contratos de Evento e Fluxos de Sequência

Versão 1.0 | Agosto de 2026
Documento complementar ao SAD, ao Database Design e à API Specification do ArqLearn v1.0

> **Nota de nomenclatura:** existe também um `ArqLearn_Documento_Tecnico_Design.docx` na pasta `Docs/`,
> que apesar do nome parecido é um documento diferente — cobre **sistema de design/UX** (arquitetura de
> informação, telas, tokens visuais). Este arquivo (`ArqLearn_TDD_Technical_Design_Document.md`) é o
> "TDD" citado no `CLAUDE.md` e no documento de UX: define **como o sistema calcula e decide as coisas**
> por trás das telas (algoritmos de XP/streak/SRS/ligas e contratos de evento), não como elas aparecem.
> Ver a tabela comparativa na Seção 1.1.

### Controle de Versão

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 08/08/2026 | Equipe de Arquitetura/Engenharia | Versão inicial — preenche a lacuna apontada no CLAUDE.md |

---

## 1. Introdução

Este documento especifica os algoritmos de negócio, os contratos de evento assíncrono e os fluxos de
sequência entre serviços do ArqLearn. O SAD (Seção 10) descreve **quais** mecânicas de gamificação
existem e por quê; a API Specification descreve o **contrato de interface** (rotas, payloads síncronos);
o Database Design descreve **onde** cada dado é persistido. Este documento é a peça que faltava: **como**
cada regra de negócio é calculada e **como** os serviços se coordenam de forma assíncrona.

### 1.1 Relação com os demais documentos

| Documento | Responde a... |
|---|---|
| SAD | Por que a mecânica existe, qual o requisito de produto por trás dela. |
| Database Design | Onde o dado vive, como é indexado, particionado e retido. |
| API Specification | Qual o contrato síncrono (rota, payload, erro) exposto ao cliente. |
| **Este TDD** | Qual o algoritmo exato, qual o contrato de evento assíncrono, qual a sequência entre serviços. |
| `ArqLearn_Documento_Tecnico_Design.docx` (UX) | Como a mecânica aparece, anima e se comporta na tela. |

Se este documento e o código divergirem, siga a regra do CLAUDE.md: pare e sinalize a divergência antes
de assumir qual dos dois está correto.

## 2. Escopo

Cobre as quatro regras de negócio "críticas" já citadas no CLAUDE.md (XP, streak, SRS, ligas), os
contratos de evento nomeados na API Specification §11, e os dois fluxos de sequência mais complexos do
sistema (ingestão→IA→publicação; resposta→gamificação→notificação). Os endpoints de Modo Infinito, Resumo
Inteligente e Chat sobre material estão em `ArqLearn_API_Specification.md` §6.1–6.3; os três novos
tópicos de evento que eles disparam estão listados em §11 do mesmo documento — os contratos completos
(payload) ainda serão detalhados aqui quando a implementação desses três recursos começar.

## 3. Algoritmo de XP (`calcularXP`)

Executado pelo Gamification Service ao consumir o evento `lesson.answer_submitted` (Seção 7.3). Nunca é
calculado pelo cliente — o app apenas exibe o `xp_ganho` retornado pela API (ver API Spec §6,
`POST /v1/lessons/{lesson_id}/answers`).

```
calcularXP(question, answer_time_ms, is_first_completion, correct, xp_today) =
  se correct == false:
    retorna { xp_concedido: 0, daily_cap_reached: false }
                       # errar nunca concede XP, apenas consome vida (hearts_current -= 1)

  base = BASE_POR_DIFICULDADE[question.difficulty]   # easy: 10, medium: 20, hard: 30
  bonus_velocidade = 5 se answer_time_ms < LIMIAR_VELOCIDADE[question.difficulty] senão 0
                       # LIMIAR_VELOCIDADE: easy=5000ms, medium=8000ms, hard=12000ms
  bonus_primeira_conclusao = 10 se is_first_completion senão 0
                       # concedido uma única vez por lição (transição para status "completed"
                       # nunca vista antes nesse user_progress), não em repetições de SRS

  xp_calculado = base + bonus_velocidade + bonus_primeira_conclusao

  # teto diário — ver §3.2
  xp_disponivel_hoje = max(0, DAILY_XP_CAP - xp_today)
  xp_concedido = min(xp_calculado, xp_disponivel_hoje)

  retorna { xp_concedido, daily_cap_reached: xp_concedido < xp_calculado }
```

`is_first_completion` é resolvido consultando `user_progress.status` (Database Design §4.4) **antes** da
escrita da resposta atual — se a lição ainda não estava `completed`, e esta resposta completa a lição, o
bônus se aplica. `xp_today` é lido de `user_gamification.xp_today` (ver §3.2) antes do cálculo.

### 3.1 Nível do usuário

```
nivel(xp_total) = floor(sqrt(xp_total / 100)) + 1
```

Esta fórmula é uma decisão de design deliberada, não um efeito colateral: cada nível deve exigir mais XP
que o anterior, para que a progressão sinta-se cada vez mais conquistada — nunca linear. A tabela abaixo
torna isso concreto:

| Nível | XP total necessário | XP adicional desde o nível anterior |
|---|---|---|
| 1 | 0 | — |
| 2 | 100 | 100 |
| 3 | 400 | 300 |
| 4 | 900 | 500 |
| 5 | 1.600 | 700 |
| 6 | 2.500 | 900 |
| 7 | 3.600 | 1.100 |
| 8 | 4.900 | 1.300 |

O incremento cresce de forma constante (+200 XP a cada nível subsequente) porque o threshold é
proporcional a `n²`. Combinado com o teto de §3.2, isso garante que subir de nível se torne
progressivamente mais lento e nunca seja possível em um único dia de prática nos níveis mais altos —
reforçando o objetivo de hábito diário do SAD §2.1, não apenas de volume de XP.

`user_gamification.level` (Database Design §3.2) é recalculado a cada escrita de `xp_total` no mesmo
comando que aplica o XP — não é um job separado. Valores iniciais sujeitos a balanceamento de produto;
qualquer ajuste na fórmula deve ser refletido aqui antes de alterar o código.

### 3.2 Limite Diário de XP

`DAILY_XP_CAP = 500` (valor inicial, sujeito a balanceamento — mesmo tratamento das demais constantes
desta seção).

**Comportamento ao atingir o teto:** a prática continua normalmente — lições, Modo Infinito, vidas e
streak não são afetados. Apenas `calcularXP` passa a retornar `xp_concedido: 0` (ou um valor parcial, se
o teto for cruzado no meio do cálculo de uma única resposta) e `daily_cap_reached: true`. Não é uma
mecânica de bloqueio como "sem vidas" — é um teto silencioso sobre o ganho de XP.

**Escopo do teto:** avaliado de forma centralizada dentro de `calcularXP`, portanto vale para **todas**
as fontes de XP do dia — resposta de lição (§7.3) e Modo Infinito (`ArqLearn_API_Specification.md` §6.1)
somam para o mesmo `xp_today`, sem lógica duplicada por endpoint.

**Armazenamento e reset:** `user_gamification.xp_today` (integer) + `user_gamification.xp_today_date`
(date) — ver `ArqLearn_Database_Design.md` §3.2. Ao contrário do streak (§5), o reset é
**preguiçoso** (lazy), não um job agendado: no momento de conceder XP, se
`xp_today_date != hoje_local(user.timezone)`, zera `xp_today` e atualiza `xp_today_date` antes de somar.
Não há job separado porque, diferente do streak, o reset do teto não dispara nenhum efeito colateral
(notificação, consumo de item) — só precisa estar correto no momento da próxima escrita.

**Não confundir com a "Meta Diária" da Home** (elemento de UI já presente em
`stitch_app_visual_identity/home_mapa_de_aprendizado`, ex. "30 / 50 XP"). São conceitos distintos:

| | Meta Diária (UI existente) | Limite Diário de XP (esta seção) |
|---|---|---|
| Propósito | Reforçar hábito/streak — meta pequena e alcançável | Conter grinding/farming abusivo de XP |
| Ordem de grandeza | ~50 XP | ~500 XP |
| Efeito ao atingir | Preenche a barra, sem restringir nada | `calcularXP` passa a retornar 0 |
| Bloqueia prática? | Não | Não |

## 4. SRS — Repetição Espaçada (variação SM-2)

Aplicado por `lesson.answer_submitted` para atualizar `user_progress.srs_state` (Database Design §4.4:
`ease_factor`, `interval_days`, `next_review_at`).

### 4.1 Mapeamento de qualidade de resposta

Como o produto só captura certo/errado + tempo de resposta (não uma escala 0–5 como o SM-2 original),
mapeamos para uma "qualidade" `q`:

| Condição | q |
|---|---|
| Correto, dentro do limiar de velocidade da dificuldade (Seção 3) | 5 |
| Correto, fora do limiar de velocidade | 4 |
| Incorreto, mas usuário havia pulado/hesitado (time_ms > 2× limiar) | 2 |
| Incorreto | 0 |

### 4.2 Atualização de `ease_factor` e `interval_days`

```
se q >= 3 (acertou):
  se interval_days_anterior == 0:      interval_days = 1
  senão se interval_days_anterior == 1: interval_days = 6
  senão:                                interval_days = round(interval_days_anterior * ease_factor)

  ease_factor = max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

senão (errou, q < 3):
  interval_days = 1
  ease_factor   = max(1.3, ease_factor - 0.2)
  # a pergunta reentra na fila da sessão corrente (mecânica de "vidas"/RF-09), além de voltar
  # ao SRS para revisão de curto prazo

next_review_at = now() + interval_days dias
```

`ease_factor` inicial de uma pergunta nunca vista: `2.5` (padrão SM-2). Este algoritmo não deve ser
trocado por outra variação sem atualizar esta seção primeiro (regra já citada no CLAUDE.md).

## 5. Streak Diário

Dois jobs distintos rodam por fuso horário do usuário (`users.timezone`, Database Design §3.2) — não um
cron único em UTC, para respeitar "o streak só é incrementado uma vez por dia (fuso do usuário)" (SAD
§10.2).

### 5.1 Incremento (síncrono, não é job)

Acontece dentro do handler de `POST /v1/lessons/{lesson_id}/answers` quando a resposta completa a
**primeira** lição do dia local do usuário:

```
se streak_last_active_date != hoje_local(user.timezone):
  streak_current += 1
  streak_best = max(streak_best, streak_current)
  streak_last_active_date = hoje_local(user.timezone)
  emite gamification.xp_awarded (se houver XP) e um evento interno de streak atualizado
```

### 5.2 Job de risco (assíncrono, horário fixo local)

Roda a cada hora, filtrando usuários cujo horário local está em uma janela configurável antes da meia-noite
(ex.: 20h–21h local, ver SAD §10.2 "notificação preventiva algumas horas antes da virada do dia"):

```
para cada user com streak_current > 0 e streak_last_active_date != hoje_local(user.timezone):
  emite gamification.streak_at_risk (Seção 7.5) -> Notifications Service
```

### 5.3 Job de expiração (assíncrono, à meia-noite local)

Roda a cada hora, filtrando usuários cuja meia-noite local acabou de passar:

```
para cada user com streak_last_active_date != ontem_local(user.timezone) e streak_current > 0:
  se streak_freezes_available > 0:
    streak_freezes_available -= 1
    # streak_current NÃO zera; streak_last_active_date também não avança sozinho —
    # o usuário ainda precisa estudar hoje para manter a sequência viva
    registra gamification_events(event_type='streak_freeze_consumed')
  senão:
    streak_current = 0
    registra gamification_events(event_type='streak_reset')
```

## 6. Ligas Semanais — Fechamento

Job semanal (ex.: domingo 23:59 UTC — o fechamento em si não depende do fuso do usuário, apenas a coleta
de XP durante a semana já foi por evento síncrono em `league_members.xp_this_week`).

```
1. Para cada (tier, group_number) da semana corrente:
     membros_ativos = count(league_members WHERE league_id = X AND xp_this_week > 0)
     se membros_ativos < 15:
        mesclar este grupo com o grupo adjacente de mesmo tier (menor |group_number - alvo|)
        antes de calcular ranking final (regra já citada no CLAUDE.md)

2. Ordenar membros de cada grupo (pós-merge) por xp_this_week DESC.

3. Zonas (grupo de referência ~30 membros):
     top 5   -> promovidos para tier - 1 (se tier > 1)
     bottom 5 -> rebaixados para tier + 1 (se não for o tier mais baixo)
     demais  -> permanecem no tier atual

4. Cria as linhas de leagues/league_members da PRÓXIMA week_reference:
   - promovidos e rebaixados são realocados nos grupos do tier de destino (preenchendo até ~30 membros)
   - demais usuários são redistribuídos mantendo o tier
   - novos usuários (sem liga na semana anterior) entram no tier mais baixo

5. Emite league.week_closed (Seção 7.6) por liga fechada, para consumo por Notifications e Analytics.
```

## 7. Contratos de Evento (barramento Amazon SQS/SNS)

Tópicos já nomeados na API Specification §11, especificados aqui pela primeira vez. `event_id` é sempre
um UUID v4 usado para idempotência de consumidores; `timestamp` é ISO-8601 UTC.

### 7.1 `content.uploaded`
```json
{
  "event_id": "uuid",
  "upload_id": "uuid",
  "user_id": "uuid",
  "tenant_id": "uuid | null",
  "file_type": "pdf | docx | pptx | image | video",
  "storage_key": "string",
  "size_bytes": 0,
  "timestamp": "datetime"
}
```
Publicado pelo Ingestion Service ao receber `POST /v1/uploads/{upload_id}/complete`. Consumido pelo AI
Content Pipeline (Estágio 1, SAD §9.1).

### 7.2 `questions.generated`
```json
{
  "event_id": "uuid",
  "upload_id": "uuid",
  "question_ids": ["uuid"],
  "count": 0,
  "lowest_confidence": "high | medium | low",
  "timestamp": "datetime"
}
```
Publicado pelo AI Content Pipeline ao fim do Estágio 5 (SAD §9.5). `lowest_confidence` determina se a
fila de revisão humana é obrigatória (`confidence: "low"` em qualquer pergunta do lote → obrigatória,
regra do Persona Prompt §4.7 e do CLAUDE.md).

### 7.3 `lesson.answer_submitted`
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "session_id": "uuid",
  "lesson_id": "string",
  "question_id": "string",
  "correct": true,
  "time_ms": 0,
  "timestamp": "datetime"
}
```
Publicado pelo Learning Service ao processar `POST /v1/lessons/{lesson_id}/answers`. Consumido pelo
Gamification Service (aplica Seções 3–5 deste documento) e pelo Analytics Service.

### 7.4 `gamification.xp_awarded`
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "xp_amount": 0,
  "source": "lesson_answer | infinite_mode | achievement",
  "reference_id": "uuid",
  "xp_total_after": 0,
  "level_after": 0,
  "daily_cap_reached": false,
  "timestamp": "datetime"
}
```
`daily_cap_reached` reflete o resultado de `calcularXP` (§3.2) — `xp_amount` já vem líquido do teto
diário aplicado, nunca o valor bruto pré-teto.
Publicado pelo Gamification Service após aplicar `calcularXP`. Consumido por Notifications (celebração de
level-up) e Analytics. Invalida o cache `user:{id}:profile` (Database Design §6).

### 7.5 `gamification.streak_at_risk`
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "streak_current": 0,
  "local_hour": 20,
  "timestamp": "datetime"
}
```
Publicado pelo job da Seção 5.2. Consumido pelo Notifications Service (deep-link direto para a lição
sugerida do dia, conforme UX TDD §4.3).

### 7.6 `league.week_closed`
```json
{
  "event_id": "uuid",
  "league_id": "uuid",
  "week_reference": "date",
  "tier": 0,
  "final_ranking": [{ "user_id": "uuid", "xp_this_week": 0, "position": 1 }],
  "promoted_user_ids": ["uuid"],
  "demoted_user_ids": ["uuid"],
  "timestamp": "datetime"
}
```
Publicado pelo job da Seção 6. Consumido por Notifications ("Você foi promovido para a Liga X!") e
Analytics.

## 8. Fluxos de Sequência

### 8.1 Upload → IA → Publicação

```
Cliente          Ingestion Svc      Object Storage    Message Broker    AI Content Pipeline   Question Bank
  |  POST /uploads      |                  |                 |                  |                    |
  |--------------------->|                  |                 |                  |                    |
  |  upload_url (pré-assinada)              |                 |                  |                    |
  |<---------------------|                  |                 |                  |                    |
  |  PUT direto para o storage (binário nunca passa pela API) |                  |                    |
  |------------------------------------------------------------>|              |                    |
  |  POST /uploads/{id}/complete            |                 |                  |                    |
  |--------------------->|                  |                 |                  |                    |
  |                       |-- content.uploaded (7.1) --------->|                  |                    |
  |                       |                  |                 |--- consome ----->|                    |
  |                       |                  |                 |                  |-- OCR/STT/RAG ---->|
  |                       |                  |                 |                  |-- gera perguntas -->|
  |                       |                  |                 |<-- questions.generated (7.2) ---------|
  |  GET /uploads/{id}/questions (poll ou push via Notify)      |                  |                    |
  |<----------------------------------------------------------------------------------------------------|
  |  PATCH .../questions/{qid} (approve/edit/reject) por questão                                        |
  |------------------------------------------------------------------------------------------------------>|
  |  publica trilha -> aparece em "Minhas trilhas geradas"                                                |
```

### 8.2 Resposta → Gamificação → Notificação

```
Cliente        Learning Svc      Message Broker    Gamification Svc      Notifications Svc     Redis/Cache
  | POST .../answers   |                |                  |                     |                  |
  |------------------->|                |                  |                     |                  |
  |                     |-- lesson.answer_submitted (7.3) ->|                     |                  |
  |                     |                |                  |-- calcularXP (§3) ->|                  |
  |                     |                |                  |-- SRS update (§4) --|                  |
  |                     |                |                  |-- streak (§5) ------|                  |
  |                     |                |                  |-- gamification.xp_awarded (7.4) ------->|
  |                     |                |                  |                     |-- invalida cache ->|
  | resposta síncrona (correct, xp_ganho, vidas_restantes, streak_atual, explicacao) — API Spec §6      |
  |<----------------------------------------------------------------------------------------------------|
```

A resposta síncrona ao cliente **não espera** o processamento assíncrono de gamificação completo — os
campos `xp_ganho`/`streak_atual` retornados por `POST /v1/lessons/{lesson_id}/answers` já refletem o
resultado do cálculo, que roda em linha antes de responder (o evento `lesson.answer_submitted` é publicado
para os consumidores *além* do Learning Service — Analytics, auditoria — não é o único caminho de escrita
do XP). Isso evita depender de round-trip assíncrono dentro do plano síncrono de baixa latência (SAD §5.1).

## 9. Glossário

- **SM-2**: algoritmo clássico de repetição espaçada (Wozniak, 1987), adaptado aqui para entrada
  binária correto/incorreto + tempo de resposta.
- **q (qualidade)**: variável de 0 a 5 usada pelo SM-2 para decidir o próximo intervalo; ver Seção 4.1.
- **Zona de promoção/rebaixamento**: os 5 melhores/piores de cada grupo de liga ao fim da semana; ver
  Seção 6 e UX TDD §6.4 para a representação visual.

— Fim do documento —
