import { useContext, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthContext } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { colors, spacing, type } from "@/theme/tokens";

// Celebração dedicada ao subir de nível, até 1.5s, dispensável. Fica montada uma vez no root
// layout (dentro do AuthProvider) e reage a justLeveledUpTo vindo de qualquer tela que chame
// updateGamification com um xp_total novo. Usa useContext direto (não useAuth) porque também
// está montada em /login, onde ainda não há sessão. Espelha
// apps/web/src/components/features/gamification/LevelUpCelebration.tsx.
export function LevelUpCelebration() {
  const auth = useContext(AuthContext);
  const justLeveledUpTo = auth?.justLeveledUpTo ?? null;
  const dismissLevelUp = auth?.dismissLevelUp;

  useEffect(() => {
    if (justLeveledUpTo === null || !dismissLevelUp) return;
    const timer = setTimeout(dismissLevelUp, 1500);
    return () => clearTimeout(timer);
  }, [justLeveledUpTo, dismissLevelUp]);

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

const styles = StyleSheet.create({
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
