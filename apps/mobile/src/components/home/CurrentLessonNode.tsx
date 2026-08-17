import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { colors, type } from "@/theme/tokens";

interface CurrentLessonNodeProps {
  icon: IconName;
  href: string;
  ctaLabel?: string;
}

export function CurrentLessonNode({ icon, href, ctaLabel }: CurrentLessonNodeProps) {
  const router = useRouter();
  const { gamification } = useAuth();
  const [noHearts, setNoHearts] = useState(false);

  const handlePress = () => {
    if (gamification.hearts_current <= 0) {
      setNoHearts(true);
      return;
    }
    router.push(href as never);
  };

  // "Sem vidas" é um Text flutuante, não anunciado sozinho por leitor de tela — mesmo padrão
  // imperativo já usado em QuestionCard.tsx (RN não tem aria-live/role="status" de DOM).
  useEffect(() => {
    if (!noHearts) return;
    AccessibilityInfo.announceForAccessibility("Sem vidas — volte mais tarde.");
  }, [noHearts]);

  return (
    <View style={styles.wrap}>
      {ctaLabel && (
        <View style={styles.callout}>
          <Text style={[type.labelCaps, styles.calloutText]}>{ctaLabel}</Text>
          <View style={styles.calloutArrow} />
        </View>
      )}
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel ?? "Lição atual"}
        style={styles.ring}
      >
        <View style={styles.border}>
          <View style={styles.face}>
            <Icon name={icon} size={32} color={colors.onPrimary} />
          </View>
        </View>
      </Pressable>
      {noHearts && (
        <View style={styles.noHearts}>
          <Text style={[type.bodySm, { color: colors.error }]}>Sem vidas — volte mais tarde.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  callout: {
    position: "absolute",
    top: -52,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    zIndex: 20,
  },
  calloutText: {
    color: colors.primary,
  },
  calloutArrow: {
    position: "absolute",
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    // Navegação/estado "em andamento" — azul primário, não laranja (reservado à camada de
    // gamificação/recompensa; ver DESIGN.md "The One Job Per Color Rule").
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  border: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceBright,
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noHearts: {
    position: "absolute",
    top: 92,
    width: 160,
    alignItems: "center",
  },
});
