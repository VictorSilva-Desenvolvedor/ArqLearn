---
name: ArqLearn Mobile
description: The Digital Drafting Table — architectural precision meets gamified learning, on iOS and Android
colors:
  surface: "#f8f9ff"
  surface-dim: "#d0dbed"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eff4ff"
  surface-container: "#e6eeff"
  surface-container-high: "#dee9fc"
  surface-container-highest: "#d9e3f6"
  surface-gray: "#f3f4f6"
  blueprint-grid: "#e5e7eb"
  on-surface: "#121c2a"
  on-surface-variant: "#42474f"
  inverse-surface: "#27313f"
  inverse-on-surface: "#eaf1ff"
  outline: "#626b76"
  outline-variant: "#c2c7d0"
  surface-tint: "#34618f"
  primary: "#0e4471"
  on-primary: "#ffffff"
  primary-container: "#2e5c8a"
  on-primary-container: "#b2d4ff"
  primary-fixed: "#d1e4ff"
  primary-fixed-dim: "#9fcafe"
  secondary: "#8f4e0f"
  on-secondary: "#ffffff"
  secondary-container: "#fda864"
  on-secondary-container: "#753c00"
  secondary-fixed: "#ffdcc4"
  tertiary: "#004e10"
  on-tertiary: "#ffffff"
  tertiary-container: "#156820"
  on-tertiary-container: "#92e58c"
  tertiary-fixed: "#a3f69c"
  on-tertiary-fixed-variant: "#005312"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#f8f9ff"
  on-background: "#121c2a"
  muted-text: "#6b7280"
typography:
  display:
    fontFamily: "HankenGrotesk_700Bold"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
  headline:
    fontFamily: "HankenGrotesk_700Bold"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
  question:
    fontFamily: "HankenGrotesk_600SemiBold"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "Inter_400Regular"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "JetBrainsMono_500Medium"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.6px"
  statsNum:
    fontFamily: "JetBrainsMono_700Bold"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-gamification:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
---

# Design System: ArqLearn Mobile

## Overview

**Creative North Star: "The Digital Drafting Table"**

ArqLearn's mobile app merges the professional precision of architectural practice with the
dopamine-driven engagement of gamified learning. The personality is educational and authoritative,
but never dry — it stays motivating for students grinding a daily streak. This is the same
"Blueprint Narrative" system shared with `apps/web` (`Docs/stitch_app_visual_identity/blueprint_narrative/DESIGN.md`
is the cross-platform source; this file is the mobile-specific, RN-verified expression of it).

The visual style hybridizes **Modern Minimalism** and **Technical Brutalism**: heavy whitespace and
clean layouts, punctuated by "Drafting Accents" — thin technical strokes, monospaced numerals, and a
subtle blueprint-grid tone. Unlike typical gamified apps that lean into soft, bubbly shapes, this
system stays sharp and structured on purpose — the app never lets "play" undermine "educational."
React Native has no `filter: blur()`; where the web uses blur for map fog/depth effects, mobile
approximates the same read with semi-transparent tonal overlays instead of a new native dependency —
consistent with the system's flat, tonal-layering philosophy rather than a compromise.

**Key Characteristics:**
- Sharp, structured geometry — never bubbly or soft-gamified
- Flat by default: depth comes from tonal fills and 1–2px borders, not shadows
- One color per job: blue = learning/navigation, orange = gamification, green = success — never mixed
- Monospaced numerals (JetBrains Mono) for anything that counts (XP, streak, stats)

## Colors

The palette is anchored by **Primary Blue**, used for navigation, structural chrome, and the "in
progress" state — it reads as trust and focus, not decoration.

### Primary
- **Primary Blue** (`#0e4471`): navigation bars, primary buttons, selected/current states (answer
  cards, lesson nodes, focused inputs). Carries `on-primary` white text at full contrast.
- **Primary Fixed** (`#d1e4ff`): the light tint fill behind a selected answer card, paired with the
  2px primary border — never used as a standalone background.

### Secondary
- **Secondary Orange** (`#8f4e0f` text-on, `#fda864` container): the "Gamification Layer,"
  reserved exclusively for XP, streaks, and reward CTAs. Never appears in navigation or structural
  chrome — that separation is the point: blue means "learning," orange means "winning."

### Tertiary
- **Tertiary Green** (`#004e10` text-on, `#a3f69c` fixed): the "Validation Layer" — correct answers,
  completed lessons, success states only.

### Neutral
- **Surface** (`#f8f9ff`): app background, kept near-white to maximize reading contrast.
- **Surface Gray** (`#f3f4f6`) / **Blueprint Grid** (`#e5e7eb`): card backgrounds and hairline
  borders — the "drafting paper" texture, always subtle, never competing with content.
- **On Surface** (`#121c2a`): primary text. **Muted Text** (`#6b7280`): secondary/meta text.
- **Outline** (`#626b76`, darkened from `#727780` on 2026-08-17 — `/impeccable audit` measured the
  original failing WCAG AA's 4.5:1 text-contrast minimum as the `Badge` "neutral" tone's foreground,
  e.g. the "Em construção" label; `apps/web`'s identical token got the same fix): the one place this
  token is used as *text*, not border. **The token fix alone wasn't enough**: a re-audit found the
  only real usage in Home (`UnitSection`'s "Em construção" badge) sits inside a 0.6-opacity dimmed
  wrapper, dropping effective contrast to ~2.3:1 even with the darker token. Fixed by scoping the
  dim to the card/path only (`UnitSection.tsx`) — the badge itself is never dimmed now. **Rule**: a
  color-token fix isn't verified until you check every real call site's *rendered* state, not just
  the component's default state.
- **Outline Variant** (`#c2c7d0`, unchanged): default 1px border on unselected cards and inputs —
  not yet audited for contrast on mobile (`apps/web`'s equivalent border token *was* darkened after
  failing 3:1 non-text contrast; don't assume mobile passes just because it wasn't flagged yet).

### Named Rules
**The One Job Per Color Rule.** Blue is structural/navigational, orange is exclusively gamification
reward, green is exclusively success/validation. A card never borrows orange or green for anything
but their assigned job — mixing them breaks the mental model the whole system depends on.

## Typography

**Display/Headline Font:** Hanken Grotesk (`HankenGrotesk_700Bold` / `_600SemiBold`)
**Body Font:** Inter (`Inter_400Regular` / `_700Bold`)
**Label/Mono Font:** JetBrains Mono (`_500Medium` / `_700Bold`)

**Character:** Hanken Grotesk carries headlines and quiz questions with a clean, geometric,
professional-but-approachable voice; Inter handles all body copy for legibility at small mobile
sizes; JetBrains Mono is a deliberate technical accent for labels and any gamified counter, so
numbers read as data, not prose, and don't jitter horizontally as they animate.

### Hierarchy
- **Display** (700, 28/36): screen-level headlines (rare on mobile — most screens use Headline).
- **Headline** (700, 24/32): section titles, quiz size-`lg` buttons.
- **Question** (600, 20/28 large · 18/24 small): quiz question text specifically — distinct weight
  from Headline so questions read as "the task," not chrome.
- **Body** (400, 16/24 large · 15/22 medium · 14/20 small): all instructional/UI copy; bold variants
  (700) at the same sizes for emphasis inside body text.
- **Label** (500, 12/16, +0.6px tracking, uppercase): metadata and category tags — always JetBrains
  Mono, always tracked out.
- **Stats Num** (700, 22/28): any gamified counter (XP, streak, accuracy) — always JetBrains Mono
  Bold, never the body font.

### Named Rules
**The Mono-Counts Rule.** Anything the user is meant to watch go up (XP, streak days, accuracy %)
renders in `statsNum` (JetBrains Mono Bold), never in Hanken Grotesk or Inter — the monospaced
digits are what make the number read as "data" and keep it from reflowing during count-up animation.

## Layout

4px baseline grid. Mobile screens use a 16px side margin with an 8px gutter; the whole Home screen
(header included, as of 2026-08-17 — `TopAppBar` was a stretched-on-iPad gap the first tablet fix
missed) constrains to `maxWidth: 448` and centers itself, keeping the path readable on tablets
instead of stretching edge to edge. Spacing groups by relationship, not by uniform rhythm: a question and its
diagram sit at `xs` (8px), while answer cards below are separated by `md` (16px) — tighter spacing
signals "these belong together."

## Elevation & Depth

Flat by default — no `shadowColor`/`elevation` anywhere in the component set except the transient
`Toast` (a floating, temporary element earns the one exception). Depth comes from **tonal layering**
and **technical outlines** instead:

- Default cards/inputs: a 1px `outline-variant` border on a `surface-bright`/`surface-gray`
  background.
- Active/selected state: the border thickens to 2px `primary` (or `tertiary`/`error` for
  revealed-correct/incorrect) with a matching fixed-tint fill — never a shadow or scale bump.
- The "Gamification CTA" button variant fakes physical presence with a 4px `borderBottomWidth` in a
  darker shade of its own color (a drafting-table "pressable" cue) rather than a drop shadow.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. The only two escapes from flat are (1) a
transient overlay like Toast, and (2) a heavier bottom border on gamification CTAs to read as
physically pressable — never a generic shadow reached for out of habit.

## Shapes

- **Level 1 — sharp (`radius.sm`, 4px):** none currently in use on mobile; reserved for dense
  functional elements (inputs, chips) per the shared Blueprint Narrative system.
- **Level 2 — standard (`radius.md`, 12px):** answer cards, content modules.
- **Level 3 — hero (`radius.lg`–`xl`, 16–24px):** primary/gamification/ghost buttons all round to
  24px — **confirmed via `/impeccable document apps/web`: this actually agrees with `apps/web`**
  (`rounded-xl`, same 24px token), so buttons are not a real cross-platform gap. Corrected
  2026-08-17 — an earlier version of this file guessed the shared narrative doc's "12px" prose was
  the live web value without checking web's code; it wasn't.
- **Real platform gap, answer cards specifically:** mobile's `AnswerOption` uses `radius.md` (12px);
  web's equivalent uses `rounded-lg` (16px). This one is real — see `apps/web/DESIGN.md`'s Shapes
  section for the same note from the other side. Not resolved here; flag for a deliberate decision
  before either side copies the other.
- **Circular lesson nodes:** completed/available/construction nodes are perfect circles (`radius:
  32` on a 64×64 box); the **checkpoint node** is a square rotated 45° (a diamond) with its icon
  counter-rotated to stay upright — the one deliberate break from the circle language, marking
  checkpoints as structurally distinct stops on the path.

## Components

### Buttons
- **Shape:** 24px radius (pill-leaning) — see Shapes note above on the 12px-vs-24px platform gap.
- **Primary:** solid `primary` fill, 2px `primary` border, white text, bold label.
- **Gamification:** `secondary-container` fill, 4px `secondary` bottom border (pressable cue), no
  top/side border.
- **Ghost:** transparent fill, 2px `primary` border, `primary` text.
- **Danger:** solid `error` fill, 2px `error` border, white text.
- **Pressed / Disabled:** pressed drops opacity to 0.85, disabled to 0.5. Disabled is intentionally
  *not* wired through RN's native `Pressable` `disabled` prop — inside a `ScrollView` a disabled
  `Pressable` on Android traps the scroll gesture (reproduced live on device); the block happens at
  the `onPress` handler instead, with `accessibilityState.disabled` still set for screen readers.

### Answer Cards (Quiz)
- **Default:** 1px `outline-variant` border, `surface-bright` background, `radius.md` (12px).
- **Selected (unverified):** 2px `primary` border, `primary-fixed` tint fill.
- **Revealed correct:** 2px `tertiary` border, `tertiary-fixed` fill, dedicated success icon —
  never color alone, so the state reads without relying on red/green color perception.
- **Revealed incorrect:** 2px `error` border, `error-container` fill, dedicated cancel icon.
- **Revealed, not selected:** 1px `outline-variant`, 0.6 opacity — visibly de-emphasized.
- Minimum 60px touch height per the Blueprint Narrative spec.

### The Learning Map (Signature Component)
Nodes read as an "Urban Site Plan," not a cartoon path: circular nodes (64px) for
completed/available/in-construction lessons, connected by a technical `PathConnector`, with a
diamond checkpoint node marking major stops. States are color + border only (no shadow): `completed`
and `available` both use a `primary` 2px border, differing by fill (`primary` solid vs.
`surface-bright`); `construction` uses a dashed `outline-variant` border on `surface-gray` — dashed
specifically signals "not yet buildable" rather than "locked," since there's no real prerequisite
gating it.

**Current lesson (`CurrentLessonNode`):** a larger (84px) circular node with a `primary`-filled face
and ring, on a `surface-bright` gap border — same "navigation" color as `completed`/`available`, just
heavier, since this is still the map's structural progression state, not a reward. Its floating
callout bubble ("Continuar lição") uses a `primary` border/text/arrow to match. Fixed 2026-08-17: this
previously rendered in `secondary` (orange), which read as a gamification reward and broke the One
Job Per Color Rule on the screen's single most-looked-at element — see `/impeccable critique` snapshot
`.impeccable/critique/2026-08-17T17-18-37Z__apps-mobile-src-app-tabs-index-tsx.md`.

### Inputs / Fields
No dedicated mobile input component observed beyond form fields inside settings/upload flows;
inherits the shared system's 1px border → `primary` border-on-focus, `radius.sm` (6px) treatment.
Document further once a dedicated `TextField` component exists.

## Do's and Don'ts

### Do:
- **Do** keep orange strictly to XP/streak/reward surfaces — it's the visual signal for
  "gamification," and diluting it into general UI removes the signal.
- **Do** pair every color-coded correct/incorrect state with a distinct icon, never color alone.
- **Do** use `statsNum` (JetBrains Mono Bold) for every counter the user watches change.
- **Do** keep lesson-map nodes flat (border + fill only) — the diamond checkpoint is the one
  allowed shape break, not a precedent for more.

### Don't:
- **Don't** add `shadowColor`/`elevation` to a resting surface — flat is the resting state; the only
  earned exceptions are transient overlays (Toast) and the gamification CTA's bottom border.
- **Don't** wire a `Pressable` inside a `ScrollView` through the native `disabled` prop — it traps
  Android's scroll gesture; block in the handler and set `accessibilityState` instead.
- **Don't** silently reconcile the button-radius gap between mobile (24px) and the shared spec
  (12px) by copying one value over the other without a design decision — flag it via
  `/impeccable audit` or `document` instead.
