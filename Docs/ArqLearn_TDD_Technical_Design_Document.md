# DOCUMENTO TÉCNICO DE DESIGN (TDD)
## ArqLearn — Algoritmos de Negócio, Contratos de Evento e Fluxos de Sequência

Versão 1.12 | Agosto de 2026
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
| 1.7 | 21/08/2026 | Equipe de Arquitetura/Engenharia | Novo §5.5 — teto escalonado de bloqueios de ofensiva (RS-03, fecha gap já documentado no backlog) e reparo de streak / grace window de 3 dias (RS-08, mecânica nova inspirada no Duolingo), ambos implementados antecipadamente e fora da ordem original do backlog (mesmo precedente de §10/§11). §5.3 ganha nota de implementação corrigindo a descrição de "job horário" pra "avaliação preguiçosa em dois pontos" (achado ao implementar o reparo — o gap não tinha sido percebido antes por não ter consequência visível até agora) |
| 1.8 | 21/08/2026 | Equipe de Arquitetura/Engenharia | §3.3 ganha o XP Boost — multiplicador temporário de 2x por 15min, concedido via recompensa de Baú Diário/Semanal, empilhável com o multiplicador VIP num único arredondamento (mecânica nova inspirada no Duolingo, implementada antecipadamente e fora da ordem original do backlog, mesmo precedente de §5.5/§10/§11). Corrige a frase obsoleta do próprio §3.3 ("o teto diário continua 500 XP/dia para todo mundo, VIP ou não") — já falsa desde que §9 dobrou o teto pra VIP (19/08/2026), achado ao revisar este arquivo pra esta entrega |
| 1.9 | 21/08/2026 | Equipe de Arquitetura/Engenharia | §5.1 revisado — streak avança em qualquer resposta certa (não só ao concluir a lição inteira pela primeira vez), e o Modo Infinito passa a contar também (antes não tocava streak) — decisão explícita do usuário, motivada por um caso real reportado ("respondi um item e a streak continuou em 0"). §5.5 atualizado pra refletir o novo gatilho no reparo de streak |
| 1.10 | 21/08/2026 | Equipe de Arquitetura/Engenharia | Novo §12 (Conquistas — Awards e Personal Records): Awards (`achievements.go`, catálogo de ~44 tipos) nunca tinha sido formalizado aqui, apesar de real desde a v1.16 da API Specification — gap, não divergência. Personal Records (`personalrecords.go`, migrations/0021) é a mecânica nova desta versão — segunda categoria de conquista, inspirada no redesign de 2023 do sistema de Achievements do Duolingo, que compara contra o próprio recorde do usuário em vez de um limiar fixo. §12 (Glossário) renumerado para §13 |
| 1.11 | 22/08/2026 | Equipe de Arquitetura/Engenharia | Novo §13 (Meta Diária): reconcilia (não segue à letra) `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` §1.4 e as regras RS-01/RS-02 (`Docs/ignorar/Duolingo/REGRAS-gamificacao.md`) — decisão discutida e confirmada com o usuário, não uma divergência silenciosa. Nível de intensidade escolhido pelo usuário (4 presets) substitui o gatilho fixo de 10 perguntas do Baú Diário. §13 (Glossário) renumerado para §14 |
| 1.12 | 22/08/2026 | Equipe de Arquitetura/Engenharia | Novo §15 (Moeda e Loja): livro-razão de gemas (`gem_transactions`, retrofitado nos 5 pontos que já mexiam em `gems` antes desta versão, não só nos novos), pacotes de gemas com compra real mockada atrás de `GemPackagePurchasesEnabled = false` + cupom admin como caminho funcional hoje (mesmo padrão do VIP, §9), e Double or Nothing (aposta de streak, `gem_bets`) — reconcilia (não segue à letra) RE-06 (`Docs/ignorar/Duolingo/REGRAS-gamificacao.md`), decisão discutida e confirmada com o usuário. §15 (Glossário) renumerado para §16 |

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

### 3.3 VIP: Multiplicador de XP *(v1.16, a pedido do usuário)* e XP Boost *(v1.8)*

Usuário com VIP "Mestre Arquiteto" ativo (ver §9) recebe `VIP_XP_MULTIPLIER = 1.25` (+25%) sobre o
XP calculado de cada resposta certa — aplicado **dentro** de `calcularXP`, **antes** do Limite
Diário de XP (§3.2). **Nota de correção (v1.8):** ao contrário do que uma versão anterior desta
seção dizia ("o teto diário continua 500 XP/dia para todo mundo, VIP ou não"), o teto diário **é
dobrado** pra VIP (`VIP_DAILY_XP_CAP_MULTIPLIER = 2`, 500 → 1000) — decisão revertida em 19/08/2026,
a pedido do usuário (ver §9, "reverte a decisão original de manter o mesmo teto... pra todo
mundo"); a frase antiga desta seção ficou obsoleta e não foi corrigida até agora.

**XP Boost** (v1.8, mecânica nova inspirada no Duolingo, implementada fora da ordem original do
backlog — ver `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`): multiplicador temporário,
`XP_BOOST_MULTIPLIER = 2.0` por `XP_BOOST_DURATION = 15min`, concedido como recompensa de sorteio
do Baú Diário/Semanal (§8.1/§8.2 da API Spec) — diferente do VIP (assinatura sempre-ativa), é um
item consumível de curta duração, armazenado em `user_gamification.xp_boost_active_until`
(`nil` = sem boost ativo, nunca "vitalício"). Conceder um boost enquanto outro já está ativo
**empilha** a duração a partir do fim do boost atual, não desperdiça o que sobrava (mesmo padrão de
`EstenderVIP` com cupons) — sem teto de empilhamento (baús já são limitados a 1/dia + 1/semana, não
é vetor de abuso relevante nesta escala).

**Multiplicador combinado, um único arredondamento:** quando VIP e boost estão ativos ao mesmo
tempo, os dois multiplicadores se combinam ANTES de arredondar — `multiplicador = 1.25 * 2.0 = 2.5`,
`xp_calculado = round((base + bonus_combo + bonus_primeira_conclusao) * multiplicador)`. Arredondar
em duas rodadas sequenciais (VIP primeiro, boost depois) produz um resultado diferente e
dependente da ordem — ex.: `xp_calculado_base=13`: sequencial `round(round(13*1.25)*2)=32`,
combinado `round(13*2.5)=33`. O teto diário **não** é afetado pelo boost — o boost acelera o ganho
de XP, não eleva o teto (só `VIP_DAILY_XP_CAP_MULTIPLIER` eleva o teto, decisão independente do
multiplicador de taxa). Aplica-se igualmente a lição e Modo Infinito (mesma função `CalcularXP`) —
Modo Infinito já é farm-friendly por natureza (sem bônus de combo, §3.0.1), mas como o teto diário
não é elevado pelo boost, o farm só alcança o teto existente mais rápido, nunca o ultrapassa.

Implementado em `internal/gamification.CalcularXP` (parâmetros `vipAtivo`, `boostAtivo`),
`XPBoostAtivo`/`AtivarXPBoost` (mesma vizinhança de `EhVIPAtivo`/`EstenderVIP`).

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

**Revisão 21/08/2026 (decisão do usuário):** o gatilho deixou de ser "concluir a lição inteira pela
primeira vez" — passa a ser **qualquer resposta certa**, em qualquer um dos dois modos de prática.
Antes desta mudança, o incremento só acontecia em `isFirstCompletion` (última pergunta da sessão,
primeira vez completando aquela lição) e o Modo Infinito nunca tocava streak; as duas restrições
foram removidas.

Acontece dentro do handler de `POST /v1/lessons/{lesson_id}/answers` **e** de
`POST /v1/infinite-mode/sessions/{session_id}/answers`, sempre que a resposta é certa:

```
se resposta correta E streak_last_active_date != hoje_local(user.timezone):
  streak_current += 1
  streak_best = max(streak_best, streak_current)
  streak_last_active_date = hoje_local(user.timezone)
  emite gamification.xp_awarded (se houver XP) e um evento interno de streak atualizado
```

O `!=` na condição já torna o incremento **idempotente por dia**: a primeira resposta certa do dia
local avança a streak; qualquer resposta certa seguinte no mesmo dia (na mesma lição, em outra
lição, ou no Modo Infinito) só reconfirma o estado atual, sem incrementar de novo — não precisa de
lock nem de contador auxiliar pra evitar streak em dobro no mesmo dia.

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

> **Nota de implementação real (não muda o resultado, só o mecanismo):** a fase bootstrap não tem
> scheduler horário pra isso (mesma decisão de §5.4/§9.2) — `AplicarExpiracaoStreak`
> (`internal/gamification/algorithms.go`) implementa exatamente esta regra, mas avaliada de forma
> **preguiçosa** (lazy), na hora em que a gamificação do usuário é lida ou escrita, não num cron à
> meia-noite. Isso acontece em DOIS pontos independentes do código, cada um com sua própria
> leitura/escrita — `LoadStreakWithExpiration` (`GET /v1/gamification/me`, `GET /v1/users/me`) e
> `handleSubmitAnswer` (`POST /v1/lessons/{lesson_id}/answers`) — não um caminho único
> compartilhado. Os dois eventos acima (`streak_freeze_consumed`/`streak_reset`) são emitidos nos
> dois pontos, não só num deles — ver §5.5 sobre por que isso importa pro reparo de streak.

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

### 5.5 Teto escalonado de freezes (RS-03) e reparo de streak (RS-08)

Duas proteções adicionadas a pedido do usuário, seguindo pesquisa sobre a mecânica de sequência do
Duolingo (Streak Freeze escalonado, grace window de restauração), com corte deliberado de escopo:
sem customização de horário de início de dia (o fuso IANA por usuário já resolve o problema real,
ver §5.1) e sem Friend Streak/streak social (nenhum subsistema social existe no projeto — adiado
pra Fase 4 do backlog de gamificação, por privacidade/menores).

**Teto de freezes (RS-03):**

```
CapDeFreezes(streak_best):
  se streak_best >= 100: retorna 5
  senão: retorna 2
```

Computado na hora em cada ponto de escrita de `streak_freezes_available` (compra na loja,
baú diário, baú semanal — `internal/gamification/gamification.go`), nunca cacheado. Compra na loja
**rejeita** (`409 STREAK_FREEZE_CAP_REACHED`) antes de debitar gemas quando já no teto — checado
duas vezes (fora e dentro da transação) pra fechar uma corrida entre duas compras quase
simultâneas sem cobrar gemas por um freeze que não seria creditado. Recompensa de baú (grátis) só
**deixa de incrementar** quando no teto (não rejeita, não existe "recompensa recusada" pro
usuário) — usando `CASE WHEN atual < teto THEN atual+1 ELSE atual END`, nunca `LEAST(teto,
atual+1)`, que rebaixaria destrutivamente quem já tinha mais freezes que o teto atual (ex.: comprou
10 antes desta mudança). Sem migração de dados — grandfathering é automático, o teto só se aplica a
partir do próximo incremento de cada usuário.

**Nota conhecida:** o Baú Semanal do VIP dá freeze garantido sem sorteio (§9). Com o teto, um VIP
já no teto recebe um "garantido" que não credita nada (resposta ainda diz `reward_type:
"streak_freeze"`, contagem não sobe) — comportamento aceito, não corrigido com substituição de
recompensa (fora de proporção nesta entrega).

**Reparo de streak (RS-08 — mecânica nova, não um gap de algo já planejado no backlog):**

Quando a expiração zera `streak_current` (§5.3) **sem** freeze disponível pra evitar
automaticamente, o valor perdido e um prazo de 3 dias ficam guardados
(`streak_repair_value`/`streak_repair_deadline`, Database Design §3.2). Se a próxima resposta
certa (§5.1 — lição ou Modo Infinito) acontecer dentro do prazo, a streak é restaurada (valor
perdido + 1, pelo dia de hoje) em vez de reiniciar do zero; fora do prazo, reinicia normalmente. É
gratuito e automático — sem endpoint, sem confirmação — mesma filosofia lazy de todo o resto desta
seção. Freeze continua sendo a proteção proativa/paga; reparo é uma segunda chance única de
"bem-vindo de volta", não um mecanismo concorrente.

```
PrepararReparoStreak(streak_perdido, hoje_local):
  retorna (streak_perdido, hoje_local + 3 dias)

AplicarReparoStreak(prev, repair_value, repair_deadline, hoje_local):
  se hoje_local > repair_deadline:
    retorna (prev, reparado=false)   # janela vencida — caller cai pro incremento normal (reinicia em 1)
  senão:
    novo = repair_value + 1
    retorna (StreakState{Current: novo, Best: max(prev.Best, novo), LastActiveDate: hoje_local}, reparado=true)
```

**Preparado nos dois pontos de expiração** (`LoadStreakWithExpiration` e `handleSubmitAnswer`, ver
nota em §5.3) — sem isso, um usuário que abre o app (GET) depois da streak já ter estourado teria a
streak zerada sem nenhum registro de reparo, já que GET não sabe preparar reparo se só o handler de
resposta soubesse. **Exceção:** se a expiração e a primeira conclusão do dia acontecem na MESMA
requisição (usuário volta e already completa uma lição, sem GET prévio detectando o gap), nenhum
reparo é preparado — o usuário já está reiniciando a streak em 1 pelo caminho normal, e deixar um
reparo pendente sobrando permitiria um salto indevido de streak numa conclusão futura, ignorando o
progresso orgânico feito nesse meio tempo. Prioridade freeze-antes-de-reparo é automática pela
própria construção (reparo só é preparado no branch onde `AplicarExpiracaoStreak` já decidiu que
não havia freeze). Reparo pendente nunca reclamado fica inerte nas colunas indefinidamente, sem job
de limpeza — mesma tolerância a estado obsoleto de `RegenerarVidas`/`XPHojeAposReset` acima.
Restauração bem-sucedida emite `gamification_events(event_type='streak_repaired')` e gera uma
notificação in-app (`GET /v1/notifications`, tipo `streak_repaired`, sem push).

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

## 12. Conquistas — Awards e Personal Records *(v1.10, TDD nunca teve esta seção antes — Awards já
existia no código desde a v1.16 da API Specification sem nunca ter sido formalizado aqui; Personal
Records é mecânica nova desta versão)*

Duas categorias de conquista, propositalmente distintas — inspirado no redesign de 2023 do sistema de
Achievements do Duolingo: **Awards** comparam contra um limiar fixo do catálogo; **Personal Records**
comparam contra o próprio recorde anterior do usuário. Esta seção cobre só a regra de negócio que
diferencia as duas — o catálogo completo de cada uma vive só no código (ver nota no fim desta seção),
não duplicado aqui, mesma decisão já tomada pra Awards na v1.16 da API Specification (§8).

**Awards (`internal/gamification/achievements.go`):** catálogo fixo de ~44 tipos, a maioria em
famílias de 5 níveis com limiar crescente (ex.: `streak_dias_1`..`streak_dias_5`). Cada avaliação
(`EvaluateAndUnlock`) roda contra os contadores vitalícios atuais e insere só o que ainda não foi
desbloqueado (`achievements` tem `UNIQUE (user_id, type)` — idempotente por natureza, não precisa
checar "já existe" antes de tentar inserir). Cada desbloqueio credita XP/gemas uma única vez, nunca de
novo mesmo que o contador continue subindo depois. Recompensa de Award não passa pelo limite diário de
XP (§3.2, que é especificamente sobre XP de resposta de exercício) — é um crédito direto em
`xp_total`/`gems`, sujeito ao `VIPGemsMultiplier` (§9) quando há gema envolvida.

**Personal Records (`internal/gamification/personalrecords.go`):** catálogo fixo de 4 métricas —
`streak_dias`, `infinito_sem_erros`, `xp_dia`, `liga_alcancada`. Diferente de Award, não existe uma
tabela de "desbloqueios": cada métrica é um valor que só sobe.

```
DetectRecord(previousBest, candidate):
    se candidate > previousBest:
        retorna (candidate, quebrado=true)
    retorna (previousBest, quebrado=false)   // candidato igual ou menor NUNCA quebra o recorde
```

Sem crédito de XP/gemas — Personal Record é reconhecimento, não recompensa (mesma distinção do
redesign do Duolingo entre Awards e Personal Records). `liga_alcancada` guarda o rank de liga (1-30,
mesma codificação linear de `current_tier`, §6) já alcançado — sobrevive a um rebaixamento posterior,
diferente de `current_tier` sozinho.

**Regra de reaproveitamento — não duplicar um contador que já existe:** antes de adicionar uma coluna
nova pra uma métrica de Personal Record, checar se algum sistema já mantém o valor como efeito
colateral do que já faz. `streak_dias` e `infinito_sem_erros` reaproveitam `streak_best` (§5) e
`infinite_correct_streak_best` (contador de Award "Mira Certeira") sem coluna nova. Só `xp_dia` e
`liga_alcancada` precisaram de coluna nova (`xp_day_best`/`league_best_tier`, Database Design §3.2,
migrations/0021), porque nenhum sistema existente guardava o PICO dessas duas métricas — `xp_today`
reseta todo dia local (§3.2) sem guardar o maior valor já alcançado, e `current_tier` reflete só a
posição atual da liga, caindo de novo em caso de rebaixamento.

> Catálogo completo (tipos/métricas, condições de desbloqueio, níveis, recompensas) de Awards vive em
> `services/monolith/internal/gamification/achievements.go`; o de Personal Records, em
> `.../personalrecords.go`. Título/descrição/ícone de exibição de cada um são conteúdo do cliente
> (`achievementCatalog.ts`/`personalRecordCatalog.ts`, API Specification §8) — nenhum dos dois
> catálogos é duplicado neste documento.

## 13. Meta Diária *(v1.11, 22/08/2026)*

Nível de intensidade escolhido pelo usuário entre 4 presets, medido em **perguntas certas OU
minutos estudados no dia** — o que vier primeiro, nunca os dois ao mesmo tempo e nunca só em XP.
Substitui o gatilho fixo de 10 perguntas que o Baú Diário (§8.1 API Specification) usava pra todo
mundo até a v1.29 — o nível escolhido agora decide o alvo de quem abre o baú, mas o **prêmio
continua o mesmo**, qualquer nível.

**Reconciliação com `Docs/ArqLearn_Backlog_Gamificacao_Atelie.md` §1.4 e RS-01/RS-02** (`Docs/
ignorar/Duolingo/REGRAS-gamificacao.md`) — discutida e decidida com o usuário nesta entrega, não
uma divergência silenciosa:

- **Unidade — minutos ou perguntas, nunca XP: seguida, e estendida.** `RS-01` já pedia "minutos
  ou sessões, nunca só em XP, para não premiar o farm". Esta implementação vai além do texto
  literal: em vez de escolher UMA das duas unidades, usa as DUAS ao mesmo tempo com **OU** — a
  meta bate assim que qualquer uma das duas atinge o alvo do nível. Motivo: perguntas certas e
  minutos estudados são correlacionados neste app (responder mais perguntas naturalmente significa
  mais tempo estudando) — diferente de mover/exercitar/ficar em pé do Apple Watch, que são
  comportamentos genuinamente independentes. Exigir as duas ao mesmo tempo (E) dobraria a exigência
  sem nenhum sinal novo real; permitir qualquer uma delas (OU) dá liberdade genuína (uma sessão
  rápida de Modo Infinito bate por perguntas; uma sessão mais lenta e cuidadosa bate por minutos)
  sem inventar uma fórmula de peso arbitrária entre as duas métricas.
- **Streak dependendo da meta inteira — deliberadamente NÃO seguido.** `RS-02` original queria "a
  sequência conta dias de meta cumprida", isto é, só avançar o streak quando o usuário batesse a
  meta escolhida inteira. Isso reabriria a decisão da v1.9 deste documento (§5.1: streak avança em
  **qualquer** resposta certa, não mais ao completar uma lição inteira) — que já foi suavizada
  justamente porque a exigência mais rígida "confundiu em teste ao vivo em device real". Amarrar o
  streak a uma meta ainda maior (até 25 perguntas ou 35min no nível Intensa) seria uma exigência
  **mais** rígida que a que acabou de ser corrigida, contra o próprio princípio de "piso mínimo
  genuinamente alcançável" que motivou a v1.9. O streak continua exatamente como está: `RS-02` não
  foi implementado como escrito.

**Presets** (`internal/gamification/dailygoal.go`, catálogo completo só no código — mesma decisão
de não duplicar catálogo já tomada pra Awards/Personal Records, §12):

| Nível | Perguntas certas | Minutos | Observação |
|---|---|---|---|
| `leve` | 3 | 5 | Piso mínimo — alcançável mesmo em dia ruim |
| `regular` | 10 | 12 | Default da coluna — igual ao comportamento fixo de antes da v1.30 (API Spec) |
| `consistente` | 15 | 20 | |
| `intensa` | 25 | 35 | |

Calibração inicial, não telemetria real — mesma ressalva que a fonte original recomenda (revisitar
com dados de conclusão depois de estar no ar).

**Tempo de estudo — instrumentação nova.** Diferente de perguntas certas (`chest_questions_today`,
já existia desde o Baú Diário original), minutos estudados não tinha nenhum rastro persistido —
`study_seconds_today`/`study_seconds_today_date` (migrations/0022) somam o `time_ms` já enviado em
toda resposta de exercício (lição e Modo Infinito), **certa ou errada** — tempo estudando não
depende de acertar, diferente do contador de perguntas, que só soma acerto (regra própria do Baú
Diário desde a v1.20). `ClampAnswerStudyMs` capa a contribuição de uma única resposta em 5min —
proteção contra o mesmo tipo de gaming trivial que os Personal Records já tratam (§12): um
`time_ms` isolado e absurdo (ex.: app aberto numa pergunta por horas sem interação real) não pode
sozinho bater uma meta de minutos. Reset preguiçoso por igualdade de data local, mesmo padrão sem
job/cron de `xp_today`/`chest_questions_today` (§3.2/§8.1).

## 15. Moeda e Loja — Livro-Razão, Pacotes de Gemas e Double or Nothing *(v1.12, 22/08/2026)*

Terceira mecânica do porte de gamificação inspirada no Duolingo aplicada nesta fase (mesmo precedente
de §12/§13), sobre um sistema de gemas/loja que já existia e funcionava (`user_gamification.gems`,
`shop_items`, `purchases`, cosméticos com inventário). Três peças novas, `migrations/0023`:

**15.1 Livro-razão (`gem_transactions`, `internal/gamification/gemledger.go`).** Antes desta versão,
`gems` era só um saldo corrente — nenhum histórico auditável de compra, conquista, baú ou recompensa de
bug report. `RecordGemTransaction(ctx, db, userID, delta, reason, referenceID, balanceAfter)` grava uma
linha append-only (`delta` positivo = crédito, negativo = débito; `balanceAfter` é o saldo já resultante
— a função nunca recalcula saldo, só registra o que quem chama já decidiu). Aceita tanto `*pgxpool.Pool`
quanto `pgx.Tx` (interface mínima local `gemLedgerExecer`), pra poder rodar dentro de uma transação já
aberta sem precisar de uma segunda conexão. Best-effort do ponto de vista de quem chama (mesmo padrão de
`RecordEvent`/`EvaluateAndUnlock`) — uma falha aqui não deve derrubar uma ação que já concedeu/debitou
gemas de verdade, mas devolve o erro em vez de engolir silenciosamente.

Retrofitado nos **5 pontos que já mexiam em `gems` antes desta versão**, não só nos 3 novos — um extrato
que omitisse silenciosamente movimentações antigas seria enganoso, não só incompleto:
`handleShopPurchase` (débito, `shop_purchase`), `AwardGems` (crédito, `bug_report_reward`),
`EvaluateAndUnlock` (crédito, `achievement`), `handleOpenDailyChest`/`handleOpenWeeklyChest` (crédito,
`daily_chest`/`weekly_chest`) — mais os 3 novos desta versão (`gem_coupon`, `bet_stake`, `bet_payout`,
§15.2/§15.3). `GET /v1/gamification/gem-transactions` (API Specification §8) expõe o extrato paginado,
só leitura, mais recente primeiro.

**15.2 Pacotes de gemas — mockup funcional, mesmo padrão do VIP (§9).** `GET
/v1/gamification/gem-packages` lista o catálogo (`gem_packages`, sempre real). `POST
.../gem-packages/{id}/checkout` é um endpoint real e documentado, travado atrás de
`GemPackagePurchasesEnabled = false` (501 até um gateway de pagamento existir — mesmo gatilho de
graduação do VIP), com um cupom gerado por admin (`POST .../gem-coupons`, reaproveita `gerarCodigoCupom`
de `vip.go`) como caminho 100% funcional hoje: `POST .../gem-coupons/redeem` credita `gems_amount`
direto, sem `VIPGemsMultiplier` — um pacote pago credita exatamente o que foi pago, não é "ganho" sujeito
ao bônus VIP.

Catálogo inicial (calibrado contra o único preço real em produção, VIP R$29,90/mês — valor por gema
melhora nos pacotes maiores, decisão de produto a revisitar com dados reais depois de estar no ar):

| Pacote | Gemas | Preço | R$/100 gemas |
|---|---|---|---|
| Terracota | 300 | R$ 4,90 | R$ 1,63 |
| Bronze | 800 | R$ 11,90 | R$ 1,49 |
| Mármore | 2.000 | R$ 24,90 | R$ 1,25 |
| Ouro | 5.000 | R$ 49,90 | R$ 1,00 |

**Reconciliação com `RE-05`/`RE-06`** (`Docs/ignorar/Duolingo/REGRAS-gamificacao.md`) — discutida e
decidida com o usuário nesta entrega, não uma divergência silenciosa: `RE-05` ("a moeda compra
conveniência e cosmético apenas, proibido vender conteúdo/XP/avanço") é seguida à risca — pacotes de
gemas nunca vendem progresso, só o meio de troca já sujeito às mesmas regras de gasto de sempre.
`RE-06` ("sem conversão para dinheiro, economia fechada") **não** é seguida à letra — mas o precedente já
tinha sido aberto pelo VIP (assinatura paga real, mesmo documento não previa) antes desta entrega; pacotes
de gemas só reproduzem o mesmo padrão já aceito, documentado aqui como decisão consciente.

**15.3 Double or Nothing (`gem_bets`, `internal/gamification/gembets.go`).** Aposta gemas, compromete-se
a manter o streak por `GemBetDaysRequired` dias (fixo em 7 — simplificação deliberada do parâmetro
genérico do documento original, mesmo espírito de "Regular" ser o preset central da Meta Diária, §13),
dobra ou perde. `POST /v1/gamification/bets` (mínimo `GemBetMinStake` = 50 gemas, no máximo 1 aposta
`active` por usuário — checado no handler E por índice único parcial no banco, `gem_bets_one_active_per_user_idx`)
debita e grava `bet_stake`. Sem estorno em caso de perda — mesma regra do pseudocódigo original.

Resolvida nos **3 pontos onde o streak já é lido/expirado hoje** (mesma duplicação já documentada em
§5.3 pra streak em si) — não introduz um sinal novo, só observa o que o streak já decide:
`internal/learning/answers.go`, `internal/learning/infinitemode.go` (streak avança) e
`LoadStreakWithExpiration` em `gamification.go` (streak expira, só pode sinalizar perda — este call site
nunca chama `AtualizarStreak`). A regra de negócio real é pura e testada isoladamente
(`ResolveBetProgress`, `gembets_test.go`):

```
ResolveBetProgress(daysCompleted, daysRequired, streakAdvanced, streakReset):
    se streakReset:
        retorna (daysCompleted, 'lost')          # perde sempre tem prioridade, sem estorno
    se streakAdvanced:
        daysCompleted += 1
        se daysCompleted >= daysRequired:
            retorna (daysCompleted, 'won')        # paga stake*2, RecordGemTransaction bet_payout
    retorna (daysCompleted, 'active')
```

`streakAdvanced` e `streakReset` nunca vêm `true` juntos na prática (ramos mutuamente exclusivos da
mesma requisição), mas `streakReset` tem prioridade se algum dia vierem — perder a sequência sempre
encerra a aposta.

## 16. Glossário

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
