// Design tokens do ArqLearn ("Blueprint Narrative"), portados de
// Docs/stitch_app_visual_identity/blueprint_narrative/DESIGN.md — a mesma fonte usada em
// apps/web/src/app/globals.css. Não redefinir esses valores localmente em componentes; sempre
// importar as cores via `useColors()` (@/theme/useColors) — nunca `lightColors`/`darkColors`
// direto num componente, pra não hardcodar um tema só. `type`/`radius`/`spacing`/`fontFamily`
// abaixo não variam por tema, continuam importáveis direto daqui.

export const lightColors = {
  // Superfícies
  surface: "#f8f9ff",
  surfaceDim: "#d0dbed",
  surfaceBright: "#f8f9ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainer: "#e6eeff",
  surfaceContainerHigh: "#dee9fc",
  surfaceContainerHighest: "#d9e3f6",
  onSurface: "#121c2a",
  onSurfaceVariant: "#42474f",
  inverseSurface: "#27313f",
  inverseOnSurface: "#eaf1ff",
  // Escurecido em 2026-08-17 (/impeccable audit): #727780 media 4.09:1 como texto (ex.: Badge
  // "neutral"), abaixo do mínimo AA de 4.5:1 — novo valor ~4.9-5.1:1, mesmo tom, mais escuro.
  // Aplicado nas duas plataformas (apps/web/globals.css tem a mesma mudança).
  outline: "#626b76",
  // Escurecido em 2026-08-17 (/impeccable audit, achado replicado do web): #c2c7d0 media só
  // ~1.6:1 contra surfaceBright/surfaceGray, abaixo do mínimo AA de 3:1 pra contraste não-textual
  // (WCAG 1.4.11) — mesmo valor exato já validado e publicado em apps/web (#7f8894), que passa
  // 3.4:1 contra surfaceBright e 3.3:1 contra surfaceGray (as duas superfícies onde esta borda
  // aparece). Replicado em vez de derivar um novo tom, já que os dois tokens de superfície são
  // hex idênticos nas duas plataformas.
  outlineVariant: "#7f8894",
  surfaceTint: "#34618f",
  surfaceVariant: "#d9e3f6",
  surfaceGray: "#f3f4f6",
  blueprintGrid: "#e5e7eb",

  // Primária (navegação, botões primários, cabeçalhos)
  primary: "#0e4471",
  onPrimary: "#ffffff",
  primaryContainer: "#2e5c8a",
  onPrimaryContainer: "#b2d4ff",
  inversePrimary: "#9fcafe",
  primaryFixed: "#d1e4ff",
  primaryFixedDim: "#9fcafe",
  onPrimaryFixed: "#001d36",
  onPrimaryFixedVariant: "#164976",

  // Secundária (camada de gamificação: XP, streak, recompensas)
  secondary: "#8f4e0f",
  onSecondary: "#ffffff",
  secondaryContainer: "#fda864",
  onSecondaryContainer: "#753c00",
  secondaryFixed: "#ffdcc4",
  secondaryFixedDim: "#ffb780",
  onSecondaryFixed: "#2f1400",
  onSecondaryFixedVariant: "#6f3800",

  // Terciária (camada de validação: sucesso/progresso concluído)
  tertiary: "#004e10",
  onTertiary: "#ffffff",
  tertiaryContainer: "#156820",
  onTertiaryContainer: "#92e58c",
  tertiaryFixed: "#a3f69c",
  tertiaryFixedDim: "#88d982",
  onTertiaryFixed: "#002204",
  onTertiaryFixedVariant: "#005312",

  // Erro
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  errorRed: "#b00020",

  // Fundo e texto muted
  background: "#f8f9ff",
  onBackground: "#121c2a",
  mutedText: "#6b7280",

  // Overlay de Modal — mesmo valor nos dois temas (scrim é convencionalmente invariante: um
  // neutro bem escuro sobre qualquer superfície, ver darkColors.scrim abaixo).
  scrim: "rgba(18, 28, 42, 0.4)",
} as const;

// Paleta escura (18/08/2026, autorizado explicitamente pelo usuário) — mesmos hues/matiz dos
// tokens claros acima, luminância recalculada pro papel de tema escuro (convenção Material 3:
// containers ficam progressivamente mais CLAROS por elevação no escuro, ao contrário do claro).
// Todo par texto/fundo (onX sobre X) verificado ≥4.5:1 (WCAG AA texto normal) e bordas não-
// textuais (outline/outlineVariant) ≥3:1 — script de verificação descartado após uso, valores
// finais só aqui. As 12 variantes "Fixed" (primaryFixed*, secondaryFixed*, tertiaryFixed*) são
// iguais nos dois temas por definição do Material 3 — usadas por componentes que precisam do
// mesmo visual independente do tema.
export const darkColors = {
  surface: "#16191d",
  surfaceDim: "#121417",
  surfaceBright: "#363c45",
  surfaceContainerLowest: "#0d0f11",
  surfaceContainerLow: "#1d2025",
  surfaceContainer: "#24282e",
  surfaceContainerHigh: "#2d3239",
  surfaceContainerHighest: "#3a414a",
  onSurface: "#e6eaef",
  onSurfaceVariant: "#c6cbd2",
  inverseSurface: lightColors.surfaceContainerHighest,
  inverseOnSurface: lightColors.onSurface,
  outline: "#949ca8",
  outlineVariant: "#5e6978",
  surfaceTint: "#a4caea",
  surfaceVariant: "#344051",
  surfaceGray: "#22252b",
  blueprintGrid: "#2d3239",

  primary: "#a4caea",
  onPrimary: "#0a2e4d",
  primaryContainer: "#115288",
  onPrimaryContainer: "#dae7f1",
  inversePrimary: lightColors.primary,
  primaryFixed: lightColors.primaryFixed,
  primaryFixedDim: lightColors.primaryFixedDim,
  onPrimaryFixed: lightColors.onPrimaryFixed,
  onPrimaryFixedVariant: lightColors.onPrimaryFixedVariant,

  secondary: "#eabc8f",
  onSecondary: "#532d09",
  secondaryContainer: "#8a4c0f",
  onSecondaryContainer: "#f2e5d9",
  secondaryFixed: lightColors.secondaryFixed,
  secondaryFixedDim: lightColors.secondaryFixedDim,
  onSecondaryFixed: lightColors.onSecondaryFixed,
  onSecondaryFixedVariant: lightColors.onSecondaryFixedVariant,

  tertiary: "#86ea9a",
  onTertiary: "#005211",
  tertiaryContainer: "#007518",
  onTertiaryContainer: "#e3f7e7",
  tertiaryFixed: lightColors.tertiaryFixed,
  tertiaryFixedDim: lightColors.tertiaryFixedDim,
  onTertiaryFixed: lightColors.onTertiaryFixed,
  onTertiaryFixedVariant: lightColors.onTertiaryFixedVariant,

  error: "#eb9898",
  onError: "#510b0b",
  errorContainer: "#861313",
  onErrorContainer: "#f4e1e1",
  errorRed: "#f58499",

  background: "#16191d",
  onBackground: "#e6eaef",
  mutedText: "#a6abb5",

  scrim: lightColors.scrim,
} as const;

// Larga os literais exatos de cada hex (`typeof lightColors` sozinho fixaria cada chave no valor
// claro específico, e darkColors — mesmas chaves, hex diferentes — deixaria de ser atribuível a
// esse tipo) — cada token só precisa ser "uma string", não aquele hex exato.
export type ColorTokens = { [K in keyof typeof lightColors]: string };

// Famílias carregadas via useFonts em app/_layout.tsx (@expo-google-fonts/*).
export const fontFamily = {
  display: "HankenGrotesk_700Bold",
  displaySemibold: "HankenGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyBold: "Inter_700Bold",
  label: "JetBrainsMono_500Medium",
  labelBold: "JetBrainsMono_700Bold",
} as const;

interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

export const type: Record<string, TextStyleToken> = {
  displayLg: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 36 },
  headlineMd: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 32 },
  questionLg: { fontFamily: fontFamily.displaySemibold, fontSize: 20, lineHeight: 28 },
  questionSm: { fontFamily: fontFamily.displaySemibold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  bodyLgBold: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 24 },
  bodyMdBold: { fontFamily: fontFamily.bodyBold, fontSize: 15, lineHeight: 22 },
  bodySmBold: { fontFamily: fontFamily.bodyBold, fontSize: 14, lineHeight: 20 },
  labelCaps: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  statsNum: { fontFamily: fontFamily.labelBold, fontSize: 22, lineHeight: 28 },
};

export const radius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  section: 48,
} as const;
