# Como gerar as telas pendentes e enviar para a identidade visual

Este arquivo é o complemento prático do `PENDENCIAS_TELAS.md`: o **formato exato** para você gerar cada
tela que falta e devolvê-la para a pasta `stitch_app_visual_identity/`, mantendo a mesma consistência das
7 telas já prontas.

## O formato usado nas telas já prontas

O `arqlearn_stitch_ui_spec.md` (título original: *"ArqLearn — UI/UX Specification for Google Stitch"*) é
o brief que gerou as 7 telas existentes — cada uma corresponde a um bloco da Seção 5 desse arquivo (`###
A. Home`, `### B. Lesson Session`, etc.), sempre em cima do mesmo contexto de marca (Seções 1–4 e 6–12:
paleta, tipografia, ícones, princípios, tom de voz). É exatamente esse par **bloco específico da tela +
contexto de marca já carregado no projeto** que faltou rodar para as telas abaixo — a especificação delas
já existe, só não foi gerada ainda.

## Passo a passo

1. **Continue no mesmo projeto do Stitch** usado para as 7 telas prontas (não crie um projeto novo) — é
   isso que garante que a paleta, tipografia e os tokens de `blueprint_narrative/DESIGN.md` sejam
   aplicados automaticamente, sem precisar redigitar nada.
2. Para cada tela abaixo, cole o **bloco em inglês** (é o mesmo idioma usado no restante do spec — a
   linguagem de instrução fica em inglês, só as strings de UI entre aspas ficam em português, exatamente
   como nas telas já geradas) como prompt da nova tela.
3. Nomeie a tela no Stitch com o **título sugerido em português** — é esse título que vira o nome da
   pasta ao exportar (ex.: "Sessão de Lição: Quiz" virou `sess_o_de_li_o_quiz/`).
4. Ao exportar, salve os dois arquivos gerados nesta estrutura, repetindo o padrão das pastas existentes:
   ```
   Docs/stitch_app_visual_identity/<slug_da_tela>/code.html
   Docs/stitch_app_visual_identity/<slug_da_tela>/screen.png
   ```
5. Depois de colar os arquivos na pasta, me avise — eu atualizo o `PENDENCIAS_TELAS.md` marcando a tela
   como concluída.

## Ordem sugerida

A própria Seção 12 do spec ("What Stitch should prioritize") já ranqueava as telas — 6 das pendentes
estavam nessa lista de prioridade e ainda não foram geradas; 3 nunca chegaram a entrar na lista de
prioridade (o que sugere importância menor, mas ainda fazem parte do mapa completo do produto). Sugiro
gerar nesta ordem:

**Prioridade alta (já estavam na lista original de prioridades do Stitch):**
1. C — Resumo da Lição (regular)
2. H — Revisão de Perguntas
3. I — Liga
4. J — Perfil
5. K — Loja
6. M — Painel do Professor

**Prioridade menor (fecham o mapa de telas, mas não estavam na lista original):**
7. D — Conquista
8. E — Sem Vidas
9. L — Notificações

---

## C. Lesson Summary (Resumo da Lição regular)
**Título sugerido no Stitch:** `Resumo da Lição`
**Pasta de destino:** `resumo_da_licao/`

> Note: a tela `resumo_modo_infinito/` já existente cobre só o Modo Infinito (questões/100, tempo médio,
> conceitos dominados) — não serve como substituto desta.

```
Show:
- Completion state.
- XP earned.
- Accuracy.
- Lesson progress.
- Updated streak.
- Gems earned when applicable.
- Short motivational message.
- CTA to continue the learning path.

If an achievement was unlocked, transition to Achievement screen.
```

## H. Question Review (Revisão de Perguntas)
**Título sugerido no Stitch:** `Revisão de Perguntas`
**Pasta de destino:** `revisao_de_perguntas/`

```
For teachers/creators.

Show generated questions in a review queue.

Each question card:
- Question text.
- Answer options.
- Correct answer.
- Difficulty.
- Source excerpt.
- Actions: Aprovar / Editar / Rejeitar.

After review:
- CTA "Publicar trilha".
```

## I. League (Liga)
**Título sugerido no Stitch:** `Liga Semanal`
**Pasta de destino:** `liga_semanal/`

```
Purpose: weekly competition.

Show:
- Current league tier.
- Weekly XP.
- Ranking.
- Position.
- Avatar.
- Name.
- XP this week.
- Promotion zone at top.
- Demotion zone at bottom.
- Current user highlighted.

The ranking should feel competitive but clean and professional.
```

## J. Profile (Perfil)
**Título sugerido no Stitch:** `Perfil`
**Pasta de destino:** `perfil/`

```
Show:
- Avatar.
- Name.
- Level.
- Total XP.
- Current streak.
- Best streak.
- Gems.
- Achievements.
- Shop.
- Settings.

Achievements:
- Grid of badges.
- Locked = monochrome silhouette.
- Unlocked = full color.
- Tapping locked badge reveals exact unlock criterion.
```

## K. Shop (Loja)
**Título sugerido no Stitch:** `Loja`
**Pasta de destino:** `loja/`

```
Virtual items purchased with gems.

Categories may include:
- Cosmetic items.
- Streak freeze.
- Heart refill.

Show:
- Current gem balance.
- Item cards.
- Price in gems.
- Purchase CTA.
- Confirmation state.
```

## M. Teacher Dashboard — Web (Painel do Professor)
**Título sugerido no Stitch:** `Painel do Professor`
**Pasta de destino:** `painel_do_professor/`

```
Separate web experience.

Prioritize data clarity.

Include:
- Classes.
- Student count.
- Average streak.
- Average accuracy.
- Weak topics.
- Engagement trends.
- Question review queue.

Use sortable tables and charts.
Do not overuse gamification visuals in the teacher dashboard.
```

## D. Achievement (Conquista)
**Título sugerido no Stitch:** `Conquista Desbloqueada`
**Pasta de destino:** `conquista_desbloqueada/`

```
Show:
- Large achievement badge.
- Achievement name.
- Exact unlock criterion.
- Short celebration.
- XP/gem reward if applicable.
- CTA to continue.

Locked achievements in Profile should appear as monochrome silhouettes.
```

## E. No Hearts (Sem Vidas)
**Título sugerido no Stitch:** `Sem Vidas`
**Pasta de destino:** `sem_vidas/`

```
Show:
- Friendly explanation that all hearts were used.
- Countdown until next heart regenerates.
- Option to restore hearts using gems when available.
- Avoid punitive language.
- CTA to return to Home or explore another activity.
```

## L. Notifications (Notificações)
**Título sugerido no Stitch:** `Notificações`
**Pasta de destino:** `notificacoes/`

```
In-app notification list.

Examples:
- "Sua sequência de 12 dias está em risco!"
- "Você foi promovido para a Liga Prata!"
- "Novo desafio semanal disponível."
- "Suas perguntas estão prontas para revisão."

A streak-risk notification should deep-link directly to the suggested lesson.
```
