# Porte de gamificação — ArqLearn × Anatomia do Duolingo

**Status: Fases 0–3 concluídas. Aguardando aprovação antes de qualquer implementação.**

Este documento segue `Docs/ignorar/Duolingo/PROMPT-porte.md`, sob o contrato de `Docs/ignorar/Duolingo/REGRAS-gamificacao.md` (regras citadas como `RX-N`), comparando com o documento de referência `Docs/ignorar/Duolingo/Anatomia do Duolingo.md` (seções citadas como `§N`). Nenhum código foi escrito nesta rodada — é o que a Fase 3 do prompt exige.

## Contexto do produto (preenchido pelo inventário, não pelo usuário)

| Campo | Valor inferido | Fonte |
|---|---|---|
| App | ArqLearn | repo |
| Público | Estudantes de graduação em arquitetura e urbanismo | `Docs/` (referências a NBR 9050, `DocsFaculdade`, README) |
| Estado atual | Além de MVP — já tem VIP, ligas com bots, idempotência testada em produção, correções de bug ao vivo | inventário abaixo |
| O que já existe de gamificação | Muito: XP, streak, vidas, gemas/loja, ligas com bots, baús, 44 conquistas, VIP | inventário abaixo |
| Restrição de esforço | **Não declarada — pergunta aberta, ver final** | — |

---

# Fase 0 — Inventário do que já existe

Tabela completa produzida por varredura do repositório (backend Go em `services/monolith` e `services/ai-content-pipeline`, frontends em `apps/mobile` e `apps/web`, schema em `services/monolith/migrations`).

| # | Entidade/sistema | Onde vive | O que já faz | Gaps |
|---|---|---|---|---|
| 1 | Usuário | `migrations/0001_init.up.sql` (`users`), `internal/users` | Auth via Supabase; perfil com `role`, `timezone`, soft-delete LGPD, export de dados | Sem idade/data de nascimento, sem flag de menor, sem avatar real (só iniciais) |
| 2 | Conteúdo | MongoDB `tracks/units embutidos/lessons/questions`, `internal/learning` | Hierarquia de **2 níveis efetivos**: trilha → lição (unit é array embutido sem entidade própria) | Sem "curso" nem "seção" como conceitos distintos de trilha |
| 3 | Tipos de item | `internal/questiongen`, coleção `questions` | **Um único tipo: `multiple_choice`**, gabarito único, 4 alternativas | Zero itens divergentes; zero listening/speaking/matching/drag |
| 4 | Sessão de prática | Mongo `practice_sessions` | 1 sessão = 1 lição, fila de perguntas aprovadas, TTL 30min, idempotência por resposta | Sem revisão SRS acionável, sem retomar sessão expirada |
| 5 | Progresso | Mongo `user_progress` | Status por lição + `srs_state` (SM-2 simplificado) calculado | Sem gate real de sequência (backend não bloqueia pular lição) |
| 6 | XP | `internal/gamification/algorithms.go` | Base por dificuldade (10/20/30/40) + bônus combo (até +5) + 1ª conclusão (+10), VIP ×1.25, teto diário 500 (1000 VIP), XP Boost ×2 por 15min via baú (21/08/2026) | Sem diferenciação convergente/divergente (não existe ainda a própria classificação) |
| 7 | Meta diária | Só frontend, `DAILY_GOAL_XP = 50` hardcoded | Comparação visual na Home | **Não existe no backend** — sem coluna, sem endpoint, sem efeito em streak |
| 8 | Streak | `algorithms.go` (`AtualizarStreak`), `cmd/notify-streak-risk` | Expiração preguiçosa, freeze automático se disponível, aviso proativo | Sem pausa programada, sem streak compartilhada |
| 9 | Vidas | `hearts_current` (0–5) | Regenera 1/36min (VIP 0.3×), decresce **só em erro** (já é o modelo "Corações", não "Energia") | Nenhum — já compatível com RX-02 |
| 10 | Gemas/Loja | `user_gamification.gems`, `shop_items` | 5 itens: recarga de vidas 350, freeze 200, 3 cosméticos | Cosméticos comprados não têm inventário/equipar |
| 11 | Ligas | `gamification.go`, `cmd/close-league-week`, `cmd/seed-league-bots`, `cmd/simulate-bot-activity` | 10 ligas × 3 divisões = 30 tiers; top-3 sobe/bottom-3 desce; ranking por XP semanal puro; **200 bots sintéticos** oscilando -50/+50 XP/dia, indistinguíveis de humanos na UI | Sem ponderação por qualidade; bots ocultos do usuário; merge de grupos pequenos não implementado |
| 12 | Quests/Baús/Conquistas | `algorithms.go`, `achievements.go` | Baú diário (10 acertos/dia) e semanal (50 acertos/ciclo de 7d); 44 conquistas (9 únicas + 7×5 níveis) | **Sem quests/tarefas diárias rotativas** — só gate fixo de contagem |
| 13 | Cronometrado/Maestria | — | — | **Não existe** |
| 14 | Hub de prática | Modo Infinito (`infinitemode.go`) + SRS calculado | Prática livre sem tocar vidas/streak; gera conteúdo sob demanda | SRS (`next_review_at`) calculado mas **nunca consumido** por endpoint/tela |
| 15 | Conteúdo narrativo/IA conversacional | `materials.go`, `explain.go` | Resumo de material, chat texto sobre upload, "Explique Melhor" (já gratuito, adiantado ao Duolingo!) | Sem histórias/roleplay/áudio/video call |
| 16 | Social | — | — | **Não existe nada**: sem seguir, amigos, feed, kudos |
| 17 | Notificações | `internal/notifications`, `expoclient` | Infra real (push token, preferências); único gatilho ativo: risco de streak | Sem gatilho de liga, baú, tarefa — infra pronta, produto não usa |
| 18 | Monetização | `vip.go`, migration 0011 | Cupom VIP funcional; assinatura recorrente R$29,90/mês retorna **501 hardcoded** | Sem gateway de pagamento; nenhum conteúdo é paywalled hoje (VIP é só bônus) |
| 19 | Configurações | `configuracoes.tsx` | Tema, notificações, trilha ativa, exclusão de conta com fricção acessível | Sem toggle explícito para desligar sequência/ligas (gap de RG-08) |
| 20 | Acessibilidade | ~35 arquivos mobile, ~31 web | Leitor de tela, `useReduceMotion`, alternativas a gestos incompatíveis com TalkBack, testes documentados em device | Sem CI de acessibilidade automatizado |
| 21 | Eventos/telemetria | Tabela `gamification_events` (schema morto) | **Zero `INSERT`, zero consumidor** em todo o código | **Bloqueio crítico** — confirmado como pede o prompt de porte |
| 22 | Idempotência | `answer_submissions`, `purchases.idempotency_key` | Robusta, com histórico de bugs reais corrigidos em produção | Ponto forte, sem gap |
| — | **Classificação convergente/divergente** | — | **Não existe em nenhuma linha de código** — só no documento `Ateliê Gamificado.md`, ainda não incorporado | Gap central de todo o porte |

**Achado que muda o enquadramento do porte:** isto não é greenfield. XP, streak, vidas, ligas, baús e conquistas já estão em produção com vocabulário do Duolingo original, idempotência real e até um bug de UX real corrigido (heart regen reset injusto, 19/08/2026). O porte é majoritariamente **rename + ajuste de regra + preencher gaps de conteúdo divergente**, não construção do zero. A única peça 100% ausente que é pré-requisito estrutural de tudo é a camada de eventos (item 21) e a classificação convergente/divergente (item —).

---

# Fase 1 — Tradução de domínio

## Proporção convergente/divergente atual

**0% divergente, 100% convergente.** O único tipo de item existente (`multiple_choice`) tem gabarito único. Por `RA-02`, a partir do ciclo "Partido" a trilha precisa de ≥30% de itens divergentes ou fica bloqueada para publicação — hoje toda trilha existente falharia esse critério, porque o próprio conceito de item divergente ainda não existe no schema. **Isto confirma o alerta do prompt: "o app está virando quiz"** — e vai continuar sendo quiz até a Fase 3 do backlog (Ateliê/Entrega) introduzir os tipos divergentes do `RD-07`.

## Mapeamento primitiva → primitiva

Uso a tabela `RD-01` como ponto de partida, não como resposta pronta — conforme meu inventário, o schema atual já usa parte deste vocabulário nativamente (não Duolingo, já em português de domínio), então cada linha diz também **o que muda em relação ao que já existe hoje**, não só em relação ao Duolingo.

| Duolingo (§ref) | RD-01 propõe | Já existe hoje como | Decisão | Por quê |
|---|---|---|---|---|
| Curso §4.2 | Trilha | `track` (Mongo) | **Manter "Trilha"** | Já é o nome real no código — sem custo de rename |
| Seção (CEFR) §4.3 | Ciclo | Não existe | **Adotar "Ciclo"**, mas como campo novo em `track`, não como entidade separada | RD-02 já define os 6 ciclos; hoje `track.topic` não carrega noção de maturidade |
| Unidade §4.5 | Módulo | `unit` embutido em `track.units[]` | **Renomear para "Módulo" e promover a entidade própria** | Hoje é um array sem identidade forte; virar entidade facilita Caderno (RD-01) e checkpoint |
| Lição §4.1/6 | Sessão | `lesson` (Mongo) **e** `practice_sessions` (o ato de responder) | **Divergência da RD-01: manter "Lição" para o conteúdo, manter "Sessão" só para o ato de responder** | Colisão de nomes: RD-01 renomeia Lição→Sessão, mas o código já usa "sessão" para outra coisa (a tentativa de resposta). Seguir a RD-01 literalmente criaria duas entidades chamadas "Sessão". Ver decisão de baixa confiança #1 abaixo. |
| Exercício §7 | Item | `question` | **Manter "Item"/"Pergunta" conforme já usado**, com campo novo `categoria: convergente\|divergente` | RA-01 exige o campo obrigatório; hoje não existe nenhum campo de classificação |
| Guidebook §4.5 | Caderno | Não existe | **Adotar "Caderno"** | Nenhum equivalente hoje; RX-06 exige material de apoio acessível |
| Caminho §5 | Percurso | Ordenação implícita em `track.units[].order` | **Adotar "Percurso"** como o nome da estrutura, sem mudar a implementação de ordenação | — |
| XP | XP | `xp_total`/`xp_today` | **Manter "XP"** | Já correto, RD-01 concorda |
| Gems §12 | Traços | `gems` | **Renomear para "Traços"** | — |
| Corações/Energia §11 | Grafite | `hearts_current` | **Renomear para "Grafite"**, mantendo a mecânica atual quase intacta | Ver Fase 2 item Vidas — já é modelo "pune erro", já compatível com RX-02 |
| Ofensiva §10 | Sequência | `streak_current` | **Renomear para "Sequência"** | — |
| Ligas §13 | Bancadas | `leagues`/`league_members` | **Renomear para "Bancadas"**, com mudança de regra de pontuação (Fase 2) | RC-03 exige XP ponderado, hoje é XP puro |
| Lendário §15.4 | Entrega | Não existe | **Adotar "Entrega"** | Termo de arquitetura real (entrega de projeto/crítica) — tradução funcional forte, não literal |
| Practice Hub §16 | Ateliê | Modo Infinito | **Renomear/expandir Modo Infinito para "Ateliê"** | Já é funcionalmente 80% do papel — falta consumir a fila SRS e aceitar itens divergentes |
| Stories §17.1 | Visita | Não existe | **Adotar "Visita"** — mas ver decisão de baixa confiança #2 (não tem fase declarada em RG-05) | |
| DuoRadio §17.2 | Repertório | Não existe | **Adotar "Repertório"** — mesma ressalva | RD-04 |
| Roleplay/Video Call §17.4/17.5 | Banca | Não existe | **Adotar "Banca"** | RG-05 Fase 4 já a agenda explicitamente |
| Explique minha resposta §17.6 | *(RD-01 não cobre este item — omissão do documento de regras)* | **"Explique Melhor" já implementado e gratuito** | **Manter como está, sem rename** | Já está à frente do próprio Duolingo (que só liberou em 01/01/2026); não há necessidade de portar, só de reconhecer que já está pronto |
| Quests diárias §14.1 | Tarefas do dia | Não existe | **Adotar "Tarefas do dia"** | |
| Friends Quest §14.2 | Dupla de ateliê | Não existe | **Adotar "Dupla de ateliê"** | |
| Baús §14.4 | Caixas | Sistema de baú diário/semanal já existe | **Renomear para "Caixas"** | |
| Conquistas §14.5 | Selos | `achievements` (44 níveis já implementados) | **Renomear para "Selos"** | |
| Match Madness §15.1 | Prancheta | Não existe | **Adotar o nome, mas sem fase declarada** — ver decisão #2 | RD-01 define o nome mas RG-05 não agenda este sistema em nenhuma das 4 fases |
| Duolingo Score §4.4 | IMP | Não existe | **Adotar "IMP" (Índice de Maturidade Projetual)** | Substitui `nível` calculado por `sqrt(xp/100)` hoje — ver decisão de baixa confiança #3 |

---

# Fase 2 — Gap analysis

| Sistema | § doc ref | Já existe? | Vale portar? | Justificativa | Risco no domínio |
|---|---|---|---|---|---|
| Camada de eventos | §8.7/19 | Não (schema morto) | **portar** | RT-01/RT-02: bloqueio de tudo o mais | Baixo risco técnico, alto risco de atraso se pulado |
| XP | §9 | Sim, robusto | **portar adaptado** | RE-01/RE-02 exigem taxa diferenciada por camada; hoje só existe convergente | Sem o eixo divergente, XP fica preso no vocabulário antigo mesmo depois do rename |
| Meta diária | §9.3 | Parcial (só UI) | **portar adaptado** | RS-01: precisa existir no servidor, em minutos/sessões | Baixo |
| Sequência | §10 | Sim, robusto | **portar adaptado** | RS-04 pausa programada e RS-07 compartilhada não existem | Médio — pausa programada é divergência deliberada, sem equivalente para copiar |
| Vidas → Grafite | §11 | Sim, e já correto | **portar** (rename só) | Já pune erro, não uso — RX-02/RE-08 já satisfeitas | Baixo — só decidir se muda os parâmetros numéricos (ver decisão #4) |
| Moeda/Loja → Traços | §12 | Sim | **portar adaptado** | RE-05/RE-06 já respeitadas; falta inventário/equipar cosmético | Baixo |
| Ligas → Bancadas | §13 | Sim, com bots ocultos | **portar adaptado, com correção estrutural** | RC-03 exige ponderação por proporção divergente; hoje é XP puro + bots sintéticos indistinguíveis de humanos | **Alto — ver seção de risco de métrica perversa abaixo** |
| Quests → Tarefas do dia | §14.1 | Não | **portar adaptado** | RG-05 Fase 2 | Baixo |
| Baús → Caixas | §14.4 | Sim, robusto | **portar** (rename + RE-04: nunca aplicar boost a item divergente) | | Baixo |
| Conquistas → Selos | §14.5 | Sim, robusto (44 níveis) | **portar** (rename) | | Baixo |
| Cronometrado → Prancheta | §15.1–15.3 | Não | **avaliar depois / não escopar agora** | Não consta em nenhuma das 4 fases da RG-05; risco de reforçar velocidade sobre qualidade (tensão com RX-03) | Médio se implementado sem cuidado |
| Lendário → Entrega | §15.4 | Não | **portar adaptado** | RG-05 Fase 3; boa tradução funcional para camada divergente | Baixo (tradução), médio (esforço de construção) |
| Practice Hub → Ateliê | §16 | Parcial (Modo Infinito) | **portar adaptado** | RG-05 Fase 3; falta expor fila SRS e aceitar itens divergentes | Baixo |
| Repetição espaçada | §8.2 | Calculada, não consumida | **portar adaptado (completar)** | RA-08: só se aplica à camada convergente — já é o caso hoje, sem mudança de escopo | Baixo |
| Stories → Visita / DuoRadio → Repertório | §17.1/17.2 | Não | **substituir por equivalente funcional, mas sem fase declarada** | RD-04 já propõe o substituto (feed de precedentes); RX-04 proíbe linearizar | Baixo risco técnico, mas gap de planejamento (RG-05 não agenda) |
| Roleplay/Video Call → Banca | §17.4/17.5 | Não | **portar adaptado** | RG-05 Fase 4; maior esforço de construção do backlog inteiro (IA avaliadora + rubrica + persona crítica) | Alto esforço, risco médio (RA-06 exige que a IA não premie estilo) |
| Explique minha resposta | §17.6 | **Sim, já pronto** | **manter como está** | Já superou o próprio Duolingo neste ponto | Nenhum |
| Sistema social | §18 | Não | **portar adaptado** | RG-05 Fase 4; RC-05/RC-07 devem reger desde o design, não depois | Médio — fácil de vazar métrica no feed se não for desenhado com RC-05 desde o início |
| Notificações | §19 | Parcial (infra pronta, 1 gatilho) | **portar adaptado** | RG-05 Fase 2; RX-05 tom, limite de 2/dia | Baixo |
| Monetização/Assinatura | §20 | Parcial (cupom sim, recorrente stub) | **portar adaptado** | Não consta nas 4 fases da RG-05 (é transversal); RX-10 já parcialmente respeitada | Baixo hoje, porque nada é paywalled — risco surge só quando a assinatura recorrente for ligada |
| Configurações | §21 | Parcial | **portar adaptado** | RG-08 exige porta de saída para sequência/bancada/notificações/metas — hoje falta pelo menos o toggle de sequência e bancada | Baixo |
| Acessibilidade | §21.6 | Já avançada (mobile) | **manter e formalizar como gate (RT-08)** | Não é "sistema" a portar — é critério de aceite para todos os outros | Baixo |
| Classificação convergente/divergente | (regra própria, não do Duolingo) | Não | **portar — é pré-requisito, não opcional** | RA-01; sem isso, RE-01/RE-02 (que já dependem dela na Fase 1 "XP") não fecham | **Ver decisão de baixa confiança #5 — tensão de ordenação de fases** |

---

# Fase 3 — Backlog faseado

Cada spec segue as 10 seções pedidas pelo prompt. Onde um sistema já existe amplamente, a spec foca no **delta** (o que muda), não reconstrói o que já funciona.

## FASE 1 — Fundação

### 1.1 Eventos e telemetria

1. **Nome e propósito** — Camada de eventos versionados; resolve "não dá pra medir se qualquer outro sistema funciona" (RT-01).
2. **Modelo de dados** — Reativar `gamification_events` (já existe no schema, migration 0001): `id, user_id, event_type, value, metadata jsonb, created_at`. Automatizar criação de partição mensal (hoje só existe a partição do mês corrente — vira bug de produção em 01/09/2026 se não for resolvido antes).
3. **Regras e fórmulas** — Nenhuma fórmula; é infraestrutura pura.
4. **Máquina de estados** — N/A (append-only).
5. **Eventos emitidos** — Os 9 mínimos da RT-02: `sessao_iniciada`, `sessao_concluida`, `sessao_abandonada`, `item_respondido`, `item_divergente_avaliado`, `xp_creditado`, `meta_atingida`, `grafite_consumido`, `grafite_esgotado`. Payload versionado (`schema_version` no `metadata`).
6. **Superfície de UI** — Nenhuma tela nova; painel interno de verificação (pode ser uma query, não precisa de tela).
7. **Feature flag** — `ff_eventos_telemetria`. Desligada: nenhum evento é gravado, todo o resto do sistema continua funcionando exatamente como hoje (é aditivo, não reescreve nada existente).
8. **Critérios de aceite** — Dado um item respondido, quando a resposta é processada, então um evento `item_respondido` é gravado com `user_id`, `question_id`, `correct`, `answer_time_ms` em até 1s. Dado o mês vira, quando a partição do mês seguinte não existe, então a gravação não falha silenciosamente (alerta ou criação automática).
9. **Verificação de anti-padrão** — Nenhuma regra RX é tocada diretamente; mas RT-04 (idempotência de XP/Traços/Sequência/Selos) passa a ser **auditável** só depois que isto existir.
10. **Métrica de sucesso** — Nº de eventos/dia > 0 e crescendo com uso real; métrica de guarda: nenhuma rota existente aumenta de latência p95 em mais de 20ms por causa do INSERT de evento.

### 1.2 Sessão (delta sobre o que já existe)

1. **Nome e propósito** — Já existe como `practice_sessions`. Objetivo do porte: reconciliar nomenclatura sem quebrar o conceito.
2. **Modelo de dados** — Nenhuma mudança de schema necessária no ato de responder. Mudança de nome de exibição do conteúdo: manter `lesson`/"Lição" (ver decisão #1), não renomear para "Sessão" como a RD-01 sugere literalmente.
3. **Regras e fórmulas** — Sem mudança na TTL de 30min nem no bloqueio por Grafite zerado.
4. **Máquina de estados** — Sem mudança: iniciada → respondendo → concluída/expirada/abandonada. Adicionar evento por transição (depende de 1.1).
5. **Eventos emitidos** — `sessao_iniciada`, `sessao_concluida`, `sessao_abandonada` (novo — hoje sessão expirada não emite nada).
6. **Superfície de UI** — Nenhuma mudança visual obrigatória.
7. **Feature flag** — Não precisa; é rename/instrumentação sobre sistema já em produção.
8. **Critérios de aceite** — Dado que uma sessão expira sem resposta final, quando o TTL vence, então um evento `sessao_abandonada` é emitido (hoje não acontece).
9. **Verificação de anti-padrão** — RX-06: garantir que o material de apoio (Caderno) continue acessível durante a sessão — hoje não existe Caderno, então este item fica pendente até a Fase que introduzir Caderno explicitamente (fora do escopo desta spec, é gap de conteúdo, não de sistema).
10. **Métrica de sucesso** — Cobertura de eventos de ciclo de vida de sessão chega a 100% dos casos (hoje só "iniciada" e "concluída via resposta" existem implicitamente).

### 1.3 XP

1. **Nome e propósito** — Já existe e funciona. Objetivo: introduzir o eixo convergente/divergente sem quebrar a fórmula atual.
2. **Modelo de dados** — Novo campo `questions.categoria` (`convergente`|`divergente`, RA-01, obrigatório, sem default). Nova tabela `xp_ledger` (opcional, mas recomendada para RT-04 auditável) ou reaproveitar `gamification_events` com `event_type=xp_creditado`.
3. **Regras e fórmulas** — Manter base por dificuldade (10/20/30/40) + bônus de 1ª conclusão (+10). **Decisão confirmada 20/08/2026: substituir o bônus de velocidade (+5 por resposta rápida) por bônus de combo** — +1 a +5 XP pelo maior número de acertos consecutivos na sessão (igual §9.5 do Duolingo), não mais por tempo de resposta. Motivo: bônus de velocidade cria incentivo a responder rápido em item que exige raciocínio cuidadoso (norma, dimensionamento) — combo recompensa não errar ao longo da sessão inteira, não pressa. Adicionar linha RE-01 para item divergente: **25 XP** por item concluído com justificativa; **40 XP** por Banca concluída. RE-02: garantir razão 1,8×–2,5× XP/min divergente vs. convergente — tratar 25/40 como piso a validar com telemetria real antes de travar (pergunta 9). RE-03: teto de XP decrescente até zerar na 4ª repetição no mesmo dia — **não existe hoje**, precisa ser adicionado mesmo para o convergente já existente.
4. **Máquina de estados** — N/A.
5. **Eventos emitidos** — `xp_creditado` com `categoria`, `valor`, `motivo`.
6. **Superfície de UI** — Toda tela que mostra XP precisa também mostrar proporção divergente/IMP (RX-03) — impacto em Home mobile/web (`DailyGoalCard`), perfil, resumo de sessão.
7. **Feature flag** — `ff_xp_categoria_divergente`. Desligada: comportamento atual idêntico (só convergente, sem teto de repetição).
8. **Critérios de aceite** — Dado uma sessão com 8 acertos consecutivos seguidos de 1 erro, quando a sessão termina, então o bônus de combo usa o **máximo** de 8 (não o valor no momento do erro — igual §9.5, combo zera no erro mas o bônus é sobre o pico da sessão). Dado um item classificado como divergente concluído com justificativa, quando avaliado, então credita 25 XP sem bônus de combo (RE-04, não a tabela de dificuldade convergente). Dado a mesma lição refeita 4 vezes no mesmo dia, quando a 4ª tentativa é concluída, então credita 0 XP.
9. **Verificação de anti-padrão** — RX-03: nenhuma tela pode mostrar XP "pelado" sem uma medida de qualidade ao lado — auditar todas as telas atuais que hoje mostram XP sozinho (Home, perfil). Verificar também que o combo não reintroduz pressa por outra via (ex.: usuário evitar item difícil pra não quebrar o combo) — se aparecer em telemetria, é o mesmo problema com nome novo.
10. **Métrica de sucesso** — Razão XP/min divergente ÷ convergente fica entre 1,8 e 2,5 (métrica de guarda: se cair abaixo de 1,8, o incentivo está invertido e precisa ajuste imediato).

### 1.4 Meta diária

1. **Nome e propósito** — Hoje só existe no cliente; objetivo é dar substrato real no servidor para a Sequência depender dela (RS-01).
2. **Modelo de dados** — `users.meta_diaria_minutos` (int, default 20) ou `sessoes` (equivalente). RS-01: contar em minutos ou sessões, nunca só em XP.
3. **Regras e fórmulas** — 4 presets: **10 · 20 · 30 · 45 minutos** (RS-01).
4. **Máquina de estados** — `não_atingida` → `atingida` (1x/dia, reset à meia-noite local + tolerância de 4h da RS-02, compartilhada com Sequência).
5. **Eventos emitidos** — `meta_atingida` (já na lista mínima da RT-02).
6. **Superfície de UI** — Seletor de meta em Configurações (novo); `DailyGoalCard` passa a ler valor real em vez de constante `DAILY_GOAL_XP=50`.
7. **Feature flag** — `ff_meta_diaria_configuravel`. Desligada: mantém constante 50 XP hardcoded como hoje.
8. **Critérios de aceite** — Dado que o usuário muda a meta para 45min, quando estuda 30min no dia, então a meta não é marcada como atingida.
9. **Verificação de anti-padrão** — RX-03 indiretamente: meta não pode ser só em XP (checado no desenho, não é risco de código).
10. **Métrica de sucesso** — % de usuários que ajustam a meta ao menos uma vez (sinal de que o controle é percebido como real, não decorativo).

### 1.5 Progresso no percurso

1. **Nome e propósito** — Já existe por lição; objetivo é dar suporte a Módulo (novo nível de hierarquia) e Ciclo.
2. **Modelo de dados** — Promover `unit` de array embutido para coleção própria `modulos` com `id, track_id, ciclo, ordem`. Adicionar `track.ciclos_atendidos` (RD-02, lista dos 6 ciclos que a trilha cobre).
3. **Regras e fórmulas** — Sem fórmula nova; é modelagem.
4. **Máquina de estados** — Sem mudança nos estados de lição (`not_started/in_progress/completed`).
5. **Eventos emitidos** — Nenhum novo obrigatório aqui além dos já listados.
6. **Superfície de UI** — Tela de percurso passa a agrupar por Módulo, não só listar lições soltas.
7. **Feature flag** — `ff_modulo_entidade`. Desligada: comportamento atual (unit embutido) preservado.
8. **Critérios de aceite** — Dado que uma trilha declara ciclos `[Partido, Anteprojeto]`, quando exibida no percurso, então só módulos desses ciclos aparecem.
9. **Verificação de anti-padrão** — RX-04: Módulos de fundamentos técnicos podem ser sequenciais; Repertório/Visita (fora desta fase) não podem herdar esse bloqueio por engano.
10. **Métrica de sucesso** — Nenhuma trilha existente quebra ao migrar `unit` embutido → `modulos` (teste de migração sem perda de dado).

## FASE 2 — Retorno

### 2.1 Sequência e proteções

1. **Nome e propósito** — Já existe e é robusto; objetivo é adicionar RS-04 (pausa programada) e RS-07 (compartilhada), as duas peças que não existem.
2. **Modelo de dados** — Nova tabela `sequencia_pausas` (`user_id, data_inicio, data_fim, criada_em`). Nova tabela `sequencia_grupos` (até 4 colegas) se compartilhada entrar nesta fase.
3. **Regras e fórmulas** — RS-04: até **14 dias/ano** de pausa programada, sem custo, declarada com antecedência. RS-07: cutucada limitada a **1 por pessoa por dia**.
4. **Máquina de estados** — Sequência ganha novo estado `pausada` (não conta como quebrada nem como cumprida durante o intervalo declarado).
5. **Eventos emitidos** — `sequencia_pausa_agendada`, `sequencia_pausa_iniciada`, `sequencia_pausa_encerrada`.
6. **Superfície de UI** — Novo fluxo em Configurações/Sequência: "agendar pausa"; calendário de sequência passa a marcar dias pausados visualmente distintos de congelados.
7. **Feature flag** — `ff_sequencia_pausa_programada`. Desligada: sequência se comporta exatamente como hoje (só freeze manual/automático).
8. **Critérios de aceite** — Dado que o usuário agenda pausa de 5 dias, quando os 5 dias passam sem estudar, então a sequência não zera e nenhum freeze é consumido. Dado que o usuário já usou 14 dias de pausa no ano, quando tenta agendar mais, então o sistema recusa.
9. **Verificação de anti-padrão** — RX-01: pausa programada é gratuita por design — não pode nunca virar item de loja (se alguém propuser vender "pausa extra", viola RX-01/RS-04 e deve ser rejeitado).
10. **Métrica de sucesso** — Redução de zeragem de sequência longa (>30 dias) atribuível a período de entrega acadêmica (medir via evento de pausa vs. sequência quebrada sem pausa, comparando cohortes).

### 2.2 Tarefas do dia

1. **Nome e propósito** — Não existe hoje; resolve "prolongar a sessão" com variedade além do gate fixo de contagem de acertos.
2. **Modelo de dados** — Nova tabela `tarefas_diarias` (`user_id, data, tarefa_1..3, progresso, concluida`), pool de definições de tarefa em configuração versionada (RT-03).
3. **Regras e fórmulas** — 3 tarefas/dia sorteadas de um pool. Progressão de recompensa: 1ª → caixa bronze, 2ª → prata, 3ª → ouro; completar as 3 → caixa extra (espelha §14.1, sem custo de tradução — já é genérico o suficiente).
4. **Máquina de estados** — `pendente` → `em_progresso` → `concluída`, reset diário 00h local + tolerância RS-02.
5. **Eventos emitidos** — `tarefa_diaria_sorteada`, `tarefa_diaria_progredida`, `tarefa_diaria_concluida`.
6. **Superfície de UI** — Nova aba/seção "Tarefas do dia" (mobile/web, paridade obrigatória).
7. **Feature flag** — `ff_tarefas_diarias`. Desligada: tela não aparece, nenhum dado órfão (RG-04).
8. **Critérios de aceite** — Dado que o usuário completa as 3 tarefas do dia, quando a 3ª é concluída, então a caixa extra é creditada exatamente uma vez (idempotência RT-04).
9. **Verificação de anti-padrão** — RX-03: tarefas não podem ser só "ganhe N XP" puro — pelo menos 1 das 3 deve envolver qualidade (ex.: "complete um item divergente"), senão vira mais um caminho de farm de XP.
10. **Métrica de sucesso** — % de dias com pelo menos 1 tarefa concluída (proxy de retorno diário) sobe em relação à baseline sem tarefas.

### 2.3 Caixas (rename + regra nova)

1. **Nome e propósito** — Sistema de baú diário/semanal já existe e funciona bem; objetivo é rename + RE-04 (boost nunca em item divergente).
2. **Modelo de dados** — Nenhuma mudança estrutural; só rótulo de exibição.
3. **Regras e fórmulas** — Manter os gates atuais (10 acertos/dia, 50/ciclo de 7 dias) e as proporções de sorteio (75/25 diário, 60/40 semanal, pool de item agora dividido em 3 — freeze/recarga/boost — desde 21/08/2026, ver adendo). Adicionar regra: XP Boost obtido em caixa **nunca se aplica** a item divergente (RE-04) — **o boost já existe** (implementado 21/08/2026), mas item divergente continua não existindo (Fase 3), então RE-04 continua **não-aplicável na prática** (nada ainda pra excluir) — não confundir "boost existe" com "RE-04 implementada".
4. **Máquina de estados** — Sem mudança.
5. **Eventos emitidos** — `caixa_aberta` (novo, hoje não instrumentado).
6. **Superfície de UI** — Rename de "Baú" para "Caixa" em todas as telas (paridade mobile/web).
7. **Feature flag** — Não precisa; é rename sobre sistema já em produção — mudança de string, não de comportamento.
8. **Critérios de aceite** — Dado 10 respostas certas no dia, quando a 10ª é registrada, então a Caixa Diária fica disponível (comportamento já existente, só re-testar sob o novo nome).
9. **Verificação de anti-padrão** — RE-04 (checagem futura, não aplicável hoje — boost já existe desde 21/08/2026, mas item divergente pra excluir dele ainda não).
10. **Métrica de sucesso** — Sem regressão na taxa de abertura de caixa após o rename (teste A/B de nome, se necessário).

### 2.4 Notificações

1. **Nome e propósito** — Infra pronta, quase sem gatilho; objetivo é ligar mais gatilhos de produto respeitando RX-05.
2. **Modelo de dados** — Sem mudança de schema (`notifications` já existe); adicionar `notification_type` novos ao enum existente.
3. **Regras e fórmulas** — Máximo **2 notificações/dia** por usuário (RX-05); respeitar horário declarado.
4. **Máquina de estados** — N/A.
5. **Eventos emitidos** — `notificacao_disparada` com `tipo`.
6. **Superfície de UI** — Nenhuma tela nova obrigatória; extensão do painel de preferências já existente para incluir novos tipos (bancada, caixa, tarefa).
7. **Feature flag** — Por gatilho: `ff_notif_bancada`, `ff_notif_caixa_disponivel`, `ff_notif_tarefa_diaria`.
8. **Critérios de aceite** — Dado que 2 notificações já foram enviadas hoje, quando um 3º gatilho dispara, então a notificação é descartada ou adiada, nunca enviada.
9. **Verificação de anti-padrão** — RX-05: nenhuma copy pode usar culpa/ameaça — checklist de revisão de texto antes de qualquer notificação nova ir ao ar.
10. **Métrica de sucesso** — Taxa de opt-out de notificações não aumenta após novos gatilhos (métrica de guarda — se subir, o tom está errado).

## FASE 3 — Profundidade

### 3.1 Ateliê (prática dirigida)

1. **Nome e propósito** — Expandir Modo Infinito para consumir a fila SRS e aceitar itens divergentes; resolve "aprender de verdade" via prática dirigida.
2. **Modelo de dados** — Novo endpoint que lê `user_progress` com `srs_state.next_review_at <= now()` para montar fila de revisão — o campo já existe e é calculado, só nunca foi consumido.
3. **Regras e fórmulas** — RA-08: SRS só se aplica à camada convergente (já é o caso hoje, sem mudança).
4. **Máquina de estados** — Sem mudança na sessão do Modo Infinito; nova origem de pergunta ("fila de revisão vencida" vs. "pool aleatório do tópico" atual).
5. **Eventos emitidos** — `ateliê_revisao_iniciada`, `ateliê_revisao_item_respondido`.
6. **Superfície de UI** — Novo cartão "Revisar agora" — o comentário já existente no `DailyGoalCard.tsx` web ("Revisar Erros — sem tela própria ainda") vira este item.
7. **Feature flag** — `ff_ateliê_fila_revisao`. Desligada: Modo Infinito continua exatamente como hoje.
8. **Critérios de aceite** — Dado um item com `next_review_at` vencido, quando o usuário abre "Revisar agora", então esse item aparece na fila antes de qualquer item novo aleatório.
9. **Verificação de anti-padrão** — Nenhuma direta; é uma feature aditiva sobre sistema já compatível com RA-08.
10. **Métrica de sucesso** — % de itens vencidos revisados dentro de 48h da data prevista sobe em relação à baseline (hoje é 0%, porque não há fila).

### 3.2 Repetição espaçada (fechamento formal)

1. **Nome e propósito** — Já calculada (SM-2 simplificado); objetivo é só garantir que 3.1 a consome corretamente — spec quase idêntica à 3.1, tratada separada porque RG-05 lista como sistema próprio.
2. **Modelo de dados** — Sem mudança adicional além da já descrita em 3.1.
3. **Regras e fórmulas** — Confirmar que a fórmula atual (`ease_factor` 2.5 inicial, ajuste por qualidade 0–5) continua só para convergente (RA-08).
4. **Máquina de estados** — Sem mudança.
5. **Eventos emitidos** — `srs_item_agendado` (novo — hoje o agendamento acontece sem evento).
6. **Superfície de UI** — Coberta por 3.1.
7. **Feature flag** — Compartilha `ff_ateliê_fila_revisao`.
8. **Critérios de aceite** — Dado uma resposta certa e rápida em item convergente, quando processada, então `interval_days` aumenta conforme a fórmula SM-2 (comportamento já existente — só adicionar teste automatizado, que hoje aparentemente não valida isso ponta a ponta).
9. **Verificação de anti-padrão** — RA-08 (já respeitada).
10. **Métrica de sucesso** — Mesma de 3.1 (são o mesmo entregável em duas linhas do backlog original).

### 3.3 Entrega (maestria)

1. **Nome e propósito** — Não existe; camada de maestria para conteúdo divergente já concluído, sem apoios — "entrega" no sentido literal de arquitetura (submissão final de estúdio).
2. **Modelo de dados** — Nova tabela `entregas` (`user_id, modulo_id, itens_divergentes[], justificativas[], avaliacao_ia, status, criada_em`).
3. **Regras e fórmulas** — RE-01: **40 XP** por Entrega concluída. RA-03: resultado em 4 categorias (consistente/defensável com ressalva/frágil/incoerente), nunca "certo/errado".
4. **Máquina de estados** — `disponível` (módulo divergente concluído) → `em_elaboração` → `avaliada` → `contestada` (opcional, RA-07) → `fechada`.
5. **Eventos emitidos** — `entrega_iniciada`, `entrega_avaliada`, `entrega_contestada`.
6. **Superfície de UI** — Nova tela "Entrega" com rubrica visível **antes** de começar (RA-04).
7. **Feature flag** — `ff_entrega_maestria`. Desligada: módulos divergentes concluídos simplesmente não oferecem a camada extra — sem quebra.
8. **Critérios de aceite** — Dado um módulo com itens divergentes todos concluídos, quando o usuário abre Entrega, então vê a rubrica antes de submeter (RA-04) e recebe feedback com pelo menos 1 precedente real ao final (RA-05).
9. **Verificação de anti-padrão** — RX-07: rubrica e precedentes usados aqui precisam de autor humano nominal, não gerados livremente por IA em escala.
10. **Métrica de sucesso** — Nº de Entregas com resultado "consistente" ou "defensável com ressalva" sobe ao longo do tempo por usuário (sinal de aprendizado real, não де XP).

### 3.4 Selos (rename + extensão)

1. **Nome e propósito** — 44 conquistas já implementadas e funcionando; objetivo é rename + eventualmente família nova ligada a divergente/Entrega.
2. **Modelo de dados** — Sem mudança na tabela `achievements`; adicionar novas linhas de definição (ex.: família "entregas_consistentes", 5 níveis).
3. **Regras e fórmulas** — Manter tabela de recompensa atual (XP 20/40/80/150/300, Traços 5/8/15/25/50) para as famílias novas.
4. **Máquina de estados** — Sem mudança (`EvaluateAndUnlock` já cobre o padrão).
5. **Eventos emitidos** — `selo_desbloqueado` (rename de conquista, se já emitido; senão, novo).
6. **Superfície de UI** — Rename "Conquistas" → "Selos" em todas as telas.
7. **Feature flag** — Não precisa para o rename; `ff_selos_divergente` só para as famílias novas.
8. **Critérios de aceite** — Sem mudança de comportamento no rename — só string. Família nova: dado 5 Entregas consistentes, quando a 5ª é avaliada, então o Selo de nível correspondente desbloqueia.
9. **Verificação de anti-padrão** — RX-09: nenhum Selo pode recompensar estilo arquitetônico específico — auditar nomes/critérios das famílias novas antes de publicar.
10. **Métrica de sucesso** — Sem regressão na taxa de desbloqueio após o rename.

## FASE 4 — Social e competição

### 4.1 Bancadas (Ligas — correção estrutural, não só rename)

1. **Nome e propósito** — Já existe e funciona tecnicamente, mas com dois problemas de design que as regras proíbem: ranking por XP puro (RC-03) e bots com pegada desproporcional na pontuação. Resolve "voltar amanhã" via competição — mas só se a competição não recompensar o farm errado nem ser decidida por simulação.
2. **Modelo de dados** — Nova coluna `league_members.xp_ponderado_semana` (calculado a partir de `xp_this_week` × fator de proporção divergente da semana). `leagues.min_group_size_for_promotion` (hoje fixo em 6 no código) passa a ser o gate real para *criar* bots — ver item 3.
3. **Regras e fórmulas** — **Decisão confirmada 20/08/2026: reduzir a pegada dos bots, não removê-los nem só rotulá-los.** Concretamente: (a) `cmd/seed-league-bots` só povoa um grupo até o `minGroupSizeForPromotion` (6 membros) quando ele está genuinamente abaixo disso — hoje povoa 20 bots por liga independentemente da densidade real; (b) `cmd/simulate-bot-activity` reduz o teto de variação diária de ±50 XP para um valor bem menor (proposta inicial: **±15 XP/dia**, a calibrar), suficiente para simular atividade sem competir de verdade por posição de pódio; (c) bot nunca ocupa posição de **promoção** (top-3) — só preenche o meio da tabela, para que subir de Bancada continue sendo mérito de humano. RC-02 (manter os parâmetros atuais do ArqLearn — 3 sobem/3 descem, grupos de 30 — pendente de confirmação, pergunta 10). RC-03: pontuação = `xp_semana × (1 + proporção_divergente_semana)`, fórmula exata a calibrar com dado real antes de travar em config versionada (RT-03).
4. **Máquina de estados** — Sem mudança na máquina de fechamento semanal (`CloseLeagueWeek` já é idempotente); nova regra de exclusão de bot do top-3 entra no cálculo de promoção.
5. **Eventos emitidos** — `bancada_fechada`, `bancada_promovido`, `bancada_rebaixado` (hoje o fechamento não emite eventos).
6. **Superfície de UI** — Ranking passa a mostrar XP ponderado, não XP bruto. Sem exigência de rotular bot na UI nesta versão (a decisão do usuário foi reduzir a pegada, não expor) — reavaliar se RC-04 exige rótulo explícito mais adiante.
7. **Feature flag** — `ff_bancada_ranking_ponderado` e `ff_bancada_bots_reduzidos`, independentes.
8. **Critérios de aceite** — Dado dois usuários com o mesmo XP bruto na semana, quando um tem maior proporção de itens divergentes, então ele fica em posição melhor no ranking. Dado um grupo com 25 membros humanos (acima do mínimo de 6), quando os bots são semeados, então nenhum bot é criado para esse grupo. Dado um bot em qualquer grupo, quando o fechamento semanal roda, então ele nunca ocupa uma das 3 vagas de promoção.
9. **Verificação de anti-padrão** — Ainda é o item de maior risco de métrica perversa do backlog (RC-03/RC-04) mesmo após a redução — a mitigação reduz a distorção, não a elimina; revisar de novo quando a base real de usuários crescer o suficiente para talvez dispensar bots.
10. **Métrica de sucesso** — Correlação entre posição na Bancada e proporção divergente sobe (hoje é ~0, porque pontuação é XP puro); % de vagas de promoção ocupadas por bot cai a zero (hoje pode ser >0); métrica de guarda: engajamento semanal com Bancada não cai mais que X% após reduzir a pegada dos bots.

### 4.2 Dupla de ateliê

1. **Nome e propósito** — Não existe; equivalente a Friends Quest, meta cooperativa semanal.
2. **Modelo de dados** — Nova tabela `duplas_ateliê` (`user_id_1, user_id_2, semana, progresso_conjunto, meta, concluida`).
3. **Regras e fórmulas** — Espelha §14.2: emparelhamento semanal, meta cooperativa, recompensa ao concluir (Caixa + XP Boost — mas boost nunca em item divergente, RE-04).
4. **Máquina de estados** — `formada` → `em_progresso` → `concluída`/`expirada` (fim de semana sem meta batida).
5. **Eventos emitidos** — `dupla_formada`, `dupla_progredida`, `dupla_concluida`.
6. **Superfície de UI** — Depende de 4.3 (Perfil e seguidores) existir minimamente para escolher/ser pareado com colega.
7. **Feature flag** — `ff_dupla_ateliê`.
8. **Critérios de aceite** — Dado que a dupla atinge a meta conjunta, quando o último progresso é registrado, então ambos recebem a recompensa exatamente uma vez cada (RT-04).
9. **Verificação de anti-padrão** — RC-05: o que aparece sobre a dupla no feed é produção, não XP acumulado.
10. **Métrica de sucesso** — % de duplas que completam a meta semanal (proxy de valor da mecânica cooperativa).

### 4.3 Perfil e seguidores

1. **Nome e propósito** — Não existe nada; resolve alavanca de retenção social (Duolingo cita 5,6× mais chance de terminar o curso com amigos, §18).
2. **Modelo de dados** — Nova tabela `seguidores` (`seguidor_id, seguido_id, criado_em`, modelo assimétrico). `users.perfil_publico` (bool, default **false** — RC-07).
3. **Regras e fórmulas** — Menor de idade não pode tornar perfil público nem aparecer em Bancada (RC-07) — cruza com o gap de idade/menor já identificado no inventário (item 1), que **precisa ser resolvido antes** desta feature (dependência não declarada explicitamente em RG-05, mas real).
4. **Máquina de estados** — Solicitação de seguir (se perfil privado): `pendente` → `aceita`/`recusada`.
5. **Eventos emitidos** — `usuario_seguido`, `perfil_visibilidade_alterada`.
6. **Superfície de UI** — Nova aba de perfil público, busca de usuário, feed (RC-05: produção, não métrica).
7. **Feature flag** — `ff_perfil_seguidores`.
8. **Critérios de aceite** — Dado um usuário menor de idade, quando tenta tornar o perfil público, então o sistema recusa (RC-07). Dado um perfil privado, quando outro usuário solicita seguir, então fica pendente até aceite.
9. **Verificação de anti-padrão** — RC-05 (feed sem métrica bruta) e RC-07 (privado por padrão) — checar ambos antes de liberar.
10. **Métrica de sucesso** — % de usuários que seguem ao menos 1 colega em 30 dias; correlação com retenção (replicar o dado que o Duolingo cita, adaptado ao domínio).

### 4.4 Banca com IA

1. **Nome e propósito** — Maior esforço de construção do backlog inteiro; substitui Roleplay/Video Call por defesa de partido diante de crítico de IA.
2. **Modelo de dados** — Nova tabela `bancas` (`user_id, entrega_id, transcricao, avaliacao, criada_em`) — trabalho do usuário é conteúdo dele (RT-06: exportável, apagável, consentimento separado se usado para treinar modelo).
3. **Regras e fórmulas** — RE-01: **40 XP** por Banca concluída. RA-06: IA avalia argumento (coerência, uso de repertório, atendimento a restrições), nunca estilo.
4. **Máquina de estados** — `disponível` (após Entrega avaliada) → `em_andamento` → `concluída` → `avaliada`.
5. **Eventos emitidos** — `banca_iniciada`, `banca_concluida`, `banca_avaliada`.
6. **Superfície de UI** — Interface de chat (texto primeiro, áudio depois se viável) com persona crítica — reaproveita parcialmente a infra de "Chat sobre Material" já existente (`materials.go`) como base técnica.
7. **Feature flag** — `ff_banca_ia`. Desligada: Entrega (3.3) continua funcionando sem a etapa de defesa.
8. **Critérios de aceite** — Dado uma Banca concluída, quando avaliada, então a IA retorna avaliação sobre argumento (não sobre "gosto"), auditável por amostragem humana.
9. **Verificação de anti-padrão** — **RC-08: proibido exibir desempenho em Banca em ranking público ou feed** — checar que 4.1 e 4.3 nunca vazam isso. RA-06 diretamente (prompt do avaliador precisa proibir explicitamente juízo estético).
10. **Métrica de sucesso** — Taxa de contestação de avaliação de Banca (RA-07) dentro de faixa saudável — nem 0% (sinal de rubrica não confiável) nem alta demais (sinal de avaliador mal calibrado).

---

# Ao terminar a Fase 3

## 1. As três decisões de tradução de domínio em que tenho menos confiança

1. **Lição vs. Sessão (colisão de nomes).** A `RD-01` renomeia "Lição" (Duolingo) para "Sessão", mas o código já usa "sessão" (`practice_sessions`) para o ato de responder — uma entidade diferente. Propus manter "Lição" para o conteúdo e reservar "Sessão" só para a tentativa de resposta, divergindo da tabela literal da regra. É a decisão que mais reescreveria a UI existente se eu tiver escolhido errado — e é exatamente o tipo de escolha que `RD-01` explicitamente autoriza revisar na Fase 1, então prefiro que você confirme antes de eu tratar como fechada.
2. **"Visita"/"Repertório" (Stories/DuoRadio) e "Prancheta" (Match Madness) não têm fase declarada em `RG-05`.** A `RD-01` define o vocabulário, mas a tabela de fases não os agenda em nenhuma das 4 fases. Não sei se isso é omissão do documento de regras ou decisão deliberada de deixá-los fora do escopo do porte. Tratei como "vale portar, mas sem fase" — o que na prática significa que não vão ser implementados a menos que você diga explicitamente onde entram.
3. **IMP (substituto do "nível" atual calculado por `sqrt(xp/100)`).** A regra `RD-01` prevê um "Índice de Maturidade Projetual" 0–100 análogo ao Duolingo Score (§4.4), mas não há nenhuma regra `RE`/`RA` dizendo como ele é calculado a partir de proporção divergente, taxa de acerto e histórico — ao contrário do XP, do Grafite e da Sequência, que têm fórmulas explícitas em `RE-01`/`RE-09`. Não tenho base para propor uma fórmula sem inventar premissa silenciosa (proibido pelo formato do prompt), então o IMP fica como conceito nomeado, sem spec de cálculo, até você definir os insumos.

## 2. O sistema de maior risco de virar métrica perversa

**Bancadas (Ligas), item 4.1 — e já é perverso hoje, não é um risco futuro.**

O ranking pontua por XP semanal puro, e o próprio sistema **já injeta 200 bots sintéticos** que oscilam ±50 XP/dia sem qualquer relação com atividade pedagógica real (`cmd/simulate-bot-activity`, commits de hoje), promovendo e rebaixando ao lado de humanos, sem qualquer sinal na UI de que são bots. Isso não é uma hipótese de risco — é o estado atual em produção.

Isso colide com duas regras de precedência máxima ao mesmo tempo:
- **RC-03**: "o ranking da Bancada não pode ser puro XP" — hoje é puro XP.
- **RC-04**: bot e automação entram na spec da Bancada desde o início, não depois — hoje bot é o próprio *mecanismo de design*, não uma ameaça a detectar.

A `Anatomia do Duolingo` (§13.5, §25.4) documenta bots em ligas como **queixa recorrente e crônica da comunidade** do modelo original — o ArqLearn recriou deliberadamente o problema que o documento de referência cita como defeito, para resolver um problema real (baixa densidade de usuários). É uma tensão genuína entre "produto precisa parecer vivo com poucos usuários" e "não minta sobre com quem o usuário está competindo". Não decidi por você qual lado pesa mais — isso é produto, não engenharia — mas marquei como **alto risco** e a spec 4.1 propõe o mínimo defensável (ponderar por qualidade + tornar bots visíveis), não a remoção dos bots.

## 3. O que recomendo cortar do escopo (atualizado com a restrição de esforço confirmada)

Com "só o usuário, nas horas vagas" confirmado, a recomendação vira concreta em vez de condicional: **cortar tudo de Fase 2, 3 e 4 do horizonte imediato**, não porque não vale a pena, mas porque tentar tudo ao mesmo tempo com essa capacidade é a receita pra nada sair do lugar (viola `RG-03` na prática, mesmo respeitando a letra). O corte recai justamente sobre **3.3 Entrega** e **4.4 Banca com IA** — os dois itens que exigem motor de avaliação do zero — exatamente como a análise original antecipava antes de saber a restrição real. Ver "Escopo revisado" acima para o roteiro concreto de curto prazo.

## Todas as perguntas — status final

| # | Pergunta | Status |
|---|---|---|
| 1 | Restrição de esforço | **Respondida** — solo, horas vagas |
| 2 | Quem corrige o divergente no dia 1 | **Respondida** — IA com amostragem humana |
| 3 | De onde vem o Repertório/Visita | **Parqueada** — sem fase declarada, não bloqueia nada agora |
| 4 | Qual norma é a base (RX-08) | **Parqueada** — só importa em escala de produção de conteúdo |
| 5 | Vínculo institucional | **Respondida** — não existe, uso individual |
| 6 | Razão-alvo RE-02 (calibrar com números reais ou travar 25/40) | **Recomendação mantida sem objeção**: tratar como piso a validar com telemetria (depende de 1.1) |
| 7 | Parâmetros de Bancada (3/3 vs. 7/5) | **Respondida** — manter os atuais do ArqLearn |
| 8 | Lição vs. Sessão | **Respondida** — manter divergência proposta |
| 9 | Visita/Repertório/Prancheta sem fase declarada | **Recomendação mantida sem objeção**: fora de escopo por ora |
| 10 | Fórmula do IMP | **Parqueada** — depende de sistemas de Fase 3 inexistentes |
| 11 | Prioridade do conserto de cosméticos | **Respondida** — sim, entra primeiro, antes da Fase 1 |
| 12 | Bots nas Bancadas | **Respondida** — reduzir a pegada, não remover nem só rotular |
| 13 | Regeneração do Grafite | **Respondida** — manter 36min |
| 14 | Bônus de XP: combo vs. velocidade | **Respondida** — trocar por combo |

---

## Decisões já confirmadas pelo usuário (20/08/2026)

| Decisão | Resposta |
|---|---|
| Bots nas Bancadas | **Reduzir a pegada dos bots** — teto de XP/dia mais baixo por bot e preenchimento só de grupos genuinamente vazios (corrigir `minGroupSizeForPromotion`), sem removê-los nem só rotulá-los como estão. Spec 4.1 atualizada abaixo. |
| Regeneração do Grafite | **Manter 36 minutos**, como já está em produção — sem mudança de spec. |
| Bônus de XP (combo vs. velocidade) | **Substituir bônus de velocidade por bônus de combo** (acertos consecutivos na sessão, +1 a +5, igual §9.5). Spec 1.3 atualizada abaixo. |
| Restrição de esforço | **Só o usuário, nas horas vagas, ao lado de outras coisas.** Muda a priorização de todo o backlog — ver seção "Escopo revisado" abaixo. |
| Quem corrige o item divergente no dia 1 | **IA com amostragem humana.** |
| Vínculo institucional (turma/professor) | **Não existe e não está nos planos — uso individual/aberto.** Simplifica a Fase 4: Bancada continua sendo grupo aleatório de 30, sem recorte por turma. |
| Parâmetros da Bancada (3/3 vs. 7/5 do Duolingo) | **Manter os parâmetros atuais do ArqLearn** (top-3 sobe, bottom-3 desce, grupos de 30). |
| Lição vs. Sessão | **Confirmado**: manter "Lição" pro conteúdo, "Sessão" só pro ato de responder — RD-01 não é seguida à letra aqui. |
| Cosméticos sem inventário/equipar | **Confirmado como primeiro ajuste prático**, antes até da Fase 1 do backlog maior — ver "Escopo revisado". |

## Escopo revisado depois da restrição de esforço

Com a capacidade real declarada (uma pessoa, horas vagas), o backlog de 16 specs em 4 fases **não é realista como plano de curto prazo** — é o mapa completo, não o roteiro imediato. Revisão de prioridade:

1. ~~**Agora, antes de qualquer coisa do backlog faseado:** consertar o gap de cosméticos~~ — **entregue** (PR #142, `feat/inventario-cosmeticos-loja`): `user_cosmetics` (migration 0015), posse exposta em `GET /v1/gamification/me` e `GET /v1/users/me`, moldura dourada + selo no perfil, "Adquirido" na Loja. Tablet Noturno ficou de fora (segundo tema de app inteiro é decisão maior).
2. ~~**Curto prazo (Fase 1, e só uma peça de cada vez, RG-03):** 1.1 Eventos e telemetria~~ — **entregue** (PR #143, `feat/eventos-telemetria`): partições de set/out/nov 2026 criadas (migration 0016, urgente — a partição de agosto era a única que existia), `cmd/ensure-event-partitions` + cron mensal garantindo isso daqui pra frente, `gamification.RecordEvent`/`EventsEnabled` (mesmo padrão de `VIPSubscriptionsEnabled`) emitindo `sessao_iniciada`, `sessao_concluida`, `sessao_abandonada`, `item_respondido`, `xp_creditado`, `grafite_consumido`, `grafite_esgotado` — em lição normal e Modo Infinito. `item_divergente_avaliado` e `meta_atingida` ficam de fora por ora: não existe item divergente nem meta diária configurável no backend ainda.
3. ~~**Próximo:** 1.3 XP (delta do combo)~~ — **entregue** (PR #144, `feat/xp-combo-sequencia`): bônus de velocidade substituído por bônus de combo (`min(combo_maximo, 5)`, concedido uma única vez na última pergunta da sessão) — `CalcularXP`, `practice_sessions.combo_atual/combo_maximo`, TDD §3.0.1 (novo) e Database Design sincronizados. Modo Infinito perde o bônus (sem "última pergunta", já é farm-friendly por natureza).

**Escopo revisado concluído — as 4 PRs (#141 doc, #142 cosméticos, #143 eventos, #144 XP combo) estão abertas, aguardando revisão e merge do usuário** (merge de PR é ação bloqueada pelo classificador do Auto Mode nesta sessão — só criar PR foi possível). Todas com `go build`/`go vet`/`go test` passando; web com `next build` completo; mobile com `tsc --noEmit` limpo. Migrations `0015` e `0016` precisam ser aplicadas manualmente no deploy (`migrate ... up`), como de costume neste projeto. Próximo passo real depois do merge dessas 4: nada do backlog faseado maior (Fases 2–4) — aguardar a Fase 1 estar em produção e medida antes de decidir o que vem a seguir, por RG-05.
3. **Adiado deliberadamente, não descartado:** 1.2 (Sessão), 1.4 (Meta diária) e 1.5 (Progresso) ficam depois — são maiores e menos urgentes que instrumentar o que já existe.
4. **Fase 2, 3 e 4 inteiras ficam fora do horizonte de planejamento por ora.** Em especial, **Entrega (3.3)** e **Banca com IA (4.4)** — os dois itens que exigem construir motor de avaliação do zero — só voltam a fazer sentido tentar depois que a Fase 1 estiver em produção e medida (RG-05), o que, no ritmo de horas vagas, é questão de meses, não semanas.

## Perguntas que ficam propositalmente sem resposta agora

Dado o escopo revisado, estas três perguntas da rodada anterior (origem do Repertório/Visita, base normativa para citação de norma, fórmula do IMP) **não bloqueiam nada do que é realista fazer no curto prazo** — Repertório/Visita não tem fase declarada, IMP depende de sistemas de Fase 3 que não existem ainda, e a base normativa só importa quando houver produção de conteúdo em escala. Ficam parqueadas; retomo quando a fase correspondente se aproximar de virar trabalho real, em vez de pedir decisão sobre algo que ainda não vai ser construído.

---

# Comparação aprofundada — sistemas que já existem, ponto a ponto contra o Duolingo

O pedido foi explícito: não ignorar o que já existe, entender de verdade, e achar onde o Duolingo resolve algo **melhor** do que o ArqLearn resolve hoje (ou pior — as duas direções importam).

| Sistema ArqLearn | O que o Duolingo faz (§ref) | O que o ArqLearn faz hoje | Veredito |
|---|---|---|---|
| XP — bônus dentro da sessão | **Combo**: bônus (+1 a +5) pelo **maior número de acertos consecutivos** na sessão inteira (§9.5) — prêmio por não errar ao longo de toda a sessão | **Velocidade**: bônus fixo de +5 XP por responder rápido (abaixo de um limiar de 5–17s conforme dificuldade) | **Duolingo resolve melhor.** Bônus de velocidade, num domínio onde a resposta certa exige ler enunciado normativo, avaliar cota ou comparar solução, tem risco pedagógico real: recompensa clicar rápido, não pensar direito. Combo recompensa consistência, não pressa. Isto é uma descoberta nova, não estava no backlog original. |
| Streak — proteções escalonadas | Teto de congelamentos equipáveis sobe de 2 para **até 5** depois de marcos de streak alta (§10.3) | **Implementado em 21/08/2026** (`RS-03`, `CapDeFreezes`, TDD §5.5) — 2 normal, 5 acima de `streak_best >= 100`, aplicado a cada compra/recompensa de baú. Ver adendo abaixo. | **Fechado.** |
| Vidas — o que pune | Duolingo **abandonou** o modelo "pune erro" (Corações) por "pune uso" (Energia) — e isso é a mudança mais rejeitada da história do produto (§11.4, §25.5) | ArqLearn já pune só o erro (nunca o uso) | **ArqLearn já está à frente do Duolingo atual**, não atrás. Não portar Energia é o comportamento correto — a regra `RX-02` já protege isso. |
| Vidas — velocidade de regeneração | Corações regeneram ~1 a cada 4–6h (§11.2) | Grafite regenera 1 a cada **36 minutos** — 6 a 10× mais rápido | **Sem veredito único** — é trade-off de produto, não bug. Mais generoso reduz atrito e frustração (bom para retenção em domínio difícil), mas também reduz o valor percebido de assinar VIP e enfraquece "vidas" como restrição real. Marcado como pergunta em aberto abaixo (a referência "decisão #4" que ficou solta no corpo do documento original é exatamente esta). |
| Gemas/Loja — cosméticos | Efeitos de perfil comprados **aparecem e funcionam** visivelmente (§12.3, §18.1) | Cosméticos comprados ficam registrados em `purchases`, mas **não existe inventário nem "equipar"** — o item comprado não aparece em lugar nenhum | **Duolingo resolve melhor.** É um gap real, já estava listado na Fase 0, mas vale reforçar: hoje gastar gema em cosmético no ArqLearn não tem retorno visual nenhum — isso é pior que decorativo, é dinheiro/esforço do usuário sem recompensa perceptível. |
| Ligas — leaderboard de amigos | Aba separada, só com quem você segue, paralela à liga de 30 aleatórios (§13.4, adicionada em 2025) | Não existe (depende do sistema social, que também não existe) | **Duolingo resolve melhor**, mas é dependência natural da Fase 4 (Perfil e seguidores) — não é gap isolado, é sequência correta. |
| Ligas — bots | Bots/contas automatizadas em ligas altas são **queixa recorrente da comunidade**, tratados como problema a mitigar (§13.5, §25.4) — o Duolingo não admite publicamente que injeta bots de propósito | ArqLearn **cria deliberadamente 200 bots** que oscilam XP artificialmente e o usuário não tem como saber que está competindo com eles | **ArqLearn está pior que o próprio Duolingo neste ponto.** O Duolingo trata bot como falha externa; o ArqLearn tornou isso um mecanismo de primeira classe, sem transparência. Este é o achado mais sério de toda a comparação — ver pergunta 1 abaixo. |
| VIP — paywall contextual | Oferta de assinatura aparece exatamente no momento de atrito: vidas zeradas, sequência perdida, tentativa de Entrega (§20.4) | Existe tela de recarga quando vidas zeram (oferece esperar/anúncio/gemas/praticar/assinar), mas não há confirmação de que **todo** ponto de atrito (sequência perdida, por ex.) já dispara oferta equivalente | Parcialmente replicado; não é gap crítico, é polimento a verificar quando a Fase 2 (Sequência) for implementada. |
| Explique minha resposta | Ficou gratuito só em 01/01/2026, depois de ser exclusivo de assinantes por anos (§17.6) | **Já é gratuito desde o início** (`explain.go`) | **ArqLearn já está à frente do Duolingo** — nenhuma ação necessária, só reconhecer o ponto forte. |

**Resumo do achado principal:** dos sistemas já existentes, o ArqLearn está **à frente** do Duolingo em Vidas (pune erro, não uso) e em Explique Minha Resposta (já gratuito). Está **atrás** em cosméticos com efeito visível e leaderboard de amigos (ambos gaps já mapeados). E está **pior que o próprio Duolingo** — não só "atrás", mas reproduzindo um problema que o Duolingo trata como defeito — na transparência dos bots de liga. O achado de combo-vs-velocidade no XP é novo e muda a spec 1.3 da Fase 1.

---

# Decisões pendentes — todas, consolidadas, com recomendação

Als 3 de menor confiança da rodada anterior + a referência solta ("decisão #4") + as 7 perguntas abertas + os 2 achados novos desta comparação. Uma pergunta estruturada foi aberta agora para as 4 de maior impacto (bots, regeneração de Grafite, combo-vs-velocidade, restrição de esforço); as demais estão listadas em texto abaixo com recomendação, aguardando sua resposta.

## Perguntas que ficam para resposta em texto (recomendação já embutida)

5. **Quem corrige o item divergente no dia 1?** — *Recomendo:* IA com amostragem humana (não IA sozinha, não fila 100% humana). Justificativa: fila 100% humana não escala com o esforço declarado como incerto; IA sozinha viola o espírito de `RX-07` (curadoria humana nominal para rubrica/precedente) mesmo que não a letra para a correção em si. Amostragem humana permite calibrar a IA com risco controlado.
6. **De onde vem o Repertório/Visita (feed de precedentes)?** — *Recomendo:* curadoria própria inicial, pequena e nomeada (não acervo licenciado caro nem submissão de usuário sem moderação). Justificativa: `RX-07` já exige autor humano nominal para precedente; começar pequeno e curado evita risco de direito de imagem em escala antes de validar se a feature engaja.
7. **Qual norma é a base (NBR, código municipal, neutro)?** — *Recomendo:* NBR nacional como base única no início, sem recorte municipal. Justificativa: código de obras varia por município e multiplica o custo de manutenção normativa (`RX-08` exige referência verificável) — melhor validar o modelo com uma base única antes de fragmentar por cidade.
8. **Existe vínculo institucional (turma/professor)?** — *Recomendo:* meu inventário não encontrou nenhum indício de modelo de turma/professor no schema atual (`role: student|teacher|admin` existe em `users`, mas sem tabela de turma) — preciso que você confirme se isso é intenção futura, porque muda a Fase 4 inteira (Bancada por turma, professor com permissões) e não é uma decisão que eu deva inferir.
9. **Calibrar RE-02 (razão 1,8×–2,5× XP/min divergente) contra os números reais do ArqLearn ou manter os valores fixos da regra (25/40 XP)?** — *Recomendo:* manter os valores da regra como piso inicial (25/40), mas tratá-los como hipótese a validar com telemetria real (depende de 1.1 Eventos) antes de travar em config versionada definitiva — não travar um número sem dado de uso ainda.
10. **Manter parâmetros atuais de Bancada (3 sobem/3 descem, grupos de 30, mínimo 6 pra promover) ou adotar os do Duolingo (7 sobem/5 descem)?** — *Recomendo:* manter os parâmetros atuais do ArqLearn. Eles já foram calibrados para a densidade real de usuários (daí os bots existirem — sinal de que 30 pessoas por grupo já é otimista); copiar os números do Duolingo sem copiar a escala de usuário dele não faz sentido.
11. **Lição vs. Sessão — confirma a divergência da RD-01 (manter "Lição" pro conteúdo, "Sessão" só pro ato de responder)?** — *Recomendo:* sim, manter como propus — é a opção de menor custo de rename e evita duas entidades com o mesmo nome.
12. **Visita/Repertório/Prancheta sem fase declarada em RG-05 — desconsiderar do escopo por ora ou você quer que eu aloque numa fase?** — *Recomendo:* desconsiderar do escopo enquanto as Fases 1–3 não estiverem prontas — nenhuma delas é pré-requisito de aprendizagem (`RX-04` inclusive proíbe linearizar Repertório), então adiar não bloqueia nada.
13. **Fórmula do IMP (substituto do "nível")** — *Recomendo:* adiar a definição até depois da Fase 3 (Entrega/Banca existirem), porque IMP precisa de proporção divergente e taxa de consistência como insumos, e nenhum dos dois existe ainda para calcular nada real.
14. **Prioridade do sistema de inventário/equipar cosmético (achado novo desta comparação)** — hoje é dinheiro do usuário sem retorno visível. *Recomendo:* pequeno ajuste dentro da Fase 1/2 (não é um "sistema" novo do backlog faseado, é consertar um gap de UX em cima do que já existe) — baixo esforço, alto retorno de percepção de valor da loja.

---

Aguardando sua aprovação (ou correção da tradução de domínio) antes de implementar qualquer sistema. Por `RG-03`, a implementação segue **um sistema por entrega**, na ordem do backlog acima.

---

## Adendo (21/08/2026) — Habilidade adaptativa implementada fora da ordem

Decisão explícita do usuário: implementar dificuldade gradual/adaptativa agora, deliberadamente
fora da ordem estabelecida acima (que dizia esperar a Fase 1 estar em produção e medida antes de
decidir Fase 2+, RG-05) — não é descoberta silenciosa de divergência.

Duas entregas relacionadas, mas distintas:

1. **Habilidade adaptativa por tópico (esta entrega)** — mecanismo **novo**, não estava mapeado em
   nenhuma linha da RD-01/Fase 1-4 acima: um modelo logístico de 1 parâmetro (tipo Rasch/IRT
   simplificado, análogo ao "Birdbrain" do Duolingo) que ajusta a seleção de pergunta do Modo
   Infinito pro ponto Goldilocks pra cada usuário, por tópico. Documentado em
   `Docs/ArqLearn_TDD_Technical_Design_Document.md` §10 e `Docs/ArqLearn_Database_Design.md`
   (`user_topic_skill`, migrations/0017). Também ordena perguntas de sessão de lição e lições
   dentro de uma unidade por dificuldade ascendente (`lesson.difficulty`, existente desde sempre,
   nunca consumido até aqui).
2. **Fila de revisão do SRS ("Revisar agora")** — item "3.1 Ateliê"/"3.2 Repetição Espaçada" acima,
   **entregue** (21/08/2026, entrega separada da habilidade adaptativa): consome
   `srs_state.next_review_at` (já calculado a cada resposta de lição, nunca lido de volta antes
   disso) via `GET /v1/review/summary` + `POST /v1/infinite-mode/sessions` com `review: true`, com
   entrada visível dedicada (`ReviewPromptCard`, "Revisar agora") e rota própria
   (`/revisao/sessao`, `/revisao/resumo`) em vez de misturado silenciosamente no Modo Infinito por
   tópico — fiel ao desenho original acima. Cruza todos os tópicos já praticados (não filtrado por
   tema); sem a camada de habilidade adaptativa (Goldilocks) dentro da fila — o vencimento do SRS
   já é o sinal relevante ali, ver TDD §10.3.

---

## Adendo (21/08/2026) — Bandit de notificação implementado fora da ordem

Decisão explícita do usuário, mesmo precedente do adendo acima: implementar personalização de
notificação agora, deliberadamente fora da ordem da Fase 2 (item "2.4 Notificações" acima, que
ainda não foi aprovada) — não é descoberta silenciosa de divergência.

**Bandit de template (Thompson Sampling, Beta-Bernoulli)** — mecanismo **novo**, não estava
mapeado em nenhum ponto da "2.4 Notificações" original (que só previa mais gatilhos com feature
flag por tipo, não personalização de mensagem): 4 variações de mensagem pro gatilho de streak em
risco competem por um bandit que aprende qual leva a mais prática nas 24h seguintes ao envio.
Documentado em `Docs/ArqLearn_TDD_Technical_Design_Document.md` §11 e
`Docs/ArqLearn_Database_Design.md` (`notification_template_stats`/`notification_sends`,
migrations/0018). `cmd/notify-decide` substitui `cmd/notify-streak-risk` (nunca teve scheduler
automático — confirmado morto na prática) e passa a rodar de hora em hora via GitHub Actions,
implementando de fato a janela horária local que a §5.2 da TDD já pedia desde a v1.1.

**`RX-05` (item 3 e 9 da "2.4 Notificações" original) honrado mesmo com o resto da Fase 2 não
aprovado:** teto de 2 notificações/dia por usuário implementado (contando todos os tipos, não só
via bandit) e as 4 variações de mensagem escritas em tom encorajador, sem culpa/ameaça.

**Fora de escopo, deliberado (não esquecido):** bandit de horário de envio aprendido por usuário
(Send-Time Optimization) — o único gatilho real hoje tem semântica de horário não-personalizável
(perto do fim do dia local, não o horário de estudo preferido do usuário), e o volume de eventos
por usuário (no máximo 1/dia) é baixo demais pra um bandit de horário convergir num tempo razoável
sem uma máquina de estado de "decide agora, dispara depois" desproporcional pro estágio atual. Ver
TDD §11.4 para o raciocínio completo — revisitar quando o volume justificar.

---

## Adendo (21/08/2026) — Teto de freezes e reparo de streak implementados fora da ordem

Decisão explícita do usuário, mesmo precedente dos dois adendos acima: implementar melhorias de
sequência agora, deliberadamente fora da ordem da "2.1 Sequência e proteções" (Fase 2, ainda não
aprovada) — não é descoberta silenciosa de divergência.

**`RS-03` (teto escalonado de freezes)** — a linha da tabela comparativa acima já **documentava**
essa regra como planejada, mas não confirmada como implementada; confirmado nesta entrega que
**não existia nenhum teto** (nem fixo, nem escalonado). Fechado: `CapDeFreezes` (2 normal, 5 acima
de `streak_best >= 100`), aplicado nos três pontos de escrita de `streak_freezes_available` (compra
na loja — rejeita antes de debitar gemas — e recompensa de baú diário/semanal — silenciosamente não
credita além do teto, sem substituir por outra recompensa). Grandfathering deliberado: quem já tinha
mais freezes que o teto atual não é reduzido, só deixa de crescer além dele.

**`RS-08` (reparo de streak, RS-0x novo) — mecânica nova, diferente de `RS-03`:** não havia nenhuma
menção a "reparo"/"restaurar streak" em lugar nenhum deste documento antes desta entrega (só
`RS-04`, pausa programada, estruturalmente diferente — agendada com antecedência, não reativa a uma
perda já ocorrida). Inspirada na pesquisa de grace window do Duolingo, adaptada pro tamanho do
projeto: quando a streak zera sem freeze disponível, o valor perdido fica guardado por 3 dias — a
próxima lição concluída dentro do prazo restaura em vez de reiniciar do zero. Gratuito, automático,
sem endpoint próprio (mesma filosofia lazy de todo o resto do sistema de streak). Documentado em
`Docs/ArqLearn_TDD_Technical_Design_Document.md` §5.5 e `Docs/ArqLearn_Database_Design.md`
(`streak_repair_value`/`streak_repair_deadline`, migrations/0019).

**Fora de escopo, deliberado (não esquecido):** customização de horário de início do dia (o fuso
IANA por usuário já resolve o problema real que essa customização resolveria no Duolingo, ver TDD
§5.1) e Friend Streak/streak social (nenhum subsistema social existe no projeto — corretamente
adiado pra Fase 4 por privacidade/menores, `RC-07`). Mais marcos de conquista de streak (Duolingo
tem mais níveis que os 5 atuais de `streak_dias`) também ficou de fora: `tierXPRewards`/
`tierGemsRewards` (`internal/gamification/achievements.go`) são arrays `[5]int` compartilhados
entre TODAS as famílias de conquista, não só streak — estender uma família só exigiria reestruturar
o sistema de conquistas inteiro, desproporcional a este pedido.

---

## Adendo (21/08/2026) — XP Boost implementado fora da ordem

Decisão explícita do usuário, mesmo precedente dos três adendos acima: implementar o sistema de
XP/nível agora, deliberadamente fora da ordem original (item 6/"XP" acima, Fase 2 ainda não
aprovada) — não é descoberta silenciosa de divergência.

**Achado ao pesquisar**: a maior parte do sistema de XP/nível do Duolingo já tinha equivalente
implementado no ArqLearn sob outro nome — bônus de combo (já entregue na v1.4, item 6 acima),
multiplicador sempre-ativo por assinatura (`VIPXPMultiplier`, item VIP), curva de nível
progressiva/quadrática (`Nivel`), teto diário não-bloqueante (`DailyXPCap`). O único gap genuíno
era um **XP Boost discreto, de curta duração, empilhável** — não existia em nenhuma forma, confirmado
por grep exaustivo.

**XP Boost** — mecânica nova: multiplicador temporário (2x por 15min), concedido como recompensa de
sorteio do Baú Diário/Semanal (pool de item dividido em 3 partes iguais agora — antes era 50/50 só
entre Bloqueio de Ofensiva/Recarga de Vidas). Empilha com um boost já em vigor (soma duração a
partir do fim do atual) e com o multiplicador VIP (multiplicadores combinados num único
arredondamento, TDD §3.3) — sem afetar o teto diário de XP, só a velocidade de ganho. Documentado em
`Docs/ArqLearn_TDD_Technical_Design_Document.md` §3.3 e `Docs/ArqLearn_Database_Design.md`
(`xp_boost_active_until`, migrations/0020).

**RE-04 (linhas 223/225/231/320 acima) — corrigida a premissa, mas NÃO marcada como concluída.** A
regra é especificamente "XP Boost obtido em caixa nunca se aplica a item divergente" — construir o
boost **não** implementa RE-04, porque item divergente continua não existindo (Fase 3, fora de
escopo desta entrega). O texto que dizia "hoje não existe boost no sistema" foi corrigido (o boost
existe desde agora), mas RE-04 em si permanece pendente/não-aplicável — não há ainda nada pra
excluir do boost.

**Fora de escopo, deliberado (não esquecido):** nível por trilha/curso ("crown levels" do Duolingo —
ArqLearn não tem estrutura de conteúdo análoga por skill, nível global já é a decisão correta pro
domínio); modo Legendary/maestria (já nomeado-mas-não-especificado no backlog como "Entrega", Fase
3.3, item 4.4 — depende da classificação de item divergente ainda não construída); evento global de
bônus tipo "Weekend Happy Hour" do Duolingo (nenhuma infraestrutura de agendamento/campanha existe
no projeto — é uma alavanca de marketing sem campanha ativa pra rodar, desproporcional construir
especulativamente nesta fase bootstrap).

**Frontend, mínimo mas real** (diferente do bandit de notificação e do reparo de streak, que
ficaram backend-only): o momento de revelação do baú (`bau/page.tsx` web + `bau.tsx` mobile) já
tinha `REWARD_ICON`/`REWARD_LABEL` genéricos por `reward_type` — adicionar `"xp_boost"` ao tipo
força (erro de compilação TS) preencher as duas entradas, tornando o boost visível no momento de
maior valor ("aproveita agora") sem nenhuma decisão de design nova. Sem badge persistente/contador
regressivo na Home — seria um padrão de UI novo (nenhum estado tipo-VIP aparece lá hoje) e, sem um
componente de timer de verdade, ficaria confuso pra uma mecânica cuja premissa é pressão de tempo.
