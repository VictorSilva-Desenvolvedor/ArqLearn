# DOCUMENTO TÉCNICO DE DESIGN (TDD)
## ArqLearn — Algoritmos de Negócio, Contratos de Evento e Fluxos de Sequência

Versão 1.6 | Agosto de 2026
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
| 1.1 | 09/08/2026 | Equipe de Arquitetura/Engenharia | Adiciona §5.4 Vidas — Regeneração (a pedido do usuário): `hearts_current` nunca regenerava sozinho, `hearts_updated_at` existia no schema (Database Design) mas não era usado em lugar nenhum do backend |
| 1.2 | 15/08/2026 | Equipe de Arquitetura/Engenharia | Adiciona §3.3 (multiplicador de XP do VIP) e §9 (VIP "Mestre Arquiteto" — ativação, expiração preguiçosa, extensão de cupom, baú garantido, resets), a pedido do usuário |
| 1.3 | 18/08/2026 | Equipe de Arquitetura/Engenharia | §5.4: `HEARTS_REGEN_INTERVAL` muda de 3h por vida (15h pra encher do zero) pra 36min por vida (3h pra encher do zero), a pedido do usuário — achado confuso em teste ao vivo em device real. Regra do Baú Diário/Semanal (contar só respostas certas) também mudou na mesma sessão — documentada na API Specification v1.20 (§8.1/§8.2), não neste arquivo |
| 1.4 | 20/08/2026 | Equipe de Arquitetura/Engenharia | §3: `bonus_velocidade` (por resposta rápida) substituído por `bonus_combo` (pela maior sequência de acertos consecutivos da sessão, concedido uma única vez na última pergunta) — achado do porte de gamificação (`Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`): premiar velocidade cria incentivo a responder apressado num domínio que exige raciocínio cuidadoso (norma, dimensionamento). Novo §3.0.1 documenta o estado de combo em `practice_sessions` |
| 1.5 | 21/08/2026 | Equipe de Arquitetura/Engenharia | Novo §10 (Dificuldade Adaptativa) — habilidade do usuário por tópico, modelo logístico de 1 parâmetro (tipo Rasch/IRT simplificado) usado pelo Modo Infinito, implementado antecipadamente e fora da ordem original de `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` (decisão explícita do usuário). §10 (Glossário) renumerado para §11 |
| 1.6 | 21/08/2026 | Equipe de Arquitetura/Engenharia | Novo §11 (Personalização de Notificações) — bandit de template (Thompson Sampling, Beta-Bernoulli) pro gatilho de streak em risco, implementado antecipadamente e fora da ordem original de `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` (mesmo precedente do §10). Corrige um gap que a própria §5.2 já pedia (job rodando de hora em hora, filtrando pela janela horária local) e nunca tinha sido construído. §11 (Glossário) renumerado para §12 |

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
calcularXP(question, combo_maximo, is_last_question, is_first_completion, correct, xp_today) =
  se correct == false:
    retorna { xp_concedido: 0, daily_cap_reached: false }
                       # errar nunca concede XP, apenas consome vida (hearts_current -= 1) e zera
                       # combo_atual (ver §3.0.1) — não confundir com combo_maximo, que não
                       # decresce dentro da sessão mesmo depois de um erro

  base = BASE_POR_DIFICULDADE[question.difficulty]   # easy: 10, medium: 20, hard: 30, impossible: 40
  bonus_combo = min(combo_maximo, 5) se is_last_question senão 0
                       # concedido uma ÚNICA vez, na última pergunta da sessão — sobre o PICO de
                       # acertos consecutivos da sessão inteira (§3.0.1), não por resposta
                       # individual respondida rápido (ver v1.4 no changelog — substitui o antigo
                       # bonus_velocidade)
  bonus_primeira_conclusao = 10 se is_first_completion senão 0
                       # concedido uma única vez por lição (transição para status "completed"
                       # nunca vista antes nesse user_progress), não em repetições de SRS

  xp_calculado = base + bonus_combo + bonus_primeira_conclusao

  # teto diário — ver §3.2
  xp_disponivel_hoje = max(0, DAILY_XP_CAP - xp_today)
  xp_concedido = min(xp_calculado, xp_disponivel_hoje)

  retorna { xp_concedido, daily_cap_reached: xp_concedido < xp_calculado }
```

`is_first_completion` é resolvido consultando `user_progress.status` (Database Design §4.4) **antes** da
escrita da resposta atual — se a lição ainda não estava `completed`, e esta resposta completa a lição, o
bônus se aplica. `xp_today` é lido de `user_gamification.xp_today` (ver §3.2) antes do cálculo.

### 3.0.1 Combo (sequência de acertos)

`combo_atual` e `combo_maximo` vivem em `practice_sessions` (Database Design §4.4.1), não em
`user_gamification` — é estado **da sessão**, não da conta: zera a cada nova lição iniciada, nunca
persiste entre sessões diferentes. A cada resposta:

```
se correct:
  combo_atual += 1
  combo_maximo = max(combo_maximo, combo_atual)
senão:
  combo_atual = 0   # combo_maximo NÃO reseta — guarda o pico da sessão até o fim
```

`is_last_question` é o mesmo booleano já usado para decidir `status = "completed"` em
`user_progress` (`len(answered_question_ids) + 1 >= len(question_ids)`) — o bônus de combo é
avaliado no mesmo instante, sobre o `combo_maximo` **já atualizado com a resposta corrente**.
Motivo da mudança (v1.4): o antigo `bonus_velocidade` premiava responder rápido, o que cria
incentivo perverso num domínio onde a resposta certa exige ler enunciado normativo, comparar
solução ou conferir cota — response rápida não é sinal de qualidade aqui. Combo prêmia não errar
ao longo da sessão inteira, sem pressionar o tempo de cada resposta individual.

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

### 3.3 VIP: Multiplicador de XP *(v1.16, a pedido do usuário)*

Usuário com VIP "Mestre Arquiteto" ativo (ver §9) recebe `VIP_XP_MULTIPLIER = 1.25` (+25%) sobre o
XP calculado de cada resposta certa — aplicado **dentro** de `calcularXP`, **antes** do Limite
Diário de XP (§3.2): `xp_calculado = round((base + bonus_combo + bonus_primeira_conclusao) *
1.25)` quando VIP ativo, e só então esse valor é capado pelo `DAILY_XP_CAP` como qualquer outro.
Decisão deliberada: o teto diário continua **500 XP/dia para todo mundo**, VIP ou não — o
multiplicador só faz o VIP alcançar esse teto mais rápido, não elevar o teto em si. Implementado em
`internal/gamification.CalcularXP` (parâmetro `vipAtivo`).

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

### 5.4 Vidas — Regeneração

> Agrupada aqui por conveniência de numeração (não renumerar §6–§9, referenciados por número em vários
> outros arquivos) — não é parte da mecânica de streak, é independente.

Sem job dedicado — recalculado sob demanda ("lazy", mesmo padrão de `xpHojeAposReset`, §3.2) sempre que
`hearts_current`/`hearts_updated_at` são lidos: `GET /v1/gamification/me`,
`POST /v1/lessons/{lesson_id}/session` (checagem de acesso) e `POST /v1/lessons/{lesson_id}/answers`
(antes de aplicar uma eventual perda de vida da resposta atual). `hearts_updated_at` marca o instante da
última mudança no contador (perda ou regeneração) — não é "última vez que o endpoint rodou".

```
HEARTS_MAX = 5
HEARTS_REGEN_INTERVAL = 36min   # 3h pra encher do zero (36min × 5) — era 3h POR vida (15h no
                                 # total) até 18/08/2026, a pedido do usuário

função regenerarVidas(hearts_current, hearts_updated_at, agora):
  se hearts_current >= HEARTS_MAX:
    retorna (hearts_current, hearts_updated_at)   # nada a fazer, timer não importa mais

  decorrido = agora - hearts_updated_at
  ticks = floor(decorrido / HEARTS_REGEN_INTERVAL)
  se ticks <= 0:
    retorna (hearts_current, hearts_updated_at)   # ainda não passou 1 intervalo completo

  novo = hearts_current + ticks
  se novo >= HEARTS_MAX:
    retorna (HEARTS_MAX, agora)
  senão:
    # avança o relógio só pelos ticks realmente aplicados — preserva o progresso parcial do
    # próximo tique em vez de resetar pra "agora" (ex.: se o intervalo é 36min e o usuário volta
    # depois de 50min com só 1 vida faltando, ganha 1 vida e o próximo tique já está a 14min de
    # distância, não a 36min de novo)
    retorna (novo, hearts_updated_at + ticks * HEARTS_REGEN_INTERVAL)
```

**Perda de vida** (resposta errada, `POST /.../answers`, RF-09): `hearts_current -= 1` (nunca abaixo de
0). `hearts_updated_at` só avança pra `agora` se `hearts_current` estava no teto (`HEARTS_MAX`) antes
desta perda — ou seja, nenhum ciclo de regeneração estava rodando ainda. **Mudado em 19/08/2026, a
pedido do usuário** (era: toda perda reiniciava o relógio, mesmo com um ciclo já em andamento — achado
injusto em teste ao vivo: faltando poucos segundos pra próxima vida, uma resposta errada jogava de
volta pros 36 minutos inteiros). Com um ciclo já em andamento (`hearts_current < HEARTS_MAX` antes da
perda), `hearts_updated_at` **não muda** — o tique já em progresso continua contando pra entregar a
próxima vida no horário original, e a vida recém-perdida só se soma à fila (múltiplas perdas dentro do
mesmo ciclo em andamento não empilham tempo extra, só reduzem `hearts_current` pelo mesmo relógio já
rodando).

**Compra de recarga completa** (`POST /v1/gamification/shop/purchase`, item categoria `hearts_refill`):
`hearts_current = HEARTS_MAX` e `hearts_updated_at = agora` — equivalente a já estar cheio, timer não
importa até a próxima perda.

**Exposição ao cliente:** `GamificationProfile.hearts_next_at` (API Spec §3.2, v1.10) é
`hearts_updated_at + HEARTS_REGEN_INTERVAL` quando `hearts_current < HEARTS_MAX`, ou `null` quando já
está no teto — o cliente calcula a contagem regressiva localmente a partir desse timestamp fixo, sem
precisar saber o valor do intervalo nem repetir a lógica de regeneração.

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

## 9. VIP "Mestre Arquiteto" *(v1.16, a pedido do usuário; benefícios expandidos em v1.23, 19/08/2026)*

Tier de entitlement (não uma role de `users.role`) que concede: multiplicador de XP por resposta
(§3.3), **teto diário de XP dobrado** (`VIPDailyXPCapMultiplier = 2`, ver §3.2 — reverte a decisão
original de manter o mesmo teto de 500/dia pra todo mundo), **regeneração de vidas 70% mais rápida**
(`VIPHeartsRegenFactor = 0.3` sobre `HEARTS_REGEN_INTERVAL`, §5.4 — 36min vira ~10min48s por vida),
**gemas dobradas em toda fonte** (`VIPGemsMultiplier = 2` — Baú Diário, conquistas, recompensa de
Reportar Bug; não se aplica a compras, que debitam gemas em vez de conceder, nem ao Baú Semanal
quando cai no item garantido abaixo, que não envolve gemas), Baú Semanal garantido e resets extras
de baú diário/semanal (contratos completos em `ArqLearn_API_Specification.md` §8.3 — não duplicados
aqui). Esta seção cobre só as regras de negócio que não são óbvias a partir do contrato de API.

**Teto diário de XP (`VIPDailyXPCapMultiplier`):** `CalcularXP` usa `DailyXPCap * 2` (1000) como
teto quando `vipAtivo`, em vez do `DailyXPCap` normal (500) — mudança de 19/08/2026, a pedido do
usuário; antes disso o VIP só alcançava o mesmo teto de todo mundo mais rápido (multiplicador por
resposta), sem um teto maior. Não confundir com o multiplicador de XP por resposta (§3.3), que
continua existindo e é aplicado ANTES deste teto, como sempre foi.

**Regeneração de vidas (`VIPHeartsRegenFactor`):** `RegenerarVidas`/`ProximaVidaEm` usam
`HEARTS_REGEN_INTERVAL * 0.3` como intervalo efetivo quando `vipAtivo`, em vez do intervalo normal
de 36min — encher as 5 vidas do zero leva ~54min pro VIP, contra 3h pra não-VIP. Mesma lógica de
"ticks" e preservação de progresso parcial do §5.4 original, só com o intervalo trocado.

**Gemas dobradas (`VIPGemsMultiplier`):** aplicado no ponto de concessão, não como um recálculo
depois — cada fonte de gema (`RolarRecompensaBau` no Baú Diário, `EvaluateAndUnlock` em conquistas,
`AwardGems` em Reportar Bug) dobra o valor sorteado/fixo ANTES de gravar no banco, quando o usuário
está VIP ativo naquele instante. `AwardGems` devolve o valor REALMENTE creditado (já dobrado se
VIP), não o valor originalmente pedido pelo chamador, pra mensagens ao usuário mostrarem o número
certo.

**Ativação:** dois caminhos, ambos gravam `user_gamification.is_vip`/`vip_expires_at`.
1. **Cupom** — 10 dígitos numéricos, gerado por um admin, resgatável uma única vez.
2. **Assinatura recorrente** — schema pronto (`vip_subscription_status`), endpoint **desabilitado**
   até um gateway de pagamento real ser integrado (nenhuma cobrança acontece hoje).

**Expiração — preguiçosa, sem job (mesmo padrão de §5.4 vidas e §5.2/§5.3 streak):**
`EhVIPAtivo(is_vip, vip_expires_at, agora)`:
- `is_vip = false` → nunca ativo, independentemente de `vip_expires_at`.
- `is_vip = true` e `vip_expires_at = null` → ativo, **vitalício** (sem prazo).
- `is_vip = true` e `vip_expires_at` no futuro → ativo até esse instante.
- `is_vip = true` e `vip_expires_at` no passado → **inativo** — nenhum job zera `is_vip`; a próxima
  leitura já calcula `false` a partir da comparação de data. Nenhum benefício (multiplicador, baú
  garantido, resets) é aplicado quando este cálculo resulta em `false`, mesmo com `is_vip = true`
  gravado no banco.

**Extensão ao resgatar cupom (`EstenderVIP`):** se o VIP já está ativo (não vitalício), o novo prazo
soma a partir da **expiração atual**, não de agora — resgatar um segundo cupom antes do primeiro
acabar empilha os dias em vez de desperdiçar o que sobrava. Sem VIP ativo (nunca teve ou já
expirou), o prazo conta a partir de agora. VIP vitalício permanece vitalício (um cupom nunca
"encolhe" um benefício concedido sem prazo).

**Baú Semanal garantido:** para VIP ativo, a recompensa do Baú Semanal (ver nota de divergência
abaixo sobre onde o Baú em si está documentado) não é sorteada: é sempre Bloqueio de Ofensiva. O
Baú Diário continua sorteado normalmente mesmo para VIP.

**Resets de baú (1x/dia no diário, 2x/ciclo no semanal):** não é uma segunda recompensa — resetar só
limpa a marca de "já reivindicado" do período vigente (`chest_claimed_date` /
`chest_weekly_claimed_cycle_start`), reabrindo a mesma abertura pendente sem exigir novas perguntas
respondidas (o contador de perguntas do baú não é zerado ao abrir). O contador de quantos resets já
foram usados no período (`vip_daily_chest_resets_used`/`vip_weekly_chest_resets_used`) segue o
mesmo reset preguiçoso do contador de perguntas — compara a data/ciclo salvo contra o vigente.

> **Nota de divergência (transparência, não resolvida nesta mudança):** os algoritmos do Baú
> Diário/Semanal em si (`RolarRecompensaBau`, `QuestoesHojeAposReset` etc., migrations 0009/0010)
> nunca ganharam uma seção própria neste documento, apesar de já implementados e em produção — só
> os comentários de código e a API Spec §8.1/§8.2 os documentam hoje. Fora do escopo desta mudança
> (VIP), sinalizado aqui em vez de resolvido silenciosamente, conforme `Docs/CLAUDE.md`.

## 10. Dificuldade Adaptativa (Habilidade do Usuário) *(v1.5, 21/08/2026)*

Até esta versão, `question.difficulty` (`easy`/`medium`/`hard`/`impossible`, atribuído pela IA na
geração conforme a rubrica do `Persona Prompt` §4.5) só influenciava `CalcularXP` (§3) — não
afetava em nada a ordem ou a seleção do que é servido ao usuário. Uma sessão de lição podia abrir
com uma pergunta "impossível" e fechar com uma "fácil"; o Modo Infinito escolhia a próxima
pergunta por sorteio uniforme, sem olhar pra dificuldade nem pra desempenho de quem estava
respondendo.

Esta seção documenta duas mudanças aditivas, implementadas antecipadamente e fora da ordem
original de `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` (que já continha o item "3.1
Ateliê"/"3.2 Repetição Espaçada" para uma peça relacionada — ver §10.3) — decisão explícita do
usuário, não descoberta silenciosa de divergência.

### 10.1 Ordenação por dificuldade (sem novo estado)

- **Sessão de lição** (`POST /v1/lessons/{lesson_id}/session`): a fila de perguntas, antes servida
  na ordem bruta de `lesson.question_ids`, agora é reordenada por dificuldade ascendente (fácil →
  médio → difícil → impossível), com desempate estável preservando a ordem original entre
  perguntas da mesma dificuldade.
- **Lições dentro de uma trilha** (`GET /v1/tracks/{track_id}/lessons`): `lesson.difficulty`
  (existente desde sempre no schema, nunca consumido por nenhum código até aqui) agora também
  ordena as lições **dentro de cada unidade** por dificuldade ascendente, com o mesmo desempate
  estável. `unit.order` continua sendo o único controle de ordem **entre** unidades — esta mudança
  não toca nisso, só refina a ordem dentro de uma mesma unidade.

Nenhuma das duas mudanças precisa de novo campo persistido — só consome dados que já existiam.

### 10.2 Habilidade adaptativa por tópico (Modo Infinito)

Modelo logístico de 1 parâmetro (tipo Rasch — um caso simplificado de IRT/Item Response Theory,
a mesma família de modelo usada em provas adaptativas tipo ENEM/TOEFL, e análoga ao motor de
dificuldade em tempo real do Duolingo, "Birdbrain"): a dificuldade do item fica **fixa**, ancorada
no rótulo já atribuído pela IA; só a habilidade do usuário se move a cada resposta. Um Elo mútuo de
verdade (item também se recalibrando por resposta) foi descartado deliberadamente — na fase
bootstrap (5-20 usuários), cada pergunta recebe respostas demais poucas pra essa recalibração
convergir; deixaria a dificuldade do item mais ruidosa, não mais precisa.

**Probabilidade de acerto esperada** — `ProbabilidadeAcerto(skill, difficulty)`:

```
P(acerto) = 1 / (1 + exp(-(skill - b)))
```

onde `b` é o parâmetro de dificuldade do item, numa escala logística comum à de `skill`:

| Dificuldade | b (difficultyLogit) |
|---|---|
| easy | -1.5 |
| medium | -0.5 |
| hard | 0.5 |
| impossible | 1.5 |

**Atualização da habilidade** — `AtualizarHabilidade(skillAtual, respostasNoTopico, difficulty, correct)`:

```
p = ProbabilidadeAcerto(skillAtual, difficulty)
resultado = 1 se correct, senão 0
K = SkillKProvisional (0.6) se respostasNoTopico < 10, senão SkillKEstablished (0.2)
skillNovo = clamp(skillAtual + K * (resultado - p), SkillMin=-6.0, SkillMax=6.0)
```

`respostasNoTopico` é a contagem **antes** desta resposta (0..9 usa K provisório — convergência
rápida nas primeiras respostas do usuário naquele tópico —, 10+ usa K estabelecido, mais
estável). O clamp em `SkillMin`/`SkillMax` (bem fora da faixa de `b`, ±1.5) evita que um tópico
cujo pool curado seja majoritariamente "easy" deixe a habilidade subir sem limite — todo acerto
num item fácil sempre gera um resíduo positivo, por menor que seja, já que nunca atinge P=1 de
verdade. Mesmo espírito do piso de `ease_factor` em `AtualizarSRS` (§4.2).

`skill_score` é persistido por **(usuário, tópico)**, não por track e não global — evita achatar
proficiência de tópicos diferentes numa nota só (ex.: bom em Fundamentos, fraco em Estruturas). Ver
Database Design §3.2 (`user_topic_skill`).

**Seleção da próxima pergunta (Modo Infinito):** dentro do pool de perguntas aprovadas candidatas,
filtra pras dificuldades cuja `ProbabilidadeAcerto` pro `skill_score` atual cai na faixa
"Goldilocks" `[0.25, 0.85]` — nem fácil demais, nem difícil demais. Uma banda, não só as 2
dificuldades mais próximas de 50%, porque um corte rígido demais esgotaria pool fino (tópico
curado com poucas perguntas) mais rápido do que a seleção uniforme fazia antes desta mudança; se o
subconjunto filtrado tiver menos de 3 candidatos, cai pro pool completo em vez de arriscar reportar
o tópico esgotado prematuramente. Sorteio uniforme dentro do subconjunto sobrevivente.

**Limitação aceita:** `difficultyLogit` é global, não por tópico — assume que a rubrica da IA
calibra igual em todo tópico/lote de geração. Sem recalibração por item (ver acima), não há
mecanismo pra detectar se essa suposição for falsa num tópico específico. Trade-off aceito dado o
tamanho real da base de usuários; reavaliar se/quando a base crescer o suficiente pra sustentar
recalibração por item (mesmo espírito de gatilho de graduação do `Estrategia_Bootstrap` §7).

**Kill-switch:** `gamification.AdaptiveDifficultyEnabled` (flag de código, mesmo padrão de
`EventsEnabled`/`VIPSubscriptionsEnabled` — sem infra de feature flag em runtime neste projeto
ainda). Desligado, o Modo Infinito volta à seleção uniforme aleatória de antes desta mudança, sem
afetar XP/SRS/vidas/streak.

### 10.3 Relação com a fila de revisão do SRS (Ateliê/§4)

O SRS (variação do SM-2, §4) já calculava `srs_state.next_review_at` a cada resposta de lição, mas
nenhum código lia esse campo de volta — calculado e ignorado. A fila de revisão ("Revisar agora",
que consome esse campo) é um sistema **separado** desta habilidade adaptativa: SRS já resolve
"quando" trazer um item de volta; esta seção resolve "quão difícil" servir agora. A fila de revisão
não aplica a seleção Goldilocks acima — um item vencido aparece na fila de revisão
independentemente de estar ou não no ponto ideal de dificuldade pro `skill_score` do momento, já
que o próprio vencimento do SRS já é o sinal relevante ali.

## 11. Personalização de Notificações (Bandit de Template) *(v1.6, 21/08/2026)*

Até esta versão, o único gatilho de notificação ativo (streak em risco) mandava sempre a mesma
mensagem hardcoded, sem variação, sem cooldown, sem teto diário — e o job que o dispara
(`cmd/notify-decide`, antes `cmd/notify-streak-risk`) nunca esteve ligado a nenhum agendamento
automático (rodava só manualmente). Esta seção documenta duas mudanças: um motor de personalização
novo ("o quê" enviar) e a correção de um gap já documentado mas nunca construído ("quando" enviar).
Implementado antecipadamente e fora da ordem original de
`Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` ("2.4 Notificações" está na Fase 2, ainda não
aprovada) — decisão explícita do usuário, mesmo precedente da Seção 10.

### 11.1 Correção: janela horária local (§5.2 já pedia isso)

A §5.2 já especificava "roda a cada hora, filtrando usuários cujo horário local está numa janela
configurável antes da meia-noite" — nunca implementado de fato (o código antigo varria todo mundo,
a qualquer hora, só quando alguém rodava o comando manualmente). `cmd/notify-decide` agora roda de
hora em hora via `.github/workflows/notify-decide.yml` e só age quando o horário local do usuário
(`users.timezone`) cai dentro de uma janela configurável (`janelaInicioHoraLocal`/
`janelaFimHoraLocal`, default 20h-22h local).

### 11.2 Bandit de template — Thompson Sampling (Beta-Bernoulli)

Cada variação de mensagem de um gatilho ("braço") acumula `(successes, failures)` em
`notification_template_stats` (Database Design §3.2), começando em `(1, 1)` — prior uniforme. A
cada decisão de envio, amostra-se `Beta(successes, failures)` de cada template elegível e escolhe-se
o de maior amostra:

```
P(acerto) via amostra de Beta(successes_i, failures_i) pra cada template i elegível
escolhe o template com maior amostra
```

**Amostragem de `Beta(a,b)`** — identidade exata (não aproximação), já que `successes`/`failures`
são sempre inteiros positivos: `Gamma(k,1)` pra `k` inteiro positivo é a soma de `k` amostras
`Exponential(1)` (`-ln(U)`, `U~Uniforme(0,1)`); `Beta(a,b) = X/(X+Y)` com `X~Gamma(a,1)`,
`Y~Gamma(b,1)` independentes.

O item (dificuldade do braço) nunca se recalibra sozinho — só a estatística de sucesso/falha do
template se move, mesmo raciocínio de "sem Elo mútuo" da Seção 10: com ~5-20 usuários, um esquema
que também recalibrasse o item por resposta teria dado de menos pra convergir.

Thompson Sampling escolhido por nome, não substituído por uma alternativa mais simples (ex.: UCB1)
— o usuário pediu esse algoritmo especificamente, com pseudocódigo próprio; trocar silenciosamente
seria a divergência que este documento existe pra evitar (`Docs/CLAUDE.md`).

### 11.3 Recompensa, cooldown e teto diário

- **Janela de recompensa**: 24h após o envio. Sinal: houve `gamification.EventItemRespondido`
  (evento `item_respondido`, `gamification_events`) pro usuário nesse intervalo. Erro de consulta
  nunca é tratado como "sem atividade" — a linha fica sem avaliar (`evaluated_at` continua `NULL`)
  e é reavaliada na rodada seguinte. Atualização é transacional (mesmo padrão de `answers.go`/
  `vip.go`): marcar o envio como avaliado e atualizar a estatística do template acontecem juntos,
  ou nenhum dos dois.
- **Acoplamento a documentar**: `gamification.EventsEnabled` (kill-switch, `events.go`) desligado
  faria `item_respondido` nunca ser gravado — toda avaliação futura leria "sem atividade" pra todo
  mundo, envenenando o bandit silenciosamente. Se esse kill-switch for desligado algum dia, este
  job precisa ser pausado junto.
- **Cooldown**: um template não é reoferecido ao mesmo usuário antes de 3 dias — exclusão dura, não
  uma curva de decaimento tipo esquecimento (aplicar SM-2/HLR à fadiga de notificação é um salto
  conceitual maior do que vale a pena agora). Se o cooldown excluir todos os templates elegíveis
  (histórico curto), ele é ignorado nessa rodada — melhor repetir do que não mandar nada.
- **Teto diário** (`RX-05`, já era regra do backlog de gamificação, nunca implementada): no máximo
  2 notificações por dia local por usuário, contando **todos os tipos** (não só as via bandit) —
  consulta a própria coleção `notifications` inteira.

### 11.4 Decisão de escopo — sem bandit de horário aprendido ainda

O único gatilho real hoje (streak em risco) tem semântica de horário não-personalizável por
natureza: o aviso só faz sentido perto do fim do dia local (é um "ainda dá tempo de praticar
hoje"), não no horário que o usuário historicamente mais estuda. Um bandit de horário de verdade
(aprender por usuário qual sub-janela funciona melhor) exigiria uma máquina de "decide agora,
dispara depois" — complexidade real de estado — ou reamostrar a cada hora e só agir se a amostra
bater com a hora atual, o que pode simplesmente não disparar em noite nenhuma por azar de
amostragem (um bug de correção, não um trade-off aceitável). Com poucos usuários e no máximo 1
evento por dia por pessoa, esse aprendizado convergeria devagar demais pra justificar a
complexidade agora — mesmo raciocínio de proporcionalidade da Seção 10 sobre Elo mútuo/SRS por
pergunta. Fica como gatilho de graduação futuro, não esquecido: revisitar quando o volume de
usuários/gatilhos justificar.

### 11.5 Relação com a fila de revisão do SRS (§10.3)

Sistema independente: a fila de revisão (§10.3) decide qual PERGUNTA de lição revisar; esta seção
decide qual MENSAGEM DE NOTIFICAÇÃO enviar e quando. Os dois reaproveitam o mesmo evento de
telemetria (`item_respondido`) como sinal de "o usuário praticou", mas cada um o consome pro seu
próprio propósito — não há acoplamento direto entre os dois bandits.

## 12. Glossário

- **SM-2**: algoritmo clássico de repetição espaçada (Wozniak, 1987), adaptado aqui para entrada
  binária correto/incorreto + tempo de resposta.
- **q (qualidade)**: variável de 0 a 5 usada pelo SM-2 para decidir o próximo intervalo; ver Seção 4.1.
- **IRT / Rasch**: Item Response Theory — família de modelos psicométricos que relacionam
  probabilidade de acerto, habilidade do respondente e dificuldade do item; ver Seção 10.2 para o
  caso simplificado (1 parâmetro) usado aqui.
- **Beta-Bernoulli / Thompson Sampling**: par de distribuições usado pra bandit multi-armed —
  `successes`/`failures` acumulados por braço parametrizam uma `Beta`, amostrada a cada decisão;
  ver Seção 11.2.
- **Zona de promoção/rebaixamento**: os 5 melhores/piores de cada grupo de liga ao fim da semana; ver
  Seção 6 e UX TDD §6.4 para a representação visual.

— Fim do documento —
