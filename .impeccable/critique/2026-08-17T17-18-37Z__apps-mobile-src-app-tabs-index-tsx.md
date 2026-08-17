---
target: Home / Learning Map screen (apps/mobile)
total_score: 19
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-08-17T17-18-37Z
slug: apps-mobile-src-app-tabs-index-tsx
---
Method: dual-agent (A: a13bc7c3fa91c7898 · B: aa8ca6270ec16d345)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | `units` stays `null` with no loading UI while tracks/lessons fetch (`index.tsx:165`); no error state on fetch failure |
| 2 | Match System / Real World | 3 | Clear PT-BR copy, logical "Continuar lição" callout |
| 3 | User Control and Freedom | 2 | `AllDonePrompt` self-opens via a 0ms timeout on every qualifying visit, no permanent opt-out |
| 4 | Consistency and Standards | 2 | Violates the project's own "One Job Per Color" rule twice (current-lesson node in orange, gems pill in blue) |
| 5 | Error Prevention | 2 | "Revisar Erros" renders as a live primary button whose `onPress` only toasts "not available yet" |
| 6 | Recognition Rather Than Recall | 3 | States are visually encoded (badges, borders); nothing to memorize |
| 7 | Flexibility and Efficiency | 3 | `CurrentLessonNode` callout is a real accelerator; no other repeat-user shortcuts |
| 8 | Aesthetic and Minimalist Design | 2 | Six stacked modules (header rows, goal card, level card, two chest cards) precede the map |
| 9 | Error Recovery | 1 | No error UI anywhere in `index.tsx`'s `load()` |
| 10 | Help and Documentation | n/a | Operate-mode app screen — no contextual help expected here |
| **Total** | | **19/36** | **Acceptable (53%)** |

## Design Specificity Verdict

**LLM assessment**: Strip the color tokens and this screen is a generic Duolingo clone — circular path nodes, streak/hearts/gems/chests, checkpoint trophies. The "Digital Drafting Table" personality `DESIGN.md` promises (blueprint-grid texture, technical corner marks, drafting accents) lives almost entirely in `LoadingBlueprint.tsx`'s fullscreen variant and is nearly absent from Home itself. On-theme touches are thin: the compass `logo` glyph, the `hammer-wrench` pun for "construction" lessons. Everything else — layout, mechanics, iconography — could ship under any gamified-quiz brand unchanged.

**Deterministic scan**: The bundled HTML/CSS detector (`detect.mjs`) found 0 scannable files, as expected for a React Native/TypeScript target — this detector doesn't apply to native code, which is a real, reported outcome, not a skipped step. In its place, Assessment B ran targeted static greps that turned two of Assessment A's qualitative calls into hard numbers:
- **Confirms the "flat by default" strength**: only 2 `shadowColor`/`elevation` occurrences across the whole Home tree, both in `Toast.tsx` (a transient overlay — the one documented, earned exception in `DESIGN.md`). Zero shadow leakage into resting surfaces.
- **Quantifies the Sam/accessibility red flag**: 16 `Pressable` instances in the Home tree, only 10 `accessibilityLabel`/`accessibilityRole`/`accessible=` occurrences total, and `CurrentLessonNode.tsx`, `ChestProgressCard.tsx`, all 4 `Pressable`s in `TopAppBar.tsx`, `Button.tsx`, and both `Pressable`s in `Modal.tsx` have **zero** matching accessibility attributes. Against a confirmed WCAG 2.1 AA target with zero accessibility testing done to date, this is the single most measurable gap on the screen.
- Zero inline hex colors leaking outside `theme/tokens.ts` in this tree (one exception, `Toast.tsx`'s `"#000"` shadow color — same file as the shadow exception). Zero `TODO`/`FIXME`/stub markers.

**Visual overlays**: Not applicable — no dev server was started for this pass (native RN screen, not a web build); browser/`detect.js` overlay injection was explicitly skipped rather than attempted and silently dropped.

## Overall Impression

The screen is structurally sound and mechanically correct — loading states aside, nothing is actually broken — but it reads as competent gamification-app boilerplate wearing ArqLearn's palette, not a screen authored around "the digital drafting table." The single biggest opportunity: the screen's own design system has a strict, well-articulated color grammar (blue=navigate, orange=reward, green=success) and the Home screen — its highest-traffic surface — currently breaks that grammar on its two most-looked-at elements (the current-lesson node and the gems counter).

## What's Working

- `variantFor`/`unitStatusFor` (`index.tsx:31-48`) honestly distinguish "available out of order" from "under construction" instead of faking a locked-sequence gate that doesn't reflect real content state.
- The dashed `construction` node (`LessonNode.tsx:94-104`) is an exact, correct implementation of `DESIGN.md`'s "dashed signals not-yet-buildable, not locked" rule — and the checkpoint diamond (45° rotation, counter-rotated icon) is the one documented shape break, built precisely as specified.
- Flat-by-default is genuinely honored: static evidence confirms zero shadow leakage outside the one documented exception (`Toast.tsx`).

## Priority Issues

- **[P1] Color-job violation on the screen's hero element.** `CurrentLessonNode.tsx:82-97` and the "Em andamento" `UnitSection` badge (`UnitSection.tsx:32`) render the *current-lesson navigation state* in `colors.secondary` (orange — reserved for gamification/reward per `DESIGN.md`'s Named Rule), while `TopAppBar`'s gems `StatPill` (`TopAppBar.tsx:61`) uses `tone="primary"` (blue) for a reward currency — the inverse mistake.
  **Why it matters**: this is the exact rule the design system exists to enforce, broken on the two elements a student looks at most on the highest-traffic screen in the app — it quietly erodes the "blue=learn, orange=win" mental model the whole system is built on.
  **Fix**: recolor the current-lesson node/badge to `primary` with a new documented "current" treatment (distinct border/fill, not yet in `DESIGN.md` — add it), and switch the gems pill to `tone="secondary"`.
  **Suggested command**: `/impeccable audit` (to catch further token-vs-usage drift) or direct fix via `/impeccable polish`.

- **[P1] Silent loading/error gap.** `{units && <LearningMap units={units} />}` (`index.tsx:165`) renders nothing while `listTracks`/`listTrackLessons` are in flight and nothing on failure — confirmed by both assessments (A found the code path, B found no loading-state handling in the surrounding files).
  **Why it matters**: the very first thing a student sees each session is either instant content or a blank screen with no indication anything is happening — worst case on a slow connection, this reads as a broken app.
  **Fix**: show `LoadingBlueprint` (already built for this exact use, currently unused here) while `units === null`; add a catch with a retry affordance.
  **Suggested command**: `/impeccable harden`

- **[P2] Dead-end primary CTA.** `DailyGoalCard`'s "Revisar Erros" always renders as a solid primary-styled `Button` whose `onPress` only fires a "not available yet" toast (`DailyGoalCard.tsx:30-36`).
  **Why it matters**: a fully-styled, always-enabled primary action that does nothing real trains users to distrust the app's buttons.
  **Fix**: ship as visually disabled/ghost until the feature exists, or hide it entirely.
  **Suggested command**: `/impeccable clarify`

- **[P2] Auto-opening modal on landing.** `AllDonePrompt` fires unconditionally via a 0ms `setTimeout` on every qualifying visit (`AllDonePrompt.tsx:34-39`), with only a session-scoped dismissal, no permanent opt-out.
  **Why it matters**: an unsolicited interruption on arrival undercuts the one celebratory beat this screen has (peak-end rule) by making it feel like a nag instead of an earned moment.
  **Fix**: gate behind an explicit trigger, or require one user action (e.g. a scroll or tap) before firing.
  **Suggested command**: `/impeccable onboard`

- **[P3] Header density.** Six interactive targets (notifications, profile, theme trigger, streak, hearts, gems) stack across `TopAppBar` before any map content — all six confirmed as `Pressable`s by Assessment B, four of them with zero accessibility attributes.
  **Why it matters**: pushes the cognitive-load checklist's "minimal choices" and "single focus" items into failure territory before the primary task (start a lesson) is even visible.
  **Fix**: collapse stats into one row, or defer notifications/profile behind a single overflow affordance.
  **Suggested command**: `/impeccable layout`

## Persona Red Flags

**Casey (Distracted Mobile User)**: Six header targets register before any content does — no obvious single next action at a glance. "Revisar Erros" is a trained tap-trap that does nothing real, exactly the kind of dead end that burns Casey's limited patience.

**Jordan (Confused First-Timer)**: `ThemeSelector`'s modal lists roughly 50 themes across 10 semester groups, many rendered at 0.5 opacity/disabled (`ThemeSelector.tsx:50-57`) — a wall-of-options moment on session one, well past the ≤4-items working-memory guidance.

**Sam (Accessibility-Dependent, WCAG 2.1 AA is a confirmed but unaudited target)**: Static evidence makes this concrete — 16 `Pressable`s in the Home tree, only 10 accessibility-attribute occurrences total, and `CurrentLessonNode`, `ChestProgressCard`, all of `TopAppBar`'s four targets, `Button`, and `Modal` have **zero** matching attributes. A screen-reader user gets no announcement when, for example, `CurrentLessonNode`'s "Sem vidas" failure state renders (`CurrentLessonNode.tsx:42-46`) — it's a floating `Text`, not a live region.

## Minor Observations

- `radius="xl"` vs `"lg"` used inconsistently across similarly-weighted cards.
- Zig-zag `translateX: ±32` magic numbers duplicated inline (`UnitSection.tsx:67`) instead of tokenized.
- `noHearts` text positioned at `top: 92` risks overlapping the next node given only a 32px path gap.
- `MAX_UNITS_SHOWN = 1` means the "Learning Map" only ever shows one track at a time — worth confirming this is intentional pacing, not a placeholder limit.
- Zero `TODO`/`FIXME`/stub markers in the reviewed tree (static evidence) — the code here is not provisional scaffolding, these are finished-and-shipped decisions worth taking seriously as such.

## Questions to Consider

- If orange is "exclusively" gamification, why is the biggest tap target on the screen — the lesson-start node — orange?
- With `MAX_UNITS_SHOWN=1`, is this still a "map," or a single lesson strip wearing the map's visual grammar?
- Given zero accessibility testing exists against a confirmed AA target, shouldn't Home — the first screen every session — be the pilot audit surface before more screens ship on the same unaudited patterns?
