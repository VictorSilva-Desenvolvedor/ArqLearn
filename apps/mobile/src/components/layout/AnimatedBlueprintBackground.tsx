import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Fundo animado "Blueprint" — ícones de arquitetura caindo sobre a grade técnica, a pedido do
// usuário (ver Docs/stitch_app_visual_identity/fundo-animado-blueprint-v2.html, referência de
// layout/trajetos/cores). Espelha apps/web/src/components/layout/AnimatedBlueprintBackground.tsx
// — CSS keyframes não existem em React Native, então os mesmos 3 trajetos (waypoints de
// translateX/Y/rotate/opacity) são reproduzidos com Animated.Value + interpolate, mesmo padrão de
// components/ui/LoadingBlueprint.tsx. Montado uma vez em app/_layout.tsx, atrás de todo o
// conteúdo.
const ICON_NAMES = ["compass", "ruler", "square", "house", "triangle", "diamond"] as const;
type IconName = (typeof ICON_NAMES)[number];
const TONES = ["primary", "secondary"] as const;
const PATH_NAMES = ["a", "b", "c"] as const;
type PathName = (typeof PATH_NAMES)[number];

// Menos itens que o web (18) — telas de celular são bem mais estreitas, o mesmo total poluiria a
// tela em vez de ficar sutil ao fundo.
const TOTAL_ITEMS = 12;

function randomItem<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

interface FallConfig {
  id: number;
  icon: IconName;
  // Tom em vez de cor resolvida: assim o tema claro/escuro muda a cor renderizada na hora sem
  // precisar regenerar a lista (o que reiniciaria a animação de todo mundo no meio do trajeto).
  tone: (typeof TONES)[number];
  path: PathName;
  size: number;
  leftPercent: number;
  duration: number;
  startDelay: number;
}

function generateItems(): FallConfig[] {
  return Array.from({ length: TOTAL_ITEMS }, (_, id) => ({
    id,
    icon: randomItem(ICON_NAMES),
    tone: randomItem(TONES),
    path: randomItem(PATH_NAMES),
    size: 16 + Math.random() * 16,
    leftPercent: Math.random() * 92,
    duration: 6000 + Math.random() * 6000,
    // Positivo aqui (diferente do "negative animation-delay" do CSS de referência) — mesmo
    // objetivo (itens não começam todos sincronizados), mecanismo mais simples em Animated: cada
    // item espera um tempo aleatório antes do primeiro ciclo em vez de nascer "no meio da queda".
    startDelay: Math.random() * 8000,
  }));
}

// Waypoints em fração de progresso [0, 0.08|entrada, ...meio, 0.92, 1] → deslocamento X (px),
// fração vertical percorrida (0 = topo/-60px, 1 = base da tela, 1.12 = um pouco além, espelhando
// os 112vh do CSS de referência), rotação (deg) e opacidade — mesmos valores de
// apps/web/src/app/globals.css (@keyframes fall-path-a/b/c). Opacidades baixadas de
// 0.6/0.55/0.5 para 0.5/0.45/0.4 em 25/08/2026 junto com o web: ver o comentário longo em
// globals.css (a portagem usava a opacidade do mockup com as cores de marca em força total, o que
// deixou a decoração acima do piso de 3:1 da WCAG pra conteúdo não-textual com significado).
const PATH_WAYPOINTS: Record<
  PathName,
  { input: number[]; x: number[]; yFraction: number[]; rotate: number[]; opacity: number[] }
> = {
  a: {
    input: [0, 0.08, 0.3, 0.6, 0.92, 1],
    x: [0, 0, 40, -25, 15, 15],
    yFraction: [0, 0.06, 0.28, 0.6, 1, 1.12],
    rotate: [0, 0, 90, 200, 340, 360],
    opacity: [0, 0.5, 0.5, 0.5, 0.5, 0],
  },
  b: {
    input: [0, 0.08, 0.35, 0.65, 0.92, 1],
    x: [0, 0, -45, 30, -20, -20],
    yFraction: [0, 0.06, 0.32, 0.68, 1, 1.12],
    rotate: [0, 0, -110, -240, -340, -360],
    opacity: [0, 0.45, 0.45, 0.45, 0.45, 0],
  },
  c: {
    input: [0, 0.08, 0.4, 0.7, 0.92, 1],
    x: [0, 0, 20, -40, 30, 35],
    yFraction: [0, 0.06, 0.4, 0.75, 1, 1.12],
    rotate: [0, 0, 60, 150, 280, 300],
    opacity: [0, 0.4, 0.4, 0.4, 0.4, 0],
  },
};

function BlueprintIcon({ name, size, color }: { name: IconName; size: number; color: string }) {
  switch (name) {
    case "compass":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="2 2" />
          <Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={1} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
        </Svg>
      );
    case "ruler":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="2" y="8" width="20" height="8" rx="1" fill="none" stroke={color} strokeWidth={1.5} />
          <Path d="M6 8v4M10 8v2M14 8v4M18 8v2" stroke={color} strokeWidth={1} />
        </Svg>
      );
    case "square":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 4v16h16L4 4z" fill="none" stroke={color} strokeWidth={1.5} />
          <Path d="M6 18h12M6 6v12" stroke={color} strokeWidth={0.5} strokeDasharray="1 1" />
        </Svg>
      );
    case "house":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 10l9-7 9 7v11H3V10z" fill="none" stroke={color} strokeWidth={1.5} />
          <Path d="M9 21v-6h6v6" fill="none" stroke={color} strokeWidth={1.5} />
        </Svg>
      );
    case "triangle":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M2 20 L22 20 L2 2 Z" fill="none" stroke={color} strokeWidth={1.5} />
        </Svg>
      );
    case "diamond":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2 L21 12 L12 22 L3 12 Z" fill="none" stroke={color} strokeWidth={1.5} />
        </Svg>
      );
  }
}

function FallingIcon({
  config,
  screenHeight,
  colors,
}: {
  config: FallConfig;
  screenHeight: number;
  colors: ColorTokens;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(config.startDelay),
        Animated.timing(progress, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Reset instantâneo pro próximo ciclo — acontece com opacity já em 0 (ver waypoints),
        // então não há salto visível.
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, config.duration, config.startDelay]);

  const waypoints = PATH_WAYPOINTS[config.path];
  const translateX = progress.interpolate({ inputRange: waypoints.input, outputRange: waypoints.x });
  const translateY = progress.interpolate({
    inputRange: waypoints.input,
    outputRange: waypoints.yFraction.map((fraction) => -60 + fraction * (screenHeight + 60)),
  });
  const rotate = progress.interpolate({
    inputRange: waypoints.input,
    outputRange: waypoints.rotate.map((deg) => `${deg}deg`),
  });
  const opacity = progress.interpolate({ inputRange: waypoints.input, outputRange: waypoints.opacity });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: `${config.leftPercent}%`,
        width: config.size,
        height: config.size,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    >
      <BlueprintIcon
        name={config.icon}
        size={config.size}
        color={config.tone === "primary" ? colors.primary : colors.secondary}
      />
    </Animated.View>
  );
}

export function AnimatedBlueprintBackground() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const colors = useColors();
  const items = useMemo(() => generateItems(), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base sólida + grade técnica — nenhuma tela pinta mais colors.background sozinha (ver
          login.tsx e as 5 abas de (tabs), tornadas transparentes de propósito pra deixar isto
          aparecer), então este componente precisa fornecer a base, não só os ícones caindo —
          mesmo grid de components/ui/LoadingBlueprint.tsx (variant="fullscreen"), em escala de
          tela cheia em vez de um quadro pequeno. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="appBackgroundGrid" width={24} height={24} patternUnits="userSpaceOnUse">
            <Path d="M24 0 H0 V24" fill="none" stroke={colors.blueprintGrid} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.background} />
        <Rect width="100%" height="100%" fill="url(#appBackgroundGrid)" />
      </Svg>
      {/* Reduce Motion: os ícones são puramente decorativos (diferente do LoadingBlueprint, que
          comunica progresso real) — em vez de congelar tudo visível no meio do trajeto,
          simplesmente não renderiza nenhum, evitando qualquer chance de gatilho de enjoo por
          movimento. A base sólida acima continua valendo (não é decorativa, é o fundo real). */}
      {!reduceMotion &&
        items.map((item) => (
          <FallingIcon key={item.id} config={item} screenHeight={height} colors={colors} />
        ))}
    </View>
  );
}
