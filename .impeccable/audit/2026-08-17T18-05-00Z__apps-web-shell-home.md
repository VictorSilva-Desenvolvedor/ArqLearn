# Impeccable Audit — ArqLearn Web Home Surface

**Date**: 2026-08-17
**Scope**: `apps/web/src/app/(shell)/page.tsx`, `apps/web/src/components/features/home/*.tsx` (10 files), shared UI primitives (`Button`, `Card`, `Modal`, `DropdownMenu`, `Toast`, `Toggle`, `ProgressBar`, `Icon`, plus `Badge` which several of these depend on).

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | `border-outline-variant` (the load-bearing border in "Flat-By-Default") measures ~1.6:1 — far under WCAG 1.4.11's 3:1 |
| 2 | Performance | 4 | Server-rendered Home, no images, no unbounded animation, no `will-change` — nothing to flag |
| 3 | Responsive Design | 3 | Touch targets all pass; growing XP/level numbers have no wrap fallback |
| 4 | Theming | 3 | Fully token-driven; two magic-number layout values (`28rem`, `±32px`) bypass the scale |
| 5 | Implementation Integrity | 3 | Detector clean; prior critique's P0/P1s verified fixed; new gap between a DESIGN.md claim and measured contrast |
| **Total** | | **15/20** | **Good — address weak dimensions** |

## Implementation Integrity Verdict

**Pass.** `node .claude/skills/impeccable/scripts/detect.mjs --json "apps/web/src/app/(shell)/page.tsx" apps/web/src/components/features/home apps/web/src/components/ui` exits **0** with an empty findings array — no mock data, dead scaffolding, or slop patterns detected in the current tree.

Manually verified against DESIGN.md's changelog claims — all landed as documented:
- `Button.tsx` (`variantClasses.primary`, line 17), `Modal.tsx` (line 44), `DropdownMenu.tsx` (line 21-22): bare `shadow-sm`/`shadow-lg` genuinely removed, comments explain why.
- `LessonNode.tsx`: `completed` (line 34) and `checkpoint` (line 22) variants both carry real `aria-label`.
- `DailyGoalCard.tsx:36`: "Revisar Erros" is now `variant="ghost"` wired to `showToast(...)`, not a dead primary CTA.
- `CurrentLessonNode.tsx:45`: node face is `bg-primary`/`border-surface-bright`, not the orange color-contract violation the prior critique caught — and `animate-bounce` is gone (now `hover:scale-105`).

The one integrity crack found this pass: DESIGN.md states Modal/DropdownMenu "already had a 2px border doing the actual separation job" when justifying the shadow removal — but that border (`--color-outline-variant`) measures ~1.6:1 against the surfaces it's supposed to separate, well under any real contrast threshold. The claim doesn't hold up under measurement.

## Executive Summary

- **Audit Health Score: 15/20 (Good)**
- **Issues found: 7 total** — P0: 0, P1: 3, P2: 3, P3: 1
- **Top issues**: (1) the app's core "border-as-separation" token fails non-text contrast almost everywhere it's used; (2) the same underlying token pair also fails text contrast on the neutral badge; (3) zero themed focus-visible treatment on `Button`/`Card`/`Toggle`/`DropdownMenu`, despite the exact pattern already existing elsewhere in this codebase (`AnswerOption`).
- **Recommended next step**: run `/impeccable harden` to fix the token-level contrast issues (P1s), since two of three P1s trace back to the same `--color-outline`/`--color-outline-variant` definitions and are cheapest to fix once, centrally.

## Detailed Findings by Severity

### P1 — Major

**[P1] Systemic sub-3:1 border contrast undermines "Flat-By-Default" separation**
- **Location**: `apps/web/src/components/ui/Card.tsx:41` (default border), `Modal.tsx:44`, `DropdownMenu.tsx:22`, `Badge.tsx:15` (neutral tone border), `apps/web/src/components/features/home/LessonNode.tsx:59` (construction node's dashed border)
- **Category**: Accessibility / Theming
- **Impact**: Measured `#c2c7d0` (`--color-outline-variant`) against `#f8f9ff` (surface-bright) = **1.62:1**, against `#f3f4f6` (surface-gray) = **1.54:1** — both far below WCAG 1.4.11's 3:1 minimum for UI component boundaries. This border is the one thing DESIGN.md credits with replacing the shadows removed on 2026-08-17; in practice it's barely perceptible, so cards, modals, dropdowns, and disabled lesson nodes lose their primary visual boundary for low-vision users.
- **WCAG**: 1.4.11 Non-text Contrast (AA)
- **Recommendation**: Darken `--color-outline-variant` in `globals.css`'s `@theme` block until it clears 3:1 against both surface tones, or introduce a dedicated stronger "resting boundary" token.
- **Suggested command**: `/impeccable harden`

**[P1] Neutral badge / `text-outline` label text fails AA text contrast**
- **Location**: `apps/web/src/components/ui/Badge.tsx:15` (`neutral: "text-outline bg-surface-gray..."`), rendered live at `apps/web/src/components/features/home/UnitSection.tsx:33,43` as the "EM CONSTRUÇÃO" status badge
- **Category**: Accessibility
- **Impact**: `#727780` on `#f3f4f6` = **4.09:1**, below the 4.5:1 AA minimum for normal-size text (12px label-caps). The one badge state whose entire job is to say "nothing to do here yet" is the hardest one on the screen to read.
- **WCAG**: 1.4.3 Contrast (Minimum), AA
- **Recommendation**: Swap to a token pair that already passes — `text-on-surface-variant` measures 8.9:1 against surface-bright — or darken the neutral badge text specifically.
- **Suggested command**: `/impeccable harden`

**[P1] No themed keyboard focus indicator on primary interactive primitives**
- **Location**: `apps/web/src/components/ui/Button.tsx`, `Card.tsx` (interactive variant), `Toggle.tsx`, `DropdownMenu.tsx`'s `DropdownMenuItem` (line 50, `outline-none` with only a `data-[highlighted]` background as substitute) — zero `focus-visible:` occurrences anywhere in `components/ui`
- **Category**: Accessibility
- **Impact**: These fall back to the browser's unstyled default outline — not literally invisible, but unbranded and inconsistent — while DESIGN.md documents `AnswerOption`'s `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` as "the model" for themed keyboard focus elsewhere in this exact app. Home's own primitives never received the equivalent treatment.
- **WCAG**: 2.4.7 Focus Visible (AA)
- **Recommendation**: Port `AnswerOption`'s focus-visible pattern to `Button`, `Card` (interactive), `Toggle`, and `DropdownMenuItem`.
- **Suggested command**: `/impeccable harden`

### P2 — Minor

**[P2] Home has no page-distinguishing heading**
- **Location**: `apps/web/src/app/(shell)/page.tsx` (no `<h1>`/page title anywhere in the file); contrast with every sibling route in `(shell)` — `ajuda/page.tsx:8`, `notificacoes/page.tsx:15`, `vip/page.tsx:87`, `loja/page.tsx:52`, `perfil/configuracoes/page.tsx:179` — which all render their own `<h1>`. The only `<h1>` on Home is `apps/web/src/components/layout/TopAppBar.tsx:64`'s global "ArqLearn" brand wordmark, identical on every route.
- **Category**: Accessibility
- **Impact**: A screen-reader user scanning by headings list gets "ArqLearn" (h1) then straight to "Meta Diária" (h2) with no cue confirming they're on the Home/learning-map screen — the orientation every other shell page provides.
- **WCAG**: 2.4.6 Headings and Labels (AA)
- **Recommendation**: Add a page-specific heading (can be visually minimal/`sr-only` if the design doesn't want a literal "Início" headline).
- **Suggested command**: `/impeccable clarify`

**[P2] Numeric XP/level labels have no shrink or wrap fallback**
- **Location**: `apps/web/src/components/features/home/LevelProgressCard.tsx:28-32` (`flex items-center justify-between` row: label-caps span + `whitespace-nowrap` XP span, neither shrinkable), `DailyGoalCard.tsx:23-27` (`ProgressBar` as `flex-1` sibling to a `whitespace-nowrap` XP span)
- **Category**: Responsive Design / text scaling
- **Impact**: DESIGN.md's own "Mono-Counts Rule" commits XP/level numbers to grow unboundedly. At narrow viewports (~320px) or 200%+ browser zoom (WCAG 1.4.4), `LevelProgressCard`'s row has no `flex-wrap` and both spans resist shrinking (risk of overlap/clipping); `DailyGoalCard`'s progress bar would get silently squeezed toward zero width as the adjacent label claims space.
- **Recommendation**: Allow the row to wrap, or give the numeric span sensible bounds.
- **Suggested command**: `/impeccable harden`

**[P2] `aria-disabled` on a non-interactive, role-less `<div>`**
- **Location**: `apps/web/src/components/features/home/LessonNode.tsx:56-65` (construction variant)
- **Category**: Accessibility / Implementation Integrity
- **Impact**: `aria-disabled` is only reliably exposed on elements with a widget role; on a bare `<div>` the disabled-state semantic isn't guaranteed to be announced — it happens to mostly work because the `aria-label` text is still read, but the "this is a disabled control" signal is unreliable.
- **Recommendation**: Drop `aria-disabled` (the label already says "ainda sem conteúdo") or add `role="button"` if it should read as an inert control.
- **Suggested command**: `/impeccable harden`

### P3 — Polish

**[P3] Hard-coded magic-number layout values bypass the spacing/width token scale**
- **Location**: `apps/web/src/components/features/home/LearningMap.tsx:13` (`max-w-[28rem]` arbitrary value), `UnitSection.tsx:70` (inline `style={{ transform: \`translateX(${index % 2 === 0 ? -32 : 32}px)\` }}` — flagged in the prior critique pass, still unresolved)
- **Category**: Theming
- **Impact**: Low — DESIGN.md acknowledges `28rem` deliberately mirrors mobile's local approximation. The `±32px` inline transform is the more genuine drift since it's invisible to any future spacing-scale refactor.
- **Recommendation**: Promote both to named `@theme` values.
- **Suggested command**: `/impeccable polish`

## Patterns & Systemic Issues

- **The `outline`/`outline-variant` token pair is too light for AA at either job it's asked to do.** `#727780` fails as text color (4.09:1 vs. the 4.5:1 needed), and `#c2c7d0` fails as a border color (1.5-1.6:1 vs. the 3:1 needed) — both against this app's off-white surfaces. Since the pair is reused across `Card`, `Modal`, `DropdownMenu`, `Badge`, and `LessonNode`, this is a token-definition problem best fixed once in `globals.css`'s `@theme` block, not per-component.
- **Zero `focus-visible` styling anywhere in `components/ui`**, despite `AnswerOption` already having the exact pattern to copy (per DESIGN.md) — the fix is a known, existing pattern in the same codebase, not something to invent from scratch.

## Positive Findings

- `Icon.tsx:20` always sets `aria-hidden="true"` on the glyph span — an app-wide default that keeps decorative icon glyphs out of the accessibility tree without every call site needing to remember it.
- `Toast.tsx:18-19` uses `role="status"` + `aria-live="polite"` — correct, appropriately non-intrusive live-region pattern.
- `ProgressBar.tsx:34-37` exposes `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` — real semantics, not a decorative filled div.
- `prefers-reduced-motion` (`globals.css:218-227`) is a genuine, deliberate global rule that shortens rather than deletes transitions, preserving state-change feedback.
- All touch targets in scope measure ≥44×44px: `LessonNode` variants are 64-80px, `CurrentLessonNode` is 80px, `Button` md/lg sizes comfortably clear the minimum.
- The previously flagged P0 (dead "Revisar Erros" CTA) and P1s (color-contract violation, missing `aria-label`s, `animate-bounce`) from the 2026-08-17 critique pass are all verified fixed in the current source, not just claimed in DESIGN.md.

## Recommended Actions

1. **[P1] `/impeccable harden`**: Fix the `--color-outline`/`--color-outline-variant` token contrast failures at the source — both the ~1.6:1 border boundary (Card/Modal/DropdownMenu/Badge/LessonNode) and the 4.09:1 neutral-badge text.
2. **[P1] `/impeccable harden`**: Port `AnswerOption`'s `focus-visible` treatment to `Button`, `Card` (interactive), `Toggle`, and `DropdownMenuItem`.
3. **[P2] `/impeccable clarify`**: Give Home a page-distinguishing heading so it's not indistinguishable from every other shell route when navigating by headings.
4. **[P2] `/impeccable harden`**: Add wrap/shrink handling to the numeric XP rows in `LevelProgressCard` and `DailyGoalCard`.
5. **[P2] `/impeccable harden`**: Fix the `aria-disabled`-on-a-`div` pattern in `LessonNode`'s construction variant.
6. **[P3] `/impeccable polish`**: Tokenize `LearningMap`'s `28rem` max-width and `UnitSection`'s `±32px` zigzag transform.
7. **`/impeccable polish`**: Final integration pass once the above land.
