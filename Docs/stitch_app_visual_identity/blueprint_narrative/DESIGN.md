---
name: Blueprint Narrative
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#42474f'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#727780'
  outline-variant: '#c2c7d0'
  surface-tint: '#34618f'
  primary: '#0e4471'
  on-primary: '#ffffff'
  primary-container: '#2e5c8a'
  on-primary-container: '#b2d4ff'
  inverse-primary: '#9fcafe'
  secondary: '#8f4e0f'
  on-secondary: '#ffffff'
  secondary-container: '#fda864'
  on-secondary-container: '#753c00'
  tertiary: '#004e10'
  on-tertiary: '#ffffff'
  tertiary-container: '#156820'
  on-tertiary-container: '#92e58c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#9fcafe'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#164976'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#a3f69c'
  tertiary-fixed-dim: '#88d982'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
  error-red: '#B00020'
  surface-gray: '#F3F4F6'
  muted-text: '#6B7280'
  blueprint-grid: '#E5E7EB'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  question-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  question-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  stats-num:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 48px
  container-max: 1120px
---

## Brand & Style

The design system is built on the concept of "The Digital Drafting Table." It merges the professional precision of architectural practice with the dopamine-driven engagement of modern gamification. The brand personality is educational, authoritative, yet deeply motivating, catering to students and professionals who value technical accuracy.

The visual style is a hybrid of **Modern Minimalism** and **Technical Brutalism**. It utilizes heavy whitespace and clean layouts but punctuates them with "Drafting Accents"—subtle grid backgrounds, 2px technical strokes, and monospaced accents that evoke BIM software and blueprints. Unlike typical gamified apps that lean into soft, bubbly shapes, this system remains sharp and structured, ensuring the "educational" aspect is never undermined by "play."

**Core Principles:**
- **Precision First:** Elements align to a rigorous grid; icons are technically accurate representations of architectural elements.
- **Progressive Disclosure:** Complex data is layered to prevent cognitive overload during lessons.
- **Tactile Feedback:** Buttons and cards feel like physical drafting components being placed on a board.

## Colors

The palette is anchored by **Primary Blue**, used for navigation and structural UI elements to instill trust and focus. **Secondary Orange** acts as the high-energy "Gamification Layer," reserved exclusively for XP, streaks, and rewards to create a clear mental separation between "learning" (blue) and "winning" (orange).

**Tertiary Green** is the "Validation Layer," used for success states. The background is kept clean white to maximize readability, while **Surface Gray** creates subtle depth for cards and containers. For the technical aesthetic, a very light gray is used for background grid lines, mimicking drafting paper without distracting from the content.

## Typography

The typography strategy balances modern readability with technical flair. 
- **Hanken Grotesk** is used for headlines and questions, providing a clean, geometric feel that looks professional yet approachable.
- **Inter** handles all body copy and instructional text, chosen for its exceptional legibility at small sizes on mobile screens.
- **JetBrains Mono** is introduced as a functional accent for labels, XP counts, and tabular data. This monospaced touch reinforces the "technical/drafting" identity and ensures numbers (like streak counts) don't jump horizontally during animations.

**Hierarchy Note:** Use `label-caps` for metadata (e.g., category names) and `stats-num` for all gamified counters to make them stand out as distinct data points.

## Layout & Spacing

This design system uses a **4px baseline grid** to ensure mathematical precision. 

- **Mobile:** Uses a 16px side margin with an 8px gutter. Navigation is primarily handled via a bottom tab bar.
- **Web (Responsive):** Transitions to a 12-column fluid grid with a maximum content width of 1120px. Side margins expand to 24px.
- **The Teacher Dashboard:** Utilizes a "Density-First" approach, reducing padding to `sm` (12px) to allow for data-heavy tables and complex charts.

Spacing should be used to group related architectural concepts. For example, a question and its associated diagram should have `xs` (8px) spacing, while the answer cards below should be separated by `md` (16px).

## Elevation & Depth

To maintain the drafting aesthetic, the system avoids heavy shadows. Instead, it uses **Tonal Layering** and **Technical Outlines**:

- **Surface Levels:** The background is white. Cards and containers use `surface-gray` (#F3F4F6) or a simple 1px border (#E5E7EB).
- **Active States:** Instead of high elevation, active cards or selected answers use a 2px solid border in `primary-blue`.
- **Gamification Depth:** Only critical gamified elements (like the "Continue" button or an earned Badge) use a very soft, low-blur "Ambient Shadow" to make them feel like they are physically resting on top of the blueprint.
- **Glassmorphism:** Use subtle backdrop blurs (10px) on headers during scroll to maintain a sense of modern transparency without sacrificing the professional look.

## Shapes

The shape language reflects architectural CAD software. 

- **Level 1 (Soft - 6px):** Used for input fields, small chips, and checkboxes. This creates a sharp, precise look for functional elements.
- **Level 2 (Rounded - 12px):** The standard for lesson cards and content modules.
- **Level 3 (Large - 20px):** Reserved for "Hero" containers, like the primary learning path nodes or success modals.
- **Pill (999px):** Used exclusively for status indicators (e.g., "Active," "New") and secondary buttons to differentiate them from the primary rectangular CTAs.

## Components

### Buttons
- **Primary:** Solid `primary-blue`, 12px radius, bold label. 
- **Gamification CTA:** Solid `secondary-orange` with a subtle bottom-heavy border (2px) to give a "pressable" feel.
- **Ghost:** 2px `primary-blue` stroke with transparent background for secondary actions.

### Answer Cards
Answer cards should be large touch targets (min 60px height). In their default state, they have a 1px gray border. On selection, they transition to a 2px `primary-blue` border with a very light blue tint fill.

### Architecture Icons
Icons must use a consistent 2px stroke. Architectural icons (floor plans, BIM tools) should be literal and technical. Gamification icons (flame, heart) should be slightly more stylized but still maintain the 2px stroke to feel part of the same kit.

### The Learning Map
The Map nodes should not be cartoonish. They should resemble an "Urban Site Plan." Use lines to connect them that look like technical pathways or structural axes.

### Input Fields
Inputs for the Teacher Dashboard and Upload sections should use `label-caps` for titles. They use a 1px border that turns `primary-blue` on focus, with sharp 6px corners.

### Progress Bars
The XP bar uses a "Tube" style with `secondary-orange`. The Lesson Progress bar (top of screen) uses a thinner 4px line style in `primary-blue` to feel more like a drafting measurement tool.