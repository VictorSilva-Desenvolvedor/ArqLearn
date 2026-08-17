---
target: Home shell page (apps/web)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-17T17-49-54Z
slug: apps-web-src-app-shell-page-tsx
---
Method: dual-agent (A: af2750abc6da074f6 · B: ad1b288e20d877620)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + `ErrorBanner` retry exist, but skeleton shape doesn't mirror the real layout |
| 2 | Match System / Real World | 3 | Plain PT-BR labels, logical top-to-bottom order |
| 3 | User Control and Freedom | 3 | `AllDonePrompt` has real dismiss/escape; `NoHeartsDialog` close behavior is a minor rough edge |
| 4 | Consistency and Standards | 2 | `Button.tsx` still carries the documented `shadow-sm` anti-pattern; `CurrentLessonNode` breaks the color contract |
| 5 | Error Prevention | 3 | 0-hearts state correctly blocks navigation into a lesson via `NoHeartsDialog` |
| 6 | Recognition Rather Than Recall | 3 | Explicit status badges (CONCLUÍDO/EM ANDAMENTO/etc.), nothing to memorize |
| 7 | Flexibility and Efficiency | 1 | No accelerators for a daily-return user |
| 8 | Aesthetic and Minimalist Design | 2 | 5 near-identical bordered `Card` blocks stack before any real differentiation |
| 9 | Error Recovery | 3 | Clear message + retry, but generic (no cause distinction) |
| 10 | Help and Documentation | 1 | Nothing explains chest mechanics, checkpoints, or "construction" nodes |
| **Total** | | **24/40** | **Acceptable (60%)** |

## Design Specificity Verdict

**LLM assessment**: The blueprint grid on `<body>`, Hanken Grotesk display type, and the flat/sharp `Card`+`Button` vocabulary genuinely feel authored for this system. But the Home screen's actual composition — XP bar, level ring, chest tiles, zigzag node path — is structurally identical to Duolingo's home. Nothing architecture/urbanism-specific shows up visually; specificity lives only in copy and icon choices, not in any domain-authored layout idea.

**Deterministic scan**: `detect.mjs` ran against `page.tsx` + `components/features/home` + `components/ui` (exit code 2, 1 finding) and caught something the LLM pass missed entirely: **`bounce-easing`** (`animate-bounce`, Tailwind) on `CurrentLessonNode.tsx:31` — a "slop" pattern flag for elastic/bounce motion, worth a deliberate look given this system's stated "one authored moment, not scattered effects" motion philosophy. Static grep evidence independently confirms two of the LLM's qualitative calls with hard numbers:
- **Confirms the `shadow-sm` drift** DESIGN.md already flagged: 5 total bare-shadow occurrences across `components/ui` (`Toggle.tsx`, `Button.tsx`, `Toast.tsx`, `Modal.tsx`, `DropdownMenu.tsx`), none inside `page.tsx`/`features/home` itself — the drift is systemic across shared UI primitives, not a one-off.
- **Quantifies the accessibility gap**: only 2 `aria-label`/`aria-hidden`/`role=` attributes across the entire Home surface (both in `LessonNode.tsx`), against 5 total `<button>`/`<Link>` interactive elements in `features/home` and zero accessibility attributes anywhere in `components/ui`. Zero `focus-visible` occurrences in either scope — confirming the LLM's claim that `Button`/`Card` lack the keyboard-focus treatment `AnswerOption` (elsewhere in the app) is documented as having.

**Visual overlays**: Not available this pass. The dev server started cleanly (`next dev`, ready in 3s) but every route — including `/` and `/login` — returned HTTP 500 from a missing `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in this sandbox's `.env.local`; a documented mock-login cookie bypass exists (`arqlearn_mock_account`) but never gets reached because the Supabase env check throws first. Independently, no browser-automation tool was available in this session either. Both are legitimate, reported skips — not silently dropped. The dev server was stopped cleanly after the attempt.

## Overall Impression

Structurally solid and nothing is silently broken at the code level, but Home reads as administrative rather than motivating: five near-identical bordered cards (goal, level, 2 chests, optional banner) stand between arrival and the one thing the screen exists to help you do — start the current lesson. The single biggest opportunity: the screen's own design system has a strict color grammar and a documented, real shadow token (`shadow-gamified`) built exactly for moments like "this is your next lesson" — and the current-lesson node uses neither correctly.

## What's Working

- `AllDonePrompt`'s `suppressAutoOpen` handling is a real, demonstrated fix for a two-modal race with `StreakAtRiskPrompt` — thoughtful, not hand-wavy.
- `unitStatusFor` correctly special-cases a zero-lesson track instead of trusting a vacuously-true `every()` — caught against a live track with 0 lessons.
- `ProgressBar` clamps 0-100 defensively.

## Priority Issues

- **[P0] Dead-end primary CTA.** `DailyGoalCard.tsx:26-28` renders a solid `variant="primary"` "Revisar Erros" button with no `onClick`/`href` anywhere in `apps/web/src` — clicking it does nothing, not even a toast (mobile's equivalent at least fires a "not available yet" toast). Confirmed independently by static evidence (zero handler, zero route).
  **Why it matters**: a fully-styled, always-enabled primary action that does actually nothing — not even acknowledging the tap — is worse than mobile's already-flagged version of the same bug, and erodes trust in every other button on the page.
  **Fix**: wire a real handler/route, or remove the button until the flow exists (same fix already shipped for `apps/mobile`'s `DailyGoalCard`).
  **Suggested command**: `/impeccable clarify` or direct fix via `/impeccable polish`.

- **[P1] Current-lesson node breaks the color contract.** `CurrentLessonNode.tsx:39` fills the primary "what to do next" node in `bg-secondary`/`border-secondary` (orange, reserved for gamification/reward per `DESIGN.md`'s Named Rule) — the identical mistake already found and fixed on `apps/mobile`.
  **Why it matters**: this is the screen's single most important element, and it inverts the exact rule the design system exists to enforce — on both platforms independently, which suggests the rule needs a documented exception or the implementation needs a real fix, not a coincidence to leave alone twice.
  **Fix**: `bg-primary`/`border-primary` for the node face, reserve orange strictly for the CTA callout bubble (mirroring the fix already applied to `apps/mobile/CurrentLessonNode.tsx`).
  **Suggested command**: `/impeccable polish`

- **[P1] No accessible name on the two most important interactive nodes.** `CurrentLessonNode.tsx:36-42` (button) and `LessonNode.tsx:29-40` (`completed`/`checkpoint` links) contain only an `aria-hidden` icon — zero accessible name — while the `available`/`construction` variants do have `aria-label`. Confirmed by static evidence: only 2 of 5 interactive elements in the Home tree carry any accessibility attribute.
  **Why it matters**: a screen-reader user gets "button"/"link" with no further information on exactly the elements that matter most, against a confirmed-but-unaudited WCAG 2.1 AA target.
  **Fix**: add `aria-label` consistently across all five `LessonNode`/`CurrentLessonNode` variants.
  **Suggested command**: `/impeccable audit`

- **[P2] Systemic `shadow-sm`/`shadow-lg` drift.** DESIGN.md flags `Button.tsx`'s `shadow-sm` as a known anti-pattern; static evidence shows it's not isolated — `Toggle.tsx`, `Toast.tsx`, `Modal.tsx`, and `DropdownMenu.tsx` all carry bare Tailwind shadows too, none of them the system's own `shadow-gamified` token.
  **Why it matters**: the "Flat-By-Default" rule is a Named Rule for a reason — generic shadows are exactly the kind of default-reach the system was built to refuse; five instances is a pattern, not a typo.
  **Fix**: audit all five for `shadow-gamified` (if the element is genuinely a critical gamified moment) or remove entirely.
  **Suggested command**: `/impeccable audit`

- **[P3] `bounce-easing` on the current-lesson node.** Detector-caught, not flagged by the design-review pass: `animate-bounce` on `CurrentLessonNode.tsx:31`.
  **Why it matters**: bounce/elastic easing is a named "slop" pattern this skill's floor explicitly warns against reaching for by habit; worth a deliberate look against the system's stated "one authored moment" motion philosophy rather than an unexamined Tailwind default.
  **Fix**: replace with an authored, purposeful motion choice (or confirm the bounce is intentional and document it as an exception).
  **Suggested command**: `/impeccable animate`

## Persona Red Flags

**Sam (keyboard/screen reader)**: `CurrentLessonNode` and the completed/checkpoint `LessonNode` links have no accessible name; `Button.tsx` has zero `focus-visible` treatment anywhere, unlike `AnswerOption` elsewhere in the app, which DESIGN.md holds up as the model for themed keyboard focus.

**Jordan (first-timer)**: lands on 5 stacked, unlabeled-as-groups cards before reaching the map; chest cards and the checkpoint diamond node have no explanatory copy anywhere on this screen.

**Riley (stress tester)**: clicking "Revisar Erros" repeatedly produces zero feedback — no disabled state, no toast, nothing — silently broken rather than visibly broken, the worst version of a dead CTA.

## Minor Observations

- `UnitSection.tsx:70` hardcodes `translateX(±32px)` zigzag inline via `style`, bypassing the Tailwind/`@theme` spacing scale (same pattern flagged on `apps/mobile`'s equivalent).
- `ExploreMoreCard` and `ChestProgressCard` both duplicate a near-identical Card+Icon+title+CTA composition — candidates for a shared subcomponent.
- Zero `TODO`/`FIXME`/stub markers in the reviewed tree (static evidence) — these are finished-and-shipped decisions, not scaffolding.
- This sandbox's `apps/web/.env.local` is missing Supabase credentials, which blocked any live rendering this pass — worth fixing locally so a future critique/live pass can actually screenshot the real page.

## Questions to Consider

- If "current lesson" is meant to feel like reward-adjacent momentum rather than plain navigation, should `DESIGN.md`'s color rule carve out an explicit exception for it — or is the orange simply wrong, on both platforms, independently?
- With `MAX_UNITS_SHOWN=1` and `ExploreMoreCard` replacing the old multi-track list, is a single-lesson-path Home still worth 5 preceding stat cards?
- Is "Revisar Erros" scoped for a later phase, or dead scaffolding that should be deleted now rather than shipped as a fake affordance — on both platforms?
