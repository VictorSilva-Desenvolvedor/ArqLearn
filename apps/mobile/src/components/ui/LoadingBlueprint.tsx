import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { colors, spacing, type } from "@/theme/tokens";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LoadingBlueprintProps {
  /** Tamanho do ícone em px. Default: 20 (inline) / 208 (fullscreen). */
  size?: number;
  /**
   * "inline" = só o ícone animado (spinner de botão, linha de lista carregando).
   * "fullscreen" = quadro com grade + cantos técnicos + ícone + wordmark + legenda — gate de
   * autenticação, sessão de lição/Modo Infinito carregando.
   */
  variant?: "inline" | "fullscreen";
  /** Legenda abaixo do wordmark — só no variant "fullscreen". */
  label?: string;
}

// Espelha apps/web/src/components/ui/LoadingBlueprint.tsx (mesmo ícone, mesmo ciclo de 3s) —
// CSS keyframes não existem em React Native, então a mesma linha do tempo (desenha o traço,
// lapiseira percorre, desvanece) é reproduzida com um único Animated.Value (0→1 em loop) e
// interpolações, em vez de @keyframes. strokeDashoffset não é elegível a native driver, daí
// useNativeDriver:false neste Animated.Value — aceitável pro tamanho/uso deste ícone.
//
// A "lapiseira" do web (um <g> com translateX/translateY animados) não virou um <G> animado do
// react-native-svg aqui: essas props são depreciadas a favor de `transform`, e no alvo web do
// Expo (react-native-svg-web) elas vazam como atributos DOM inválidos ("translatex"/"translatey"
// em minúsculo, sem suporte pelo SVG real) — confirmado ao vivo via Playwright, warnings de
// console em todo carregamento. Substituída por um Animated.View simples (círculo) posicionado
// por cima do Svg com left/top animados — mesmo trajeto, só sem a linha decorativa da ponta.
function BlueprintIcon({ size }: { size: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // Reduce Motion: mantém o ícone visível e parado (progress=0.5 é o ponto em que o traço já
    // está 100% desenhado — dashoffset chega a 0 — e a opacidade está no pico, ver as
    // interpolações abaixo) em vez de rodar uma animação indefinida que ignora a preferência do
    // usuário — RN não tem um kill switch global pra isso (web tem via CSS).
    if (reduceMotion) {
      progress.setValue(0.5);
      pulse.setValue(0);
      return;
    }
    const drawLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    drawLoop.start();
    pulseLoop.start();
    return () => {
      drawLoop.stop();
      pulseLoop.stop();
    };
  }, [progress, pulse, reduceMotion]);

  const dashoffset = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [200, 0, 0] });
  const pathOpacity = progress.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const svgSize = size * 0.8;
  const svgOffset = (size - svgSize) / 2;
  // Trajeto da lapiseira em unidades do viewBox (0–100) convertido pra px do Svg renderizado.
  const pencilX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [10, 50, 90].map((v) => svgOffset + (v / 100) * svgSize),
  });
  const pencilY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [80, 20, 80].map((v) => svgOffset + (v / 100) * svgSize),
  });
  const pencilOpacity = progress.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const pencilSize = Math.max(3, size * 0.02);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          { width: size, height: size, borderRadius: size / 2, opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
        ]}
      />
      <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100" fill="none">
        <AnimatedPath
          d="M10 80 H90"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset={dashoffset}
          opacity={pathOpacity}
        />
        <AnimatedPath
          d="M20 80 V40 L50 20 L80 40 V80 H20"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeDasharray="200"
          strokeDashoffset={dashoffset}
          opacity={pathOpacity}
        />
        <AnimatedPath
          d="M40 50 H60 V70 H40 Z"
          stroke={colors.primary}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          strokeDashoffset={dashoffset}
          opacity={pathOpacity}
        />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: pencilSize,
          height: pencilSize,
          borderRadius: pencilSize / 2,
          backgroundColor: colors.secondary,
          opacity: pencilOpacity,
          left: pencilX,
          top: pencilY,
          transform: [{ translateX: -pencilSize / 2 }, { translateY: -pencilSize / 2 }],
        }}
      />
    </View>
  );
}

export function LoadingBlueprint({ size, variant = "inline", label }: LoadingBlueprintProps) {
  if (variant === "fullscreen") {
    const boxSize = size ?? 208;
    return (
      <View style={styles.fullscreenWrap}>
        <View style={[styles.gridBox, { width: boxSize, height: boxSize }]}>
          <Svg width={boxSize} height={boxSize} style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern id="loadingGrid" width={16} height={16} patternUnits="userSpaceOnUse">
                <Path d="M16 0 H0 V16" fill="none" stroke={colors.blueprintGrid} strokeWidth={1} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill={colors.surfaceContainerLowest} />
            <Rect width="100%" height="100%" fill="url(#loadingGrid)" />
          </Svg>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <BlueprintIcon size={boxSize * 0.7} />
        </View>
        <Text style={[type.displayLg, styles.wordmark]}>ArqLearn</Text>
        {label && <Text style={[type.headlineMd, styles.label]}>{label}</Text>}
      </View>
    );
  }

  return <BlueprintIcon size={size ?? 20} />;
}

const styles = StyleSheet.create({
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  fullscreenWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  gridBox: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: colors.primaryContainer,
    opacity: 0.5,
  },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  wordmark: {
    color: colors.primary,
    fontWeight: "700",
  },
  label: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
