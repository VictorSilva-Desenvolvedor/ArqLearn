# UI_AUDIT_STATUS — log de auditoria de tela (ui-reviewer)

Memória entre execuções do subagent `ui-reviewer` (`.claude/agents/ui-reviewer.md`). Uma linha por
tela por execução. Lista mestra das telas:
`Docs/stitch_app_visual_identity/PENDENCIAS_TELAS.md` (17 telas).

**Como usar:** antes de um modo varredura, priorize telas sem entrada aqui ou com a entrada mais
antiga. Depois de auditar, acrescente a linha correspondente.

| Data | Tela | Alvo | Status | Achados / ação |
|---|---|---|---|---|
| 2026-08-24 | A. Home — Mapa de Aprendizado | `apps/web/src/app/(shell)/page.tsx` | Auditada — corrigida | Título da unidade duplicado (h3 + card), badge/borda "em andamento" em laranja violando a One Job Per Color Rule, barra da Meta Diária espremida a ~90px em viewport de 390px. Todos corrigidos. Passe funcional ao vivo: os 6 elementos interativos navegam de verdade. Detector do impeccable: 0 achados. |
| 2026-08-24 | A. Home — Mapa de Aprendizado | `apps/mobile/src/app/(tabs)/index.tsx` | Auditada por código — **verificação visual pendente** | Mesmo título duplicado (corrigido), nó "concluído" mostrando o ícone da matéria em vez do check (corrigido, paridade com web + Stitch), Meta Diária em `flexDirection: row` espremendo barra+rótulo+botão numa largura de telefone (corrigido). Screenshot da Home real **não** foi possível: mobile só tem sessão real via Supabase Auth, sem modo demonstração — ver pendência #1 abaixo. |

## Pendências abertas geradas por estas auditorias

### 1. A suíte visual não cobre nenhuma tela autenticada (aberta em 2026-08-24)

Os dois testes de `e2e/visual/` se chamavam "home do apps/web" e "home do apps/mobile", mas os
baselines salvos eram a **tela de login** (web — `/` é rota protegida e redireciona) e a **tela de
boas-vindas** (mobile — sem sessão). A suíte passava verde havia versões sem nunca ter olhado para
o Mapa de Aprendizado. Os testes foram renomeados para dizer a verdade sobre o que cobrem
(`web-login.png`, `mobile-boas-vindas.png`), mas a lacuna continua:

> **Nenhuma tela de dentro do app tem cobertura de regressão visual.**

Fechar isso exige uma decisão do usuário sobre como o Playwright obtém uma sessão — por exemplo,
uma conta de teste dedicada com as credenciais em variável de ambiente (`E2E_EMAIL`/`E2E_PASSWORD`,
nunca commitadas), ou uma sessão semeada. Enquanto não houver essa decisão, **toda auditoria de
tela autenticada depende de inspeção manual** e o lado mobile não pode ser verificado visualmente
de jeito nenhum.

### 2. O que deve morar no card da unidade no Mapa (aberta em 2026-08-24)

O card sob o título da unidade repetia o nome da trilha — a mesma string do heading logo acima. Foi
mudado para só renderizar quando existe um subtítulo de verdade (`track.description`). Só que
`track.description` **não é serializado pela API real** (`Docs/CLAUDE.md`, pegadinha de contrato
#3), então na prática o card deixa de aparecer no app real. Isso é aceitável (o badge já carrega o
status), mas a referência do Stitch tem essa caixa e o `DESIGN.md` do web a cita nominalmente como
um dos dois consumidores legítimos de `shadow-gamified`.

**Pergunta para o usuário:** o que deve ficar nessa caixa?
(a) nada — remover de vez, como está agora na prática;
(b) o progresso da unidade ("3 de 8 lições concluídas");
(c) formalizar `track.description` nos três lugares (API Spec, Database Design, struct Go) e usar a
descrição real da trilha.
