import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";

// Espelha apps/web's FogOverlay.tsx — cobre o restante do caminho a partir de onde a névoa
// começa (ver UnitSection) com uma camada por cima, não um filtro em cada nó.
//
// Web usa `filter: blur()` em várias manchas soltas pra evitar o efeito "parede" de um
// gradiente sólido. RN não tem equivalente de `filter: blur()` (nem BlurView do expo-blur
// blurra a FORMA da mancha em si — ele borra o que está atrás, exigindo reestruturar a árvore
// de nós dentro de um BlurTargetView só pra isso, custo alto pra um efeito decorativo). Em vez
// disso, aproxima o efeito com manchas semi-transparentes sobrepostas em tons já próximos do
// fundo do tema (surfaceGray/outlineVariant) — como as cores já são quase iguais ao fundo, a
// ausência de blur real é bem menos perceptível do que seria com cores contrastantes.
const wisps = [
  { top: "0%", left: "5%", size: 130, tone: colors.surfaceGray, opacity: 0.6 },
  { top: "8%", left: "55%", size: 150, tone: colors.outlineVariant, opacity: 0.45 },
  { top: "25%", left: "10%", size: 170, tone: colors.outlineVariant, opacity: 0.55 },
  { top: "22%", left: "60%", size: 140, tone: colors.surfaceGray, opacity: 0.7 },
  { top: "45%", left: "30%", size: 190, tone: colors.outlineVariant, opacity: 0.65 },
  { top: "48%", left: "-5%", size: 150, tone: colors.surfaceGray, opacity: 0.6 },
  { top: "65%", left: "50%", size: 180, tone: colors.outlineVariant, opacity: 0.75 },
  { top: "68%", left: "5%", size: 160, tone: colors.surfaceGray, opacity: 0.7 },
  { top: "85%", left: "35%", size: 200, tone: colors.outlineVariant, opacity: 0.85 },
  { top: "88%", left: "-8%", size: 170, tone: colors.outlineVariant, opacity: 0.8 },
] as const;

export function FogOverlay({ topPercent }: { topPercent: number }) {
  return (
    <View style={[styles.container, { top: `${topPercent}%` }]} pointerEvents="none">
      {wisps.map((w, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: w.top,
            left: w.left,
            width: w.size,
            height: w.size,
            borderRadius: w.size / 2,
            backgroundColor: w.tone,
            opacity: w.opacity,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    overflow: "hidden",
  },
});
