# Impeccable Audit — ArqLearn Web Home Surface (Re-run)

**Date**: 2026-08-17 (fresh re-scan, post-fix)
**Scope**: `apps/web/src/app/(shell)/page.tsx`, `apps/web/src/components/features/home/*.tsx` (10 files), `apps/web/src/components/ui/{Button,Card,Modal,DropdownMenu,Toast,Toggle,ProgressBar,Icon,Badge}.tsx`, `apps/web/DESIGN.md`, `apps/web/PRODUCT.md`, `apps/web/src/app/globals.css`
**Baseline**: `.impeccable/audit/2026-08-17T18-05-00Z__apps-web-shell-home.md` (15/20)

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Contrast fully fixed, but the `Card` `interactive` fix shipped without keyboard activation — a WCAG 2.1.1 (Level A) failure on 6 already-live consumers |
| 2 | Performance | 4 | Unchanged — server-rendered, no images, no unbounded animation |
| 3 | Responsive Design | 4 | Both XP-row wrap/shrink fixes verified; no remaining issues found |
| 4 | Theming | 4 | Fully token-driven; `UnitSection`'s magic number now a real `var()`, `LearningMap`'s `28rem` documented as deliberate |
| 5 | Implementation Integrity | 3 | Detector clean, but `Card.tsx`'s own comment ("interactive não é usado por nenhum consumidor ainda") was factually false — 6 live consumers found |
| **Total** | | **17/20** | **Good — address weak dimensions** |

**Score delta: 15/20 → 17/20 (+2)**

## Status of the 7 Prior Findings

| # | Prior finding | Status |
|---|---|---|
| P1 | Sub-3:1 border contrast (`--color-outline-variant`) | Resolved — measured 3.08–3.59:1 (was ~1.6:1) |
| P1 | Neutral badge text contrast (`--color-outline`) | Resolved — measured 4.91–5.41:1 (was 4.09:1) |
| P1 | No themed focus indicator on `Button`/`Card`/`Toggle`/`DropdownMenuItem` | Partially fixed — landed on all 4 named primitives, but (a) `Card`'s `interactive` variant was focusable but not activatable (new bug), (b) Home's own `LessonNode`/`CurrentLessonNode` never got the treatment |
| P2 | Home has no page-distinguishing heading | Resolved — `<h1 className="sr-only">Início</h1>` |
| P2 | XP/level labels have no wrap/shrink fallback | Resolved — `min-w-0`/`shrink-0`/`flex-wrap` |
| P2 | `aria-disabled` on a role-less `<div>` | Resolved — `role="button"` added |
| P3 | Magic-number layout values (`28rem`, `±32px`) | Substantially resolved — `±32px` now `var(--spacing-xl)`; `28rem` documented as intentional but not tokenized |

## Findings this pass (before the follow-up fix applied same-session)

- **[P1] `Card`'s `interactive` variant was focusable but not keyboard-activatable** — `role="button"`+`tabIndex` with no `onKeyDown`, affecting 6 live consumers (`TrackCard`, `ProfileMenuLink`, `LogoutMenuLink`, `ShopCosmeticItem`, `NotificationItem`, `UploadedContentItem`). WCAG 2.1.1. **Fixed same session**: `Card.tsx` now calls `e.currentTarget.click()` on Enter/Space.
- **[P2] Home's actual interactive map nodes never received focus-visible** — `LessonNode`'s three variants and `CurrentLessonNode` had zero `focus-visible` occurrences despite the pattern being ported to shared primitives. **Fixed same session**.
- **[P2, informational only]** `DropdownMenuItem`'s indicator uses `data-[highlighted]` (Radix roving focus), not literally `:focus-visible` — verified as an acceptable, documented equivalent, no action needed.
- **[P2, residual, accepted]** `LessonNode` construction `<div>` has `role="button"` but no `tabIndex` — excludes it from Tab order (closer to native `disabled` semantics than ARIA-disabled convention). Accepted as-is; low impact.
- **[P3]** `LearningMap`'s `28rem` still a raw arbitrary value, now with an explanatory comment — left as documented, not tokenized.

## Positive Findings

- Both contrast fixes independently recomputed and verified correct.
- `globals.css` changelog comment matches measured values within rounding.
- `DESIGN.md` is honest about the resulting web/mobile divergence on `--color-outline-variant`.
- No hard-coded hex colors found anywhere in the audited scope.
- Detector (`detect.mjs`) remains clean.

## Recommended Actions (resolved same session)

1. ~~`Card`'s `interactive` variant keyboard activation~~ — fixed.
2. ~~`focus-visible` on `LessonNode`/`CurrentLessonNode`~~ — fixed.
3. `LessonNode` construction `<div>` tab-order decision — accepted as-is (excluded from Tab order).
4. `LearningMap`'s `28rem` tokenization — left as documented comment, not promoted to a `@theme` token (low value, single use site).
