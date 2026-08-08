# ArqLearn — UI/UX Specification for Google Stitch

## 1. Product
ArqLearn is a gamified learning platform focused on Architecture (buildings, urbanism, architectural history, design theory and construction technology).

Core concept:
- Learn Architecture through short interactive lessons.
- Use XP, daily streaks, hearts, weekly leagues, achievements, gems and challenges.
- Users can upload PDFs, DOCX, PPTX, images and videos.
- AI transforms uploaded material into lessons, quizzes and interactive challenges.
- Generated questions can be reviewed, edited, approved or rejected before publication.
- Target users: Architecture students, teachers and professionals.

The visual experience should feel educational, modern, precise and motivating. It may use the engagement language of Duolingo-style learning, but it must have a distinct architectural identity.

## 2. Primary platform
Design primarily for a mobile app (iOS/Android), with responsive web compatibility.

Mobile navigation:
- Home
- Explorar
- Liga
- Perfil

Teacher dashboard is a separate web route and should prioritize analytical clarity over game-like visual treatment.

## 3. Visual direction
Create a polished production-ready educational app UI.

Brand palette:
- Primary blue: #2E5C8A
- Accent orange: #C77B3B
- Success green: #2E7D32
- Error red: #B00020
- Text: #1F2937
- Muted text: #6B7280
- Surface: #F3F4F6
- Background: #FFFFFF

Usage:
- Blue: navigation, primary buttons, headers.
- Orange: XP, streak, rewards and gamification highlights.
- Green: correct answers and completed progress.
- Red: incorrect answers and errors, used softly and never aggressively.

Typography:
- Screen titles: bold, 24–28sp.
- Question text: semibold, 18–20sp.
- Supporting/explanation text: regular, 14–15sp.
- XP/streak numbers: bold, tabular numerals, 16–22sp.
- Prefer SF Pro on iOS and Roboto/system font on Android.

Spacing:
4, 8, 12, 16, 24, 32, 48, 64px.
Mobile side margin: 16px.
Grid gutter: 8px.
Web: 12-column grid, 24px side margin, max content width 1120px.

Corner radius:
- Small: 6px
- Medium: 12px
- Large: 20px
- Pill: 999px

Icons:
- Outline style.
- Consistent 2px stroke.
- Slightly rounded corners.
- Architecture icons must be technically recognizable: floor plan, section, elevation, structural elements, BIM, drafting tools.
- Gamification icons: flame, heart, gem, trophy.

## 4. Design principles
1. Clarity before decoration.
2. Progress must always be visible during study.
3. Answering an exercise should require minimal interaction.
4. Architectural drawings and technical elements must preserve visual precision.
5. Accessibility by default.
6. Gamification should motivate, not punish.
7. Animations must be brief and dismissible.

Accessibility:
- WCAG AA contrast.
- Minimum 44x44px interactive targets.
- Do not communicate correct/incorrect state by color alone; use icon + text.
- Support screen readers.
- Support keyboard navigation on web.
- Respect reduced-motion preferences.

## 5. Screen map

### A. Home — Learning Map
Purpose: daily learning hub.

Include:
- Header with user/avatar.
- Current level.
- XP progress bar.
- Streak indicator with flame and number of days.
- Hearts counter.
- Gems counter.
- Main active learning path.
- Vertical or curved map of learning units.
- Completed lessons clearly marked.
- Current lesson highlighted.
- Locked future lessons.
- Primary CTA: "Continuar lição".
- Secondary shortcut: "Manter streak de hoje".
- Optional weekly challenge card.

Architecture visual language:
- Learning path can resemble an architectural blueprint/site plan.
- Nodes may use subtle architectural symbols.
- Avoid childish cartoon styling.

Example content:
"Fundamentos de Arquitetura"
"História da Arquitetura"
"Urbanismo"
"Conforto Ambiental"
"Estruturas"
"Legislação"
"BIM"
"Projeto de Interiores"

### B. Lesson Session — Quiz
Purpose: focused one-question-at-a-time learning.

Layout:
- Header with progress, streak and hearts.
- One question per screen.
- Large readable question.
- Optional architectural image/plant/cut/elevation.
- Answer choices as large cards.
- Primary interaction should be simple and fast.
- Difficulty indicator when appropriate.

Question types:
- Multiple choice.
- True/false.
- Matching.
- Fill in the blank.
- Image identification.

After answer:
- Immediate feedback.
- Correct/incorrect indicator with icon + text.
- Short explanation.
- XP gained.
- Button: "Próxima".

Do not show backend/API details.

### C. Lesson Summary
Show:
- Completion state.
- XP earned.
- Accuracy.
- Lesson progress.
- Updated streak.
- Gems earned when applicable.
- Short motivational message.
- CTA to continue the learning path.

If an achievement was unlocked, transition to Achievement screen.

### D. Achievement
Show:
- Large achievement badge.
- Achievement name.
- Exact unlock criterion.
- Short celebration.
- XP/gem reward if applicable.
- CTA to continue.

Locked achievements in Profile should appear as monochrome silhouettes.

### E. No Hearts
Show:
- Friendly explanation that all hearts were used.
- Countdown until next heart regenerates.
- Option to restore hearts using gems when available.
- Avoid punitive language.
- CTA to return to Home or explore another activity.

### F. Explore
Purpose: discover learning content.

Sections:
- Curated tracks.
- My generated tracks.
- Upload new material.
- Search/filter by Architecture topic.

Track cards should show:
- Title.
- Topic.
- Difficulty.
- Estimated duration.
- Progress.
- Origin: curated or generated.

Example cards:
"Fundamentos de Urbanismo"
"História da Arquitetura Moderna"
"Introdução ao BIM"
"Conforto Ambiental"
"Materiais e Sistemas Construtivos"

### G. Upload Material
Purpose: create a learning track from user content.

Supported:
- PDF
- DOCX
- PPTX
- PNG/JPG
- MP4/MOV

Show:
- Upload area.
- File information.
- Maximum size: 2 GB.
- Processing status.

Processing progress should use named stages:
1. Recebido
2. Extraindo conteúdo
3. Gerando perguntas
4. Pronto para revisão

Use a progress bar rather than a generic spinner.

### H. Question Review
For teachers/creators.

Show generated questions in a review queue.

Each question card:
- Question text.
- Answer options.
- Correct answer.
- Difficulty.
- Source excerpt.
- Actions: Aprovar / Editar / Rejeitar.

After review:
- CTA "Publicar trilha".

### I. League
Purpose: weekly competition.

Show:
- Current league tier.
- Weekly XP.
- Ranking.
- Position.
- Avatar.
- Name.
- XP this week.
- Promotion zone at top.
- Demotion zone at bottom.
- Current user highlighted.

The ranking should feel competitive but clean and professional.

### J. Profile
Show:
- Avatar.
- Name.
- Level.
- Total XP.
- Current streak.
- Best streak.
- Gems.
- Achievements.
- Shop.
- Settings.

Achievements:
- Grid of badges.
- Locked = monochrome silhouette.
- Unlocked = full color.
- Tapping locked badge reveals exact unlock criterion.

### K. Shop
Virtual items purchased with gems.

Categories may include:
- Cosmetic items.
- Streak freeze.
- Heart refill.

Show:
- Current gem balance.
- Item cards.
- Price in gems.
- Purchase CTA.
- Confirmation state.

### L. Notifications
In-app notification list.

Examples:
- "Sua sequência de 12 dias está em risco!"
- "Você foi promovido para a Liga Prata!"
- "Novo desafio semanal disponível."
- "Suas perguntas estão prontas para revisão."

A streak-risk notification should deep-link directly to the suggested lesson.

### M. Teacher Dashboard — Web
Separate web experience.

Prioritize data clarity.

Include:
- Classes.
- Student count.
- Average streak.
- Average accuracy.
- Weak topics.
- Engagement trends.
- Question review queue.

Use sortable tables and charts.
Do not overuse gamification visuals in the teacher dashboard.

## 6. Gamification components

### XP Bar
- Horizontal progress bar.
- Accent orange fill.
- Smooth animation up to 400ms.
- Level badge beside the bar.
- Level-up celebration up to 1.5 seconds and dismissible.

### Streak
- Flame icon + number.
- Always visible on Home and Session.
- Risk state uses a soft alert tone, not error red.
- Active streak freeze can use a small shield/ice overlay.

### Hearts
- Five heart icons in session header.
- Lost heart becomes empty rather than breaking.
- Clear regeneration countdown when empty.

### League card
- Position, avatar, name and weekly XP.
- Current user visually highlighted.
- Subtle promotion/demotion zones.

## 7. Important UI states
Every screen must include appropriate states:
- Loading: skeleton screens.
- Empty: light illustration + clear CTA.
- Network error: non-blocking banner + retry.
- Upload processing: named progress stages.
- Successful low-risk action: short toast, maximum 3 seconds.

## 8. Motion
- Standard transitions: 250–300ms.
- Celebration animations: maximum 1.5s.
- No gamification animation should block navigation for more than 2 seconds.
- Support reduced motion.

## 9. Responsive behavior
Mobile:
- Bottom tab navigation: Home, Explorar, Liga, Perfil.
- Swipe gestures may be used during explanations.
- Show offline/downloaded lesson state when applicable.

Web:
- Fixed side navigation on wide screens.
- Keyboard-first interaction for fill-in-the-blank questions.

Teacher web:
- Higher information density.
- Tables and analytical charts.
- Focus on readability.

## 10. Product tone
UI copy should be:
- Short.
- Encouraging.
- Clear.
- Professional but approachable.
- In Brazilian Portuguese.

Avoid excessive childish language.
Architecture terminology should remain technically accurate.

## 11. Important product behavior
The user journey should feel like:

Open app
→ see current streak and learning map
→ continue active lesson
→ answer questions
→ receive immediate feedback
→ finish lesson
→ earn XP/update streak
→ possibly unlock achievement
→ return to learning map.

For uploaded content:

Explore
→ upload material
→ processing progress
→ AI-generated questions
→ review questions
→ approve/edit/reject
→ publish track
→ generated track appears in My Tracks.

## 12. What Stitch should prioritize
Generate the UI and visual system from this specification.

Prioritize:
1. Home learning map.
2. Quiz/session screen.
3. Lesson summary.
4. Explore.
5. Upload + processing.
6. Question review.
7. League.
8. Profile + achievements.
9. Shop.
10. Teacher dashboard.

Keep the architecture-specific visual identity strong: blueprint lines, floor plans, elevations, architectural diagrams and drafting-inspired motifs can be used as subtle visual accents, but never at the expense of readability.

Do not design backend architecture diagrams as product UI.
Do not expose API endpoints, database schemas, microservices or infrastructure to end users.
