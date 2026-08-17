# Impeccable Audit — Home Surface (ArqLearn Mobile)

**Date**: 2026-08-17
**Scope**: `apps/mobile/src/app/(tabs)/index.tsx` + `src/components/home/*` + the shared UI primitives it depends on. Scored against `ios.md`/`android.md` (product is `adaptive`). Source-only audit — no simulator/emulator available in this environment.

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 1 | Most interactive elements have no `accessibilityLabel`/`accessibilityRole` — including the screen's primary CTA (`CurrentLessonNode`) and the `Button.tsx` primitive used app-wide |
| 2 | Performance | 3 | Loading state fix landed cleanly; only gap is `ThemeSelector`'s ~50-row `ScrollView` instead of a virtualized list |
| 3 | Appearance & Theming | 4 | Near-total token discipline confirmed; flat-by-default genuinely honored (zero shadow leakage outside `Toast.tsx`) |
| 4 | Platform Conformance | 2 | `android.predictiveBackGestureEnabled: false` with zero documented rationale anywhere in the repo |
| 5 | Adaptivity | 2 | Only `LearningMap` self-constrains for tablet; every other Home module stretches full-width on iPad despite `ios.supportsTablet: true` |
| **Total** | | **12/20** | **Acceptable (significant work needed)** |

## Platform Conformance Verdict

**Fails to fully clear the native bar — but not because it looks "web-ported."** Navigation is genuinely native (`expo-router`'s `Tabs`, native `RNModal`, `MaterialCommunityIcons` throughout, no HTML-shaped chrome). The failures here are subtler and more damaging for a screen-reader/keyboard-of-touch user: `android.predictiveBackGestureEnabled: false` (`apps/mobile/app.json:22`) turns off Android's system Back animation for the entire app with no comment, no `PENDENCIAS_MOBILE.md` note, nothing — the exact violation this audit's checklist names first ("predictive Back hijacked"). Layered on top of that, the app's own primary button primitive (`Button.tsx`) never sets `accessibilityRole="button"`, so every branded CTA in the app reads to VoiceOver/TalkBack as an unnamed generic element rather than a button. A fluent Android user would specifically notice the missing predictive-back animation; a screen-reader user would notice far more.

## Executive Summary

- Audit Health Score: **12/20 (Acceptable)**
- Issues found: **0 P0 / 4 P1 / 5 P2 / 4 P3**
- Top issues: (1) primary CTA and most `TopAppBar` controls have no accessible name, (2) `TopAppBar`'s stats-row `Pressable`s are far below the 44pt/48dp touch-target minimum, (3) `predictiveBackGestureEnabled: false` is undocumented, (4) zero `AccessibilityInfo.isReduceMotionEnabled` usage anywhere in `apps/mobile/src` despite two indefinite `Animated.loop`s on the Home loading path, (5) only `LearningMap` adapts for tablet — everything else stretches on iPad.
- The prior polish pass's fixes verified as landed: color-job recolor (`CurrentLessonNode`/`UnitSection` → primary blue, gems pill → secondary orange), `LoadingBlueprint`/`ErrorBanner` loading/error states, ghost "Revisar Erros" button, `AllDonePrompt`'s 600ms delay. Header density remains open, as flagged in the brief.

## Detailed Findings by Severity

### P1 — Major

**[P1] Primary CTA and most TopAppBar controls have no accessible name**
- **Location**: `CurrentLessonNode.tsx:35` (the `Pressable` wrapping the screen's single most important tap target — "Continuar lição"); `LessonNode.tsx:22-28` (checkpoint) and `:32-37` (completed); `ChestProgressCard.tsx:37`; `TopAppBar.tsx:41-47` (profile), `:54-56` (streak), `:57-59` (hearts), `:60-63` (gems)
- **Category**: Accessibility
- **Impact**: A VoiceOver/TalkBack user reaches these elements but hears nothing describing what they do or their current value (streak count, hearts remaining, gems balance, lesson state). The one element every session revolves around — "continue your lesson" — is silent.
- **Guideline**: iOS HIG / Material 3 — every interactive control must expose an accessible name and role.
- **Recommendation**: Add `accessibilityRole="button"` + a descriptive `accessibilityLabel` (e.g. `"Continuar lição, ${lessonTitle}"`, `"Sequência: ${streak} dias"`, `"Vidas: ${hearts}"`) to each. Also give `CurrentLessonNode`'s "Sem vidas" text (`:42-46`) an `accessibilityLiveRegion="polite"` or route it through `AccessibilityInfo.announceForAccessibility` (already used elsewhere in the codebase, e.g. `QuestionCard.tsx:48`) — right now it's a floating `Text`, never announced.
- **Suggested command**: `/impeccable harden`

**[P1] `Button.tsx` — the app's core CTA primitive — never sets `accessibilityRole`**
- **Location**: `apps/mobile/src/components/ui/Button.tsx:42-46`
- **Category**: Accessibility
- **Impact**: Every branded button in the app (all four variants) inherits this gap: `ExploreMoreCard`'s "Explorar trilhas," `DailyGoalCard`'s "Revisar Erros," both `AllDonePrompt` actions, `ErrorBanner`'s "Tentar novamente." None announce as a button to a screen reader.
- **Guideline**: iOS HIG / Material 3 — standard control roles must be exposed even for custom-styled controls.
- **Recommendation**: Add `accessibilityRole="button"` to the `Pressable` in `Button.tsx`. One-line fix, sitewide payoff — this is the single highest-leverage accessibility fix on the surface.
- **Suggested command**: `/impeccable harden`

**[P1] `TopAppBar` stats row: touch targets far below platform minimums**
- **Location**: `TopAppBar.tsx:54-63` (three bare `Pressable`s wrapping `StatPill`); `StatPill.tsx:29-34` (`row` style has no padding or `minHeight`)
- **Category**: Accessibility / Platform Conformance
- **Impact**: The rendered hit area is icon(18px)+text(28px line-height) with zero padding — roughly 28px tall, well under both iOS's 44pt and Android's 48dp minimums, with no `hitSlop` compensating (confirmed zero `hitSlop` usage anywhere in `src/components`). These are the streak/hearts/gems taps — three of the six controls stacked in the header.
- **Guideline**: iOS HIG "44×44 pt minimum"; Material 3 "48×48 dp minimum, 8dp between targets."
- **Recommendation**: Wrap each `StatPill` `Pressable` with `hitSlop={{top: 10, bottom: 10, left: 8, right: 8}}` at minimum, or give the `Pressable` an explicit `minHeight: 48` / `paddingVertical`.
- **Suggested command**: `/impeccable harden`

**[P1] `predictiveBackGestureEnabled: false` — undocumented**
- **Location**: `apps/mobile/app.json:22`
- **Category**: Platform Conformance
- **Impact**: Disables Android's predictive Back gesture (the swipe-preview animation) across the entire app. Repo-wide grep found zero comments, zero mentions in `Docs/PENDENCIAS_MOBILE.md`, zero rationale anywhere — this reads as an unexamined default flip, not a deliberate platform decision.
- **Guideline**: `android.md`: "System Back always works. Honor the predictive Back gesture... never trap the user or hijack the gesture." This is explicitly named as the #1 conformance check in this audit's checklist.
- **Recommendation**: Either re-enable it (the default, `true`) after confirming no navigation stack breaks under the predictive-back preview, or — if there's a genuine reason (e.g., a custom transition that predictive-back's live preview would visually corrupt) — document it inline in `app.json` and in `PENDENCIAS_MOBILE.md` so it reads as a decision, not an oversight.
- **Suggested command**: `/impeccable harden`

### P2 — Minor

**[P2] Zero Reduce Motion handling anywhere in the app**
- **Location**: `LoadingBlueprint.tsx:38-50` (two unconditional, indefinite `Animated.loop`s — `drawLoop`, `pulseLoop` — rendered on Home whenever `units === null`, `index.tsx:175-179`); `Modal.tsx:29` (`animationType="fade"`, unconditional, used by `AllDonePrompt`)
- **Category**: Accessibility
- **Impact**: A repo-wide grep for `AccessibilityInfo.isReduceMotionEnabled`/`AccessibilityInfo` found no usage tied to motion anywhere in `apps/mobile/src` (only an unrelated `announceForAccessibility` call in `QuestionCard.tsx`). RN has no OS-level "kill all animations" switch the way web CSS does — this has to be handled per-component, and currently isn't handled at all.
- **Guideline**: HIG/Material "honor Reduce Motion / Remove animations" — crossfade or instant-cut alternative required.
- **Recommendation**: Read `AccessibilityInfo.isReduceMotionEnabled()` once (e.g. in a small hook) and skip/shorten the `Animated.loop`s in `LoadingBlueprint`, and consider `animationType="none"` on `Modal` when Reduce Motion is on.
- **Suggested command**: `/impeccable harden`

**[P2] WCAG AA contrast failure on `Badge` neutral tone, compounded by dimming**
- **Location**: `Badge.tsx:16` (`neutral: { bg: colors.surfaceGray, fg: colors.outline }` → `#727780` on `#f3f4f6`); consumed by `UnitSection.tsx:36` (`construction: { label: "Em construção", tone: "neutral" }`)
- **Category**: Accessibility / Theming
- **Impact**: Computed contrast ≈ 4.09:1 against `#f3f4f6` — below the 4.5:1 AA floor for the 12px `labelCaps` text (too small to qualify as "large text"). It gets materially worse in practice: `UnitSection.tsx:43,88-90` wraps the entire construction-status section (badge included) in `opacity: 0.6`, which pulls both the badge's foreground and background toward the near-white screen background and shrinks the effective contrast further. Given PRODUCT.md's confirmed WCAG 2.1 AA commitment and "not audited yet" status, this is the first concrete numeric hit against that target.
- **Guideline**: WCAG 2.1 AA — 4.5:1 for normal text.
- **Recommendation**: Darken `colors.outline` for this specific text usage, or don't apply the 0.6 dim to the badge itself (dim the card body only, keep badge at full opacity).
- **Suggested command**: `/impeccable colorize`

**[P2] iPad: only `LearningMap` adapts, everything else stretches**
- **Location**: `LearningMap.tsx:14` (`maxWidth: 448, alignSelf: "center"`) vs. `index.tsx:199-202` (`content` style — no `maxWidth`, no centering) governing `TopAppBar`, `DailyGoalCard`, `LevelProgressCard`, the chest-card row, and `ExploreMoreCard`
- **Category**: Adaptivity
- **Impact**: `app.json:11` sets `ios.supportsTablet: true`, but on an iPad every Home module except the learning map itself stretches to the device's full width (minus the 24px `paddingHorizontal`) — over-wide cards, an elongated `ProgressBar`, a chest row with excessive gap between the two cards. This is the textbook "stretched phone layout" the Adaptivity checklist calls out, and it's inconsistent with `LearningMap`'s own documented `maxWidth: 448` fix.
- **Guideline**: iOS HIG adaptive layout — content should use size classes/`maxWidth`, not stretch unconditionally.
- **Recommendation**: Apply the same `maxWidth`/centering pattern `LearningMap` already uses to the whole `ScrollView` content container, or introduce a shared `HomeContent` wrapper.
- **Suggested command**: `/impeccable adapt`

**[P2] `IconButton` is 4dp short of Android's touch-target minimum**
- **Location**: `IconButton.tsx:30-36` (`base: { width: 44, height: 44 }`); used for Notifications in `TopAppBar.tsx:36-40`
- **Category**: Platform Conformance
- **Impact**: 44×44 exactly meets iOS's 44pt floor but sits under Android's 48×48dp floor. A borderline, single-platform miss.
- **Guideline**: `android.md`: "48×48 dp minimum."
- **Recommendation**: Bump to 48×48, or keep 44 visually and add `hitSlop={{top:2,bottom:2,left:2,right:2}}` to hit 48 on Android without changing the visual footprint.
- **Suggested command**: `/impeccable harden`

**[P2] TopAppBar header density — still open**
- **Location**: `TopAppBar.tsx` — brand row (`:30-49`, notifications + profile), theme row (`:50-52`), stats row (`:53-64`, streak/hearts/gems)
- **Category**: Platform Conformance / Adaptivity
- **Impact**: Confirmed still unresolved from the prior critique — six interactive targets stacked across three rows before any map content, four of which also carry the P1 labeling gap above and three of which also carry the P1 touch-target gap above. The density issue and the accessibility gaps compound each other: a screen-reader user has to traverse six unlabeled/undersized controls before reaching the primary task.
- **Guideline**: Both HIG (top app bar scope) and Material 3 (top app bar: single row of primary actions) expect a lighter header than three stacked rows.
- **Recommendation**: Collapse the stats row into the brand row where space allows, or move notifications/profile behind a single overflow affordance, as the prior critique suggested — now with more evidence it also blocks touch-target compliance.
- **Suggested command**: `/impeccable layout`

### P3 — Polish

**[P3] iPad orientation lock undocumented**
- **Location**: `app.json:7` (`"orientation": "portrait"`)
- **Category**: Adaptivity
- **Impact**: Reasonable for a phone-first quiz app, but combined with `supportsTablet: true` and no PRODUCT.md/DESIGN.md rationale, it reads as an unexamined default rather than a content-driven decision.
- **Recommendation**: Either document why portrait-only is correct for this content, or allow landscape on iPad specifically.
- **Suggested command**: `/impeccable document`

**[P3] `ThemeSelector`'s ~50-row catalog uses `ScrollView`, not a virtualized list**
- **Location**: `ThemeSelector.tsx:44` (`<ScrollView style={styles.list} ...>` wrapping `featured` + 10 semester groups)
- **Category**: Performance
- **Impact**: Not large enough to jank today, but it's the one un-virtualized "many items" list in the audited tree and will only grow as more themes are added.
- **Recommendation**: Swap to `FlatList`/`SectionList` if the catalog is expected to grow past ~100 entries.
- **Suggested command**: `/impeccable optimize`

**[P3] Hand-typed rgba duplicates a token instead of deriving from it**
- **Location**: `Modal.tsx:47` (`backgroundColor: "rgba(18, 28, 42, 0.4)"` — this is `colors.onSurface` (`#121c2a`) at 40% alpha, retyped by hand rather than derived from the token)
- **Category**: Theming
- **Impact**: Purely a maintainability nit — if `onSurface` ever changes, this overlay silently drifts out of sync. Not a user-facing bug.
- **Recommendation**: Compute the rgba from `colors.onSurface` at import time, or add a `colors.scrim` token.
- **Suggested command**: `/impeccable document`

**[P3] `Toggle.tsx` is an iOS-shaped switch on both platforms**
- **Location**: `apps/mobile/src/components/ui/Toggle.tsx:30-45` — not rendered on Home itself (used in `NotificationPreferencesPanel.tsx` and `QuizHeader.tsx`), but in scope as a shared primitive audited here
- **Category**: Platform Conformance
- **Impact**: A 44×24 pill track with a plain circular thumb reads as an iOS-style switch on Android too, rather than matching Material 3's switch shape (wider track, icon-in-thumb when checked). Low urgency since it doesn't appear on the audited screen, but worth fixing before more screens adopt it.
- **Recommendation**: Either accept it as a deliberate cross-platform brand control (document that choice in DESIGN.md) or branch to RN's native `Switch` per platform.
- **Suggested command**: `/impeccable shape`

## Patterns & Systemic Issues

- **Accessibility labeling is the exception, not the rule.** Across the whole `home` tree, only `LessonNode.tsx`'s "available"/"construction" variants and `ThemeSelector.tsx`'s trigger carry `accessibilityLabel`/`accessibilityRole`. Everything else — including the screen's single most important tap target — is silent. This traces to one root cause: `Button.tsx`, the shared primitive nearly everything else is built on or styled to match, never sets `accessibilityRole` itself, so the gap propagates by default rather than by omission at each call site.
- **The "disabled-Pressable-in-ScrollView" Android trap is consistently and correctly avoided** (`Button.tsx`, `IconButton.tsx`, `Toggle.tsx`, `ThemeSelector.tsx`'s `ThemeRow`, `ChestProgressCard.tsx` all document and sidestep it the same way) — this is a real, non-obvious platform bug the team caught once and then applied everywhere. Worth holding up as the template for how the accessibility-labeling fix above should also be applied consistently.
- **Token discipline is excellent and holds up under a second pass**: across every file read in this audit (10+ components beyond the original critique's scope), the only non-token color values are the one documented `Toast.tsx` shadow exception and `Modal.tsx`'s one hand-typed rgba (P3 above).

## Positive Findings

- All four fixes named in the brief as "already applied" verified as actually landed in code: `CurrentLessonNode.tsx:88` and `UnitSection.tsx:32-34` now use `primary` blue for the current-lesson state (with an explicit comment citing the One Job Per Color rule); `TopAppBar.tsx:62` gems `StatPill` now uses `tone="secondary"`; `index.tsx:174-180` wires `LoadingBlueprint`/`ErrorBanner` with a working retry (`setRetryToken`); `DailyGoalCard.tsx:33` "Revisar Erros" is `variant="ghost"`; `AllDonePrompt.tsx:38-40` uses a deliberate 600ms delay with a documented rationale.
- `AllDonePrompt` also gained a real refinement beyond what the critique asked for: `suppressAutoOpen` (`AllDonePrompt.tsx:17,34`) prevents it from fighting `StreakAtRiskPrompt` for the same modal slot — a thoughtful fix to a real interaction bug, not just the delay.
- Flat-by-default is genuinely honored: zero `shadowColor`/`elevation` outside `Toast.tsx`'s documented transient-overlay exception, confirmed across every file in this pass.
- Icon set consistency is total — every icon in the audited tree routes through `Icon.tsx`'s single `MaterialCommunityIcons` mapping table, no stray icon sources.
- Text scaling is unguarded in the good sense: zero `allowFontScaling={false}` anywhere in `apps/mobile/src`, so Dynamic Type / Android font-scale genuinely works by RN's default behavior across the whole surface.
- Native navigation is correct: `(tabs)/_layout.tsx` uses `expo-router`'s `Tabs` (native bottom tab bar), not a custom-built one.

## Recommended Actions

1. **[P1] `/impeccable harden`**: Add `accessibilityRole="button"` to `Button.tsx`'s `Pressable` (one-line, sitewide payoff), then add labels/roles to `CurrentLessonNode`, `LessonNode`'s completed/checkpoint variants, `ChestProgressCard`, and `TopAppBar`'s profile/streak/hearts/gems `Pressable`s.
2. **[P1] `/impeccable harden`**: Fix `TopAppBar`'s stats-row touch targets (streak/hearts/gems `Pressable`s at ~28px tall) with `hitSlop` or explicit `minHeight`.
3. **[P1] `/impeccable harden`**: Resolve `predictiveBackGestureEnabled: false` in `app.json` — re-enable it, or document the specific reason it's off.
4. **[P2] `/impeccable harden`**: Add basic Reduce Motion handling (`AccessibilityInfo.isReduceMotionEnabled`) to `LoadingBlueprint`'s loops and `Modal`'s fade transition.
5. **[P2] `/impeccable colorize`**: Fix the `Badge` neutral-tone contrast failure and its interaction with `UnitSection`'s 0.6 dim.
6. **[P2] `/impeccable adapt`**: Constrain Home's content width on tablets to match `LearningMap`'s existing `maxWidth: 448` pattern.
7. **[P2] `/impeccable harden`**: Bump `IconButton` to 48×48 (or add `hitSlop`) for Android compliance.
8. **[P2] `/impeccable layout`**: Address `TopAppBar`'s six-target header density, now that it also blocks touch-target and labeling compliance.
9. **[P3] `/impeccable optimize`** / **`/impeccable document`** / **`/impeccable shape`**: `ThemeSelector` list virtualization, `Modal`'s rgba token drift, and `Toggle`'s cross-platform shape decision, in any order.
10. **`/impeccable polish`**: Final pass once the above land, to re-verify token/motion/contrast consistency across the changes.
