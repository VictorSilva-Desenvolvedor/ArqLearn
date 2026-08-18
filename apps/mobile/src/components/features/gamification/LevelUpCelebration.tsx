import { useContext, useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { AuthContext } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Celebração dedicada ao subir de nível, até 1.5s, dispensável. Fica montada uma vez no root
// layout (dentro do AuthProvider) e reage a justLeveledUpTo vindo de qualquer tela que chame
// updateGamification com um xp_total novo. Usa useContext direto (não useAuth) porque também
// está montada em /login, onde ainda não há sessão. Espelha
// apps/web/src/components/features/gamification/LevelUpCelebration.tsx.
export function LevelUpCelebration() {
  const auth = useContext(AuthContext);
  const justLeveledUpTo = auth?.justLeveledUpTo ?? null;
  const dismissLevelUp = auth?.dismissLevelUp;
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const colors = useColors();
  const styles = createStyles(colors);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReaderEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Achado de audit (18/08/2026): 1.5s fixos não davam tempo do TalkBack terminar de ler antes
    // do modal desmontar sozinho. Com leitor de tela ativo, quem fecha é a pessoa (toque fora ou
    // botão voltar, os dois já dismissible via Modal.tsx), sem prazo.
    if (justLeveledUpTo === null || !dismissLevelUp || screenReaderEnabled) return;
    const timer = setTimeout(dismissLevelUp, 1500);
    return () => clearTimeout(timer);
  }, [justLeveledUpTo, dismissLevelUp, screenReaderEnabled]);

  if (!dismissLevelUp) return null;

  return (
    <Modal open={justLeveledUpTo !== null} onOpenChange={(open) => !open && dismissLevelUp()}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Icon name="militaryTech" size={40} color={colors.onSecondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[type.headlineMd, styles.title]}>Nível {justLeveledUpTo}!</Text>
          <Text style={[type.bodyMd, styles.description]}>
            Você subiu de nível. Continue assim!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      alignItems: "center",
      gap: spacing.md,
    },
    badge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      alignItems: "center",
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    description: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 8,
    },
  });
