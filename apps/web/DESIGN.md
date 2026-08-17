---
name: ArqLearn Web
description: The Digital Drafting Table — architectural precision meets gamified learning, plus a teacher's-eye view neither native client has
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
  blueprint-grid: "#b4bcc7"
  on-surface: "#121c2a"
  on-surface-variant: "#42474f"
  inverse-surface: "#27313f"
  inverse-on-surface: "#eaf1ff"
  outline: "#727780"
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
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#f8f9ff"
  on-background: "#121c2a"
  muted-text: "#6b7280"
typography:
  display:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "28px"
    lineHeight: "36px"
  headline:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "24px"
    lineHeight: "32px"
  question:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "20px"
    lineHeight: "28px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    lineHeight: "24px"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    lineHeight: "16px"
  statsNum:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "22px"
    lineHeight: "28px"
rounded:
  sm: "0.25rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  container-max: "1120px"
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

# Design System: ArqLearn Web

## Overview

**Creative North Star: "The Digital Drafting Table"**

Same system as `apps/mobile` — this is the browser expression of the shared "Blueprint Narrative"
tokens (`Docs/stitch_app_visual_identity/blueprint_narrative/DESIGN.md`), ported to Tailwind v4 via
`@theme` in `src/app/globals.css` rather than reimplemented. The personality is educational and
authoritative without being dry; the hybrid of Modern Minimalism and Technical Brutalism shows up
literally on `<body>` here in a way mobile can't replicate: a real 24×24px blueprint-grid background
image (`--color-blueprint-grid`), always on, everywhere — the single most on-theme decision in either
codebase.

Web carries one thing mobile explicitly doesn't: a Teacher Panel (`(teacher)/painel`, `(teacher)/revisao`)
and an internal admin surface (`admin/bugs`). Per the shared narrative doc, the Teacher Dashboard is
meant to shift the whole system toward "Density-First" — tighter padding, data-heavy tables — a
deliberate departure from the spacious student-facing world, not an oversight if it reads denser.

**Key Characteristics:**
- Sharp, structured geometry — never bubbly or soft-gamified
- The literal blueprint grid lives on `<body>` here — mobile only approximates it in
  `LoadingBlueprint`'s fullscreen variant
- One color per job: blue = learning/navigation, orange = gamification, green = success — never mixed
- `prefers-reduced-motion` is handled globally (`globals.css:218-227`), collapsing every
  transition/animation to ~0 — genuinely accessibility-aware, ahead of `apps/mobile` on this axis

## Colors

Identical palette and role split to `apps/mobile/DESIGN.md` — see that file for the full per-color
breakdown; not duplicated here since the two are one system by construction (`@theme` and
`theme/tokens.ts` are manually kept in sync from the same source).

### Named Rules
**The One Job Per Color Rule.** Blue is structural/navigational, orange is exclusively gamification
reward, green is exclusively success/validation.

## Typography

Same three-family pairing as mobile (Hanken Grotesk / Inter / JetBrains Mono), consumed via Tailwind's
`font-display`/`font-body`/`font-label` and the named `text-*` sizes in `@theme` rather than RN style
objects. Same Mono-Counts doctrine applies.

### Named Rules
**The Mono-Counts Rule.** Anything the user watches go up (XP, streak, accuracy) renders in
`text-stats-num` + `font-label` (JetBrains Mono), never the body or display font.

## Layout

4px baseline grid, `--spacing-container-max: 1120px` caps content width on wide viewports (the value
mobile's `LearningMap` approximates locally with `maxWidth: 448` for its narrower context). Side
margins expand from mobile's 16px to a wider gutter at desktop breakpoints per the shared spec. The
Teacher Dashboard route group is the one place `sm` (12px) padding is the *default* rather than the
exception — genuinely denser by design, not a violation of the spacing rhythm.

## Elevation & Depth

Tonal-layering-and-outline at rest; `globals.css` defines `--shadow-gamified` precisely as the
narrative doc's spec — a soft, low-blur, primary-blue-tinted ambient shadow, reserved for critical
gamified elements (`LessonNode.tsx`'s `completed`/`checkpoint` variants use it correctly). Fixed
2026-08-17: `Button.tsx`'s `primary` variant, `Modal.tsx`, and `DropdownMenu.tsx` all carried bare
Tailwind `shadow-sm`/`shadow-lg` — removed from all three (`Modal`/`DropdownMenu` already had a 2px
border doing the actual separation job; the shadow was redundant, not load-bearing).

Two **documented, earned exceptions** remain, both transient/floating elements with no border of
their own to lean on: `Toast.tsx`'s `shadow-lg` (a pill floating over real content, no overlay
behind it) and `Toggle.tsx`'s `shadow-sm` (the switch knob's own definition against its track). Ask
before removing either — they're a deliberate call, not leftover drift, the same way
`apps/mobile`'s `Toast` is the one earned shadow exception on that platform.

### Shadow Vocabulary
- **`shadow-gamified`** (`0 4px 6px -1px rgba(14,68,113,.1), 0 2px 4px -1px rgba(14,68,113,.06)`):
  the only sanctioned *ambient* shadow — soft, blue-tinted. Reserved for completed/checkpoint map
  nodes and the in-progress unit card.
- **`shadow-lg`** on `Toast.tsx` and **`shadow-sm`** on `Toggle.tsx`'s knob: earned exceptions for
  transient/floating elements without their own border to define depth. Not to be copied elsewhere.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest; the only earned depth is `shadow-gamified`
on the specific elements named above, or a shadow on a genuinely transient/floating element with no
border of its own — never a generic Tailwind shadow utility added to a resting, bordered surface.

## Shapes

- **Level 1 — sharp (`rounded-sm`, 4px):** reserved for dense functional elements (inputs, chips) per
  the shared system; not yet observed in a dedicated web component.
- **Level 2 — standard (`rounded-md`, 12px):** `Card`'s default-adjacent option, content modules.
- **Level 3 — hero (`rounded-lg`–`xl`, 16–24px):** `Card`'s actual default is `rounded-lg` (16px);
  all `Button` variants round to `rounded-xl` (24px).
- **Buttons agree with mobile.** Confirmed live: `apps/mobile`'s `Button` also rounds to 24px — the
  two platforms match here. An earlier pass mistakenly assumed the shared narrative doc's "12px
  radius" prose (written before either implementation) was web's live value; it wasn't. Corrected in
  `apps/mobile/DESIGN.md` on 2026-08-17.
- **Real gap, answer cards specifically:** web's `AnswerOption` uses `rounded-lg` (16px);
  `apps/mobile`'s equivalent uses `radius.md` (12px). This one is genuine — not yet resolved on either
  side; a deliberate call is owed before either platform silently copies the other's value.

## Components

### Buttons
- **Shape:** `rounded-xl` (24px), matching `apps/mobile`.
- **Primary:** `bg-primary` fill, 2px `border-primary`, white text, bold label, `hover:bg-primary-container`
  — no shadow (the stray `shadow-sm` this used to carry was removed 2026-08-17; matches mobile now).
- **Gamification:** `bg-secondary-container`, 4px `border-b-secondary`, and a real press affordance
  mobile can't express in CSS: `active:translate-y-1 active:border-b-0` — the border visually
  "collapses" as the button is pressed, selling the drafting-table "physical placement" feel harder
  than mobile's opacity-only press state.
- **Ghost:** transparent, 2px `border-primary`, `hover:bg-surface-container`.
- **Danger:** `bg-error`, 2px `border-error`, `hover:opacity-90`.

### Answer Cards (Quiz)
- **Default:** 1px `border-outline-variant`, `bg-surface-bright`, `rounded-lg` (16px — see the Shapes
  gap noted above).
- **Selected (unverified):** 2px `border-primary`, `bg-primary-fixed`.
- **Revealed correct / incorrect:** 2px `border-tertiary`/`bg-tertiary-fixed` or
  `border-error`/`bg-error-container`, plus a dedicated icon — color is never the only signal.
- **Focus:** `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-primary` — real, themed keyboard focus. Worth porting the same explicit
  focus treatment to `apps/mobile`'s equivalent once RN's focus-visible story is worked out; mobile
  currently has no equivalent documented state.

### Cards / Containers
- **Corner style:** `rounded-lg` (16px) by default, `md`/`xl` available per instance.
- **Background:** `bg-surface-bright`.
- **Border:** 2px `border-outline-variant` by default (`bordered` prop, on unless explicitly
  disabled) — thicker at rest than the answer card's 1px default, which is deliberate per the source
  spec (cards are containers, answer options are a more numerous repeated element that shouldn't
  compete as hard visually until selected).
- **Interactive variant:** `hover:border-primary` + pointer cursor, no shadow lift.

## Do's and Don'ts

### Do:
- **Do** use `shadow-gamified` for the small, named set of critical gamified elements it was built
  for — completed/checkpoint map nodes, the in-progress unit card.
- **Do** keep the Teacher Dashboard's denser `sm` padding as a deliberate mode switch, not a bug to
  "fix" toward the student-facing spacing scale.
- **Do** pair every color-coded correct/incorrect state with a dedicated icon, matching `apps/mobile`.

### Don't:
- **Don't** reach for Tailwind's bare `shadow-sm`/`md`/`lg` on a resting, bordered surface — fixed on
  `Button.tsx`, `Modal.tsx`, `DropdownMenu.tsx` on 2026-08-17. `Toast.tsx` and `Toggle.tsx`'s knob are
  the only earned exceptions (see Elevation & Depth); don't extend that list without a reason.
- **Don't** silently reconcile the 12px-vs-16px answer-card radius gap between mobile and web by
  copying one value over the other without a deliberate decision — flag it via `/impeccable audit` or
  `document` on the other side instead.
