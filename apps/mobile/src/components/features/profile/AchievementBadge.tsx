import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { colors, spacing, type } from "@/theme/tokens";
import type { AchievementCatalogEntry } from "@/lib/gamification/achievementCatalog";

interface AchievementBadgeProps {
  entry: AchievementCatalogEntry;
  unlocked: boolean;
  unlockedAt?: string;
}

// Espelha apps/web/src/components/features/profile/AchievementBadge.tsx — a rotação 45° do web é
// puramente decorativa (losango via CSS), reproduzida aqui com `transform`. Web deixa a conquista
// desbloqueada sem nenhuma interação; aqui o toque abre um modal com a data de desbloqueio, que a
// API já retorna em unlocked_at mas o web nunca exibe em lugar nenhum.
export function AchievementBadge({ entry, unlocked, unlockedAt }: AchievementBadgeProps) {
  const [open, setOpen] = useState(false);

  const shape = (
    <View style={[styles.shape, unlocked ? styles.shapeUnlocked : styles.shapeLocked]}>
      <Icon name={unlocked ? entry.icon : "lock"} size={24} color={unlocked ? colors.onSecondaryContainer : colors.outline} />
    </View>
  );

  const label = (
    <Text style={[type.labelCaps, unlocked ? styles.labelUnlocked : styles.labelLocked]} numberOfLines={2}>
      {unlocked ? entry.title : "Bloqueada"}
    </Text>
  );

  if (unlocked) {
    return (
      <>
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.container}
          accessibilityRole="button"
          accessibilityLabel={`Conquista desbloqueada: ${entry.title}`}
        >
          {shape}
          {label}
        </Pressable>
        <Modal open={open} onOpenChange={setOpen}>
          <View style={styles.modalContent}>
            <View style={[styles.shape, styles.shapeUnlocked, styles.modalShape]}>
              <Icon name={entry.icon} size={28} color={colors.onSecondaryContainer} />
            </View>
            <View style={styles.modalTextBlock}>
              <Text style={[type.headlineMd, styles.modalTitle]}>{entry.title}</Text>
              <Text style={[type.bodyMd, styles.modalDescription]}>{entry.description}</Text>
              {unlockedAt && (
                <Text style={[type.bodySm, styles.modalDate]}>
                  Desbloqueada em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
                </Text>
              )}
            </View>
            <View style={styles.rewards}>
              <View style={styles.rewardItem}>
                <Icon name="bolt" size={18} color={colors.onSurfaceVariant} />
                <Text style={[type.bodySm, styles.rewardText]}>+{entry.xp_reward} XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <Icon name="gems" size={18} color={colors.onSurfaceVariant} />
                <Text style={[type.bodySm, styles.rewardText]}>+{entry.gems_reward} gemas</Text>
              </View>
            </View>
            <Button variant="ghost" fullWidth onPress={() => setOpen(false)}>
              Entendi
            </Button>
          </View>
        </Modal>
      </>
    );
  }

  // Conquista bloqueada é "tap to reveal": não mostra o título (spoiler) até tocar, mas revela o
  // critério de desbloqueio já cadastrado em achievementCatalog.ts.
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel="Conquista bloqueada — toque para ver como desbloquear"
      >
        {shape}
        {label}
      </Pressable>
      <Modal open={open} onOpenChange={setOpen}>
        <View style={styles.modalContent}>
          <View style={[styles.shape, styles.shapeLocked, styles.modalShape]}>
            <Icon name="lock" size={28} color={colors.outline} />
          </View>
          <View style={styles.modalTextBlock}>
            <Text style={[type.headlineMd, styles.modalTitle]}>{entry.title}</Text>
            <Text style={[type.bodyMd, styles.modalDescription]}>{entry.description}</Text>
          </View>
          <View style={styles.rewards}>
            <View style={styles.rewardItem}>
              <Icon name="bolt" size={18} color={colors.onSurfaceVariant} />
              <Text style={[type.bodySm, styles.rewardText]}>+{entry.xp_reward} XP</Text>
            </View>
            <View style={styles.rewardItem}>
              <Icon name="gems" size={18} color={colors.onSurfaceVariant} />
              <Text style={[type.bodySm, styles.rewardText]}>+{entry.gems_reward} gemas</Text>
            </View>
          </View>
          <Button variant="ghost" fullWidth onPress={() => setOpen(false)}>
            Entendi
          </Button>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  shape: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  shapeUnlocked: {
    backgroundColor: colors.secondaryContainer,
  },
  shapeLocked: {
    backgroundColor: colors.surfaceGray,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderStyle: "dashed",
  },
  labelUnlocked: {
    color: colors.onSurface,
    textAlign: "center",
  },
  labelLocked: {
    color: colors.outline,
    textAlign: "center",
  },
  modalContent: {
    alignItems: "center",
    gap: spacing.md,
  },
  modalShape: {
    width: 80,
    height: 80,
  },
  modalTextBlock: {
    alignItems: "center",
  },
  modalTitle: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  modalDescription: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
  },
  modalDate: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
  },
  rewards: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    color: colors.onSurfaceVariant,
    fontWeight: "700",
  },
});
