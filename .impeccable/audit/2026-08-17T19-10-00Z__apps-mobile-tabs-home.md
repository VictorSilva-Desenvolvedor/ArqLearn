# Impeccable Audit Re-run — Home Surface (ArqLearn Mobile)

**Date**: 2026-08-17 (re-run) · **Scope**: unchanged — `apps/mobile/src/app/(tabs)/index.tsx` + `src/components/home/*` + `src/components/ui/{Button,Icon,IconButton,LoadingBlueprint,Toggle,ErrorBanner,Toast,Modal}.tsx` + `DESIGN.md`/`PRODUCT.md`/`theme/tokens.ts`/`app.json`. Scored against `ios.md`/`android.md` (`adaptive`). Source-only.
**Baseline**: `.impeccable/audit/2026-08-17T18-05-00Z__apps-mobile-tabs-home.md` (12/20)

## Audit Health Score

| # | Dimension | Score | Prior | Δ | Key Finding |
|---|-----------|-------|-------|---|-------------|
| 1 | Accessibility | 3 | 1 | +2 | All 4 P1 labeling/touch-target gaps closed; one contrast fix was incomplete in its actual rendered context |
| 2 | Performance | 3 | 3 | 0 | Unchanged — `ThemeSelector`'s ~50-row `ScrollView` still un-virtualized |
| 3 | Appearance & Theming | 4 | 4 | 0 | Still excellent; the P3 rgba drift is gone (`colors.scrim`) |
| 4 | Platform Conformance | 3 | 2 | +1 | `predictiveBackGestureEnabled` re-enabled and documented; `IconButton` now meets 48dp |
| 5 | Adaptivity | 3 | 2 | +1 | Home body tablet-constrained; `TopAppBar` was left outside the first fix |
| **Total** | | **16/20** | **12/20** | **+4** | **Good** |

## Status of the 13 Prior Findings

All 4 P1s resolved: `Button.tsx` accessibilityRole, per-component accessibility labels (`CurrentLessonNode`, `LessonNode`, `ChestProgressCard`, `TopAppBar`), `hitSlop` on stats-row targets, `predictiveBackGestureEnabled` re-enabled + documented.

2 of 5 P2s fully resolved: Reduce Motion (`useReduceMotion` hook), `IconButton` 44→48dp.

2 P2s found **partially** resolved by the fix pass (token/prop fixed, but didn't reach the actual rendered context):
- **Badge neutral contrast**: `colors.outline` darkened correctly, but `UnitSection`'s only real usage sits inside an `opacity:0.6` wrapper — effective contrast ≈2.3:1, still failing AA. **Fixed same session**: dim now scoped to the card/path only, badge stays undimmed.
- **iPad tablet fix**: Home's `ScrollView` body constrained to 448pt, but `TopAppBar` (a sibling outside it) wasn't — still stretched full-width on iPad. **Fixed same session**: `TopAppBar` now wraps its row/theme-row/stats-row content in the same 448pt constraint.

`TopAppBar` header density: confirmed still open (unchanged from prior audit — needs a layout decision + device verification, not attempted).

All 3 carried-over P3s confirmed still open: `ThemeSelector` virtualization, `Toggle.tsx`'s iOS-shaped switch on both platforms, `app.json`'s undocumented orientation lock — left as design decisions, not attempted this session.

1 P3 fully resolved: `Modal.tsx`'s hand-typed rgba → `colors.scrim`.

## New findings this pass (fixed same session)

- **[P3] `CurrentLessonNode`'s floating callout duplicated its own accessibility label** — VoiceOver/TalkBack announced "Continuar lição" twice (once as plain text, once as the button label). **Fixed**: callout marked `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden`.
- **[P3] Redundant nested `maxWidth: 448`** — `index.tsx`'s content container and `LearningMap.tsx` both applied the identical constraint, two sources of truth for one number. **Fixed**: removed from `LearningMap.tsx` (its only consumer, `index.tsx`, already constrains it).

## Positive Findings

- All 4 prior P1s verified landed correctly in source, not just claimed.
- `useReduceMotion.ts` correctly explains RN has no CSS-level equivalent; wired into both places named; `LoadingBlueprint`'s reduced state (`progress.setValue(0.5)`) is the fully-drawn/peak-opacity frame, not a frozen frame-zero.
- `IconButton`'s `hitSlop` fix hits exactly 48×48dp.
- `PENDENCIAS_MOBILE.md` item #20 cites `git log` provenance and specifies the correct remediation path if predictive-back validation surfaces a problem.
- No regressions: zero raw hex introduced, zero `allowFontScaling={false}`, all four originally-verified "already applied" fixes from the first audit still intact.

## Recommended Actions (resolved same session)

1. ~~Badge neutral-tone contrast in its actual dimmed context~~ — fixed.
2. ~~Extend tablet `maxWidth` constraint to `TopAppBar`~~ — fixed.
3. `TopAppBar` header density — still open, needs device verification.
4. `ThemeSelector` virtualization, `Toggle` cross-platform shape decision, orientation-lock rationale — still open, design/verification decisions not made this session.
5. ~~Silence `CurrentLessonNode`'s duplicate callout announcement~~ — fixed.
6. ~~Deduplicate `maxWidth: 448` between `index.tsx` and `LearningMap.tsx`~~ — fixed.
