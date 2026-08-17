# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: estudantes de graduação/pós-graduação em Arquitetura e Urbanismo, e candidatos a concursos/
certificações profissionais (ex.: CAU), praticando em sessões curtas diárias (5–10min).

Ao contrário do mobile, o web também atende dois papéis adicionais: **professores** (Painel do
Professor com métricas de engajamento da turma, revisão de perguntas geradas por IA — route groups
`(teacher)/painel` e `(teacher)/revisao`) e um **admin** interno (`admin/bugs`, revisão de bugs
reportados). Esses dois papéis são exclusivos do web — nenhum entra no `apps/mobile`
(`Docs/PENDENCIAS_MOBILE.md`).

## Product Purpose

Reduzir a fricção entre "ter material de estudo" e "praticar ativamente" em Arquitetura, automatizando
a criação de exercícios a partir de conteúdo enviado pelo usuário (PDF, DOCX, PPTX, imagens, vídeo) via
pipeline de IA, e sustentar o hábito de estudo diário com mecânicas de gamificação. No web, isso se
expressa nos mesmos modos de prática do mobile (trilhas, Modo Infinito, Resumo Inteligente, Chat sobre
material) mais o par de superfícies de gestão (Painel do Professor, revisão de conteúdo/bugs) que não
existe em nenhum outro cliente.

## Positioning

Único produto que combina upload de material próprio → geração automática de exercícios via IA +
gamificação robusta (estilo Duolingo: XP, streak, vidas, ligas, conquistas, VIP), voltado
especificamente para o domínio de Arquitetura/Urbanismo — não um app de flashcards ou quiz genérico.
No web especificamente, é também a única superfície que dá a um professor visibilidade sobre o
engajamento da turma sem trabalho manual de correção.

## Operating Context

- Next.js App Router com três grupos de rota: `(shell)` — casca autenticada do aluno (Home, Explorar,
  Liga, Loja, VIP, Perfil, Notificações, Ajuda), `(lesson)` — telas de prática em tela cheia sem a
  chrome do shell (sessão de trilha/Modo Infinito, resumo, chat/resumo de material, baú), `(teacher)` —
  exclusivo de professor (painel, revisão de perguntas), mais `admin/bugs` fora de qualquer grupo.
- Auth real via Supabase, mesma base do mobile.
- Backend: `services/monolith` (Go) + `services/ai-content-pipeline`, mesmo toggle
  `EXPO_PUBLIC_API_REAL_RESOURCES`-equivalente do lado web (`lib/api` espelhado do mobile).
- Tailwind v4: tokens de `blueprint_narrative/DESIGN.md` portados para `src/app/globals.css` via
  `@theme` — fonte compartilhada com `apps/mobile/src/theme/tokens.ts`, mantida em sync manualmente
  (RN não lê CSS).
- Uso majoritariamente desktop/tablet para o fluxo de professor (tabelas, gráficos); fluxo de aluno é
  responsivo mobile-first, espelhando o app nativo.

## Capabilities and Constraints

- Painel do Professor e revisão de bugs (`admin/bugs`) são exclusivos do web — decisão do usuário,
  fora de escopo do mobile.
- XP, streak e nível nunca são calculados no cliente — sempre retornados pela API de gamificação
  (regra crítica do projeto, `Docs/CLAUDE.md`).
- Ícones via Material Symbols (webfont) — diferente do mobile (`MaterialCommunityIcons`); nomes de
  glifo mapeados manualmente entre as duas plataformas onde os componentes espelham um ao outro.
- VIP "Mestre Arquiteto" (baú garantido, +25% XP, resets, cupom) já implementado (`(shell)/vip`) —
  feature mais recente, ainda não coberta por nenhum critique.

## Brand Commitments

Nome: ArqLearn. Identidade visual completa (17 telas de alta fidelidade) em
`Docs/stitch_app_visual_identity/` — usar como referência de layout/cor/tipografia (tokens em
`blueprint_narrative/DESIGN.md`), nunca copiar o HTML estático direto para produção. Esta é a mesma
fonte compartilhada com `apps/mobile` (ver `apps/mobile/DESIGN.md` para a expressão já documentada do
lado nativo).

## Evidence on Hand

- `Docs/stitch_app_visual_identity/` — 17 telas de alta fidelidade (`code.html` + `screen.png`) e
  tokens de design (`blueprint_narrative/DESIGN.md`).
- `Docs/ArqLearn_Documento_Arquitetura_Software.md` (SAD) e `Docs/CLAUDE.md` — arquitetura, escopo V1,
  stack tecnológica fechada, regras de negócio críticas (XP, nível, streak, SRS, ligas).
- `apps/mobile/PRODUCT.md`/`DESIGN.md` — já documentados nesta mesma sessão; useis como referência de
  paridade cross-platform, não como autoridade sobre o que o web deve fazer.
- Nenhum teste real de acessibilidade foi feito ainda no web — não presumir conformidade.

## Product Principles

1. Prática diária curta e gamificada vence sessões longas e esporádicas.
2. Nunca calcular XP/streak/nível no cliente — sempre confiar na API de gamificação.
3. O par Professor/Admin é uma responsabilidade exclusiva do web — não duplicar essa superfície no
   mobile "pra ter paridade".
4. Preservar paridade visual com `apps/mobile` no que é compartilhado (identidade Stitch/ArqLearn),
   mas o web pode ter superfícies inteiras (Painel do Professor) sem equivalente nativo.
5. Real vence mock — cada fase é considerada pronta só depois de verificada ao vivo contra o backend
   real, mesmo padrão do mobile.

## Accessibility & Inclusion

Padrão mínimo: **WCAG 2.1 AA** — mesma decisão confirmada com o usuário durante o `init` de
`apps/mobile` em 2026-08-17, tratada aqui como padrão de produto (não específico de uma plataforma).
Ainda não auditado nem implementado neste app.
