# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary: estudantes de graduação/pós-graduação em Arquitetura e Urbanismo, e candidatos a concursos/
certificações profissionais (ex.: CAU), praticando em sessões curtas diárias (5–10min).

No mobile especificamente, o escopo é 100% a experiência do aluno — Painel do Professor e área Admin
(revisão de bugs) ficam exclusivamente no `apps/web` (decisão explícita do usuário, registrada em
`Docs/PENDENCIAS_MOBILE.md`).

## Product Purpose

Reduzir a fricção entre "ter material de estudo" e "praticar ativamente" em Arquitetura, automatizando
a criação de exercícios a partir de conteúdo enviado pelo usuário (PDF, DOCX, PPTX, imagens, vídeo) via
pipeline de IA, e sustentar o hábito de estudo diário com mecânicas de gamificação. No mobile, isso se
expressa em trilhas estruturadas por lição, Modo Infinito (prática sem fim por tema), Resumo Inteligente
e Chat sobre um material específico.

## Positioning

Único produto que combina upload de material próprio → geração automática de exercícios via IA +
gamificação robusta (estilo Duolingo: XP, streak, vidas, ligas, conquistas), voltado especificamente
para o domínio de Arquitetura/Urbanismo — não um app de flashcards ou quiz genérico.

## Operating Context

- Navegação por abas via `expo-router`: Home / Explorar / Liga / Perfil.
- Auth real via Supabase (sessão criptografada com `expo-secure-store` + `AsyncStorage`, padrão oficial
  Supabase pra Expo).
- Backend: `services/monolith` (Go) + `services/ai-content-pipeline`, atrás do toggle
  `EXPO_PUBLIC_API_REAL_RESOURCES` (parte dos recursos já real, parte ainda mock — ver
  `Docs/PENDENCIAS_MOBILE.md` para o estado atual por fase).
- Modos de prática: quiz por lição (trilha estruturada), Modo Infinito, Resumo Inteligente, Chat sobre
  material enviado.
- Uso majoritariamente mobile-first, sessões curtas, fora de um contexto de mesa/desktop.

## Capabilities and Constraints

- Painel do Professor / área Admin fora de escopo do mobile — só no web.
- Login/auth validado ponta a ponta via `expo start --web` + Playwright contra backend real; ainda falta
  validar em device/emulador nativo real (Keychain/Keystore do `expo-secure-store`, refresh de token em
  background via `AppState`/`startAutoRefresh`, gestos nativos).
- Fases 1 (quiz), 2 (Modo Infinito) e 3 (Resumo/Chat) já verificadas ao vivo sem bugs encontrados; alguns
  estados de gamificação (`NoHeartsDialog` restaurando com gemas, tela de conquista por 100% de acerto,
  `LevelUpCelebration`) ainda não foram forçados/testados ao vivo.
- XP, streak e nível nunca são calculados no cliente — sempre retornados pela API de gamificação (regra
  crítica do projeto, `Docs/CLAUDE.md`).
- Tokens de design portados manualmente para `src/theme/tokens.ts` — RN não lê o `@theme` CSS do web
  (`apps/web/src/app/globals.css`); os dois precisam ser mantidos em sync manualmente.
- Ícones via `MaterialCommunityIcons` (`@expo/vector-icons`), mapeados a partir dos nomes usados no web
  (Material Symbols) em `src/components/ui/Icon.tsx` — nomes de glifo diferem entre as duas plataformas.

## Brand Commitments

Nome: ArqLearn. Identidade visual completa (17 telas de alta fidelidade) em
`Docs/stitch_app_visual_identity/` — usar como referência de layout/cor/tipografia (tokens em
`blueprint_narrative/DESIGN.md`), nunca copiar o HTML estático direto para produção.

## Evidence on Hand

- `Docs/stitch_app_visual_identity/` — 17 telas de alta fidelidade (`code.html` + `screen.png`) e tokens
  de design (`blueprint_narrative/DESIGN.md`).
- `Docs/PENDENCIAS_MOBILE.md` — registro vivo do que já foi verificado ao vivo por fase e o que falta,
  incluindo bugs já corrigidos.
- `Docs/ArqLearn_Documento_Arquitetura_Software.md` (SAD) e `Docs/CLAUDE.md` — arquitetura, escopo V1,
  stack tecnológica fechada, regras de negócio críticas (XP, nível, streak, SRS, ligas).
- Nenhum teste real de acessibilidade (leitor de tela, contraste, toque) foi feito ainda — não presumir
  conformidade.

## Product Principles

1. Prática diária curta e gamificada vence sessões longas e esporádicas.
2. Mobile é a experiência do aluno, ponto final — nenhuma feature de professor/admin entra aqui.
3. Nunca calcular XP/streak/nível no cliente — sempre confiar na API de gamificação.
4. Preservar paridade visual com `apps/web` (mesma identidade Stitch/ArqLearn), mas honrar as garantias
   nativas de cada SO quando a plataforma exigir (safe areas, Reduce Motion, gesto de voltar por borda).
5. Real vence mock — cada fase é considerada pronta só depois de verificada ao vivo contra o backend
   real, não só por `tsc --noEmit`/smoke test de import.

## Accessibility & Inclusion

Padrão mínimo confirmado com o usuário: **WCAG 2.1 AA** (contraste, tamanho de toque, suporte a leitor
de tela). Decisão registrada em 2026-08-17; ainda não auditado nem implementado — próximo passo natural
é `/impeccable audit`.
