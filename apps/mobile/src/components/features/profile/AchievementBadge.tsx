import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { shareAchievement } from "@/lib/share";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { AchievementCatalogEntry, AchievementRarity } from "@/lib/gamification/achievementCatalog";

interface AchievementBadgeProps {
  entry: AchievementCatalogEntry;
  unlocked: boolean;
  unlockedAt?: string;
}

// rarityShapeColors: identidade visual por tier (documento de brainstorm de conquistas §5.2 —
// materiais de construção como metáfora de raridade), mapeada aos tokens de tema que já existem
// (theme/tokens.ts) em vez de uma paleta nova. "epico" reaproveita o par secondaryContainer/
// onSecondaryContainer que era o único usado antes desta mudança (todo unlocked virava a mesma
// cor); "lendario" ganha um anel dourado extra (ver shapeLendario abaixo), mesmo espírito do
// Compasso Dourado/VIP (Avatar.tsx). Espelha apps/web/.../AchievementBadge.tsx.
function rarityShapeColors(colors: ColorTokens, rarity: AchievementRarity) {
  switch (rarity) {
    case "comum":
      return { background: colors.surfaceContainerHigh, icon: colors.onSurface };
    case "incomum":
      return { background: colors.tertiaryContainer, icon: colors.onTertiaryContainer };
    case "raro":
      return { background: colors.primaryContainer, icon: colors.onPrimaryContainer };
    case "epico":
    case "lendario":
      return { background: colors.secondaryContainer, icon: colors.onSecondaryContainer };
  }
}

// Espelha apps/web/src/components/features/profile/AchievementBadge.tsx — a rotação 45° do web é
// puramente decorativa (losango via CSS), reproduzida aqui com `transform`. Web deixa a conquista
// desbloqueada sem nenhuma interação; aqui o toque abre um modal com a data de desbloqueio, que a
// API já retorna em unlocked_at mas o web nunca exibe em lugar nenhum.
export function AchievementBadge({ entry, unlocked, unlockedAt }: AchievementBadgeProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [open, setOpen] = useState(false);
  const rarityColors = rarityShapeColors(colors, entry.rarity);

  function handleShare() {
    shareAchievement(entry);
  }

  const shape = (
    <View
      style={[
        styles.shape,
        unlocked ? { backgroundColor: rarityColors.background } : styles.shapeLocked,
        unlocked && entry.rarity === "lendario" && [styles.shapeLendario, { borderColor: colors.secondary }],
      ]}
    >
      <Icon name={unlocked ? entry.icon : "lock"} size={24} color={unlocked ? rarityColors.icon : colors.outline} />
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
            <View
              style={[
                styles.shape,
                styles.modalShape,
                { backgroundColor: rarityColors.background },
                entry.rarity === "lendario" && [styles.shapeLendario, { borderColor: colors.secondary }],
              ]}
            >
              <Icon name={entry.icon} size={28} color={rarityColors.icon} />
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
            <Button variant="primary" fullWidth onPress={handleShare} icon={<Icon name="share" size={18} color={colors.onPrimary} />}>
              Compartilhar
            </Button>
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

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
    // shapeLendario: anel dourado extra em volta do losango, mesmo espírito do Compasso
    // Dourado/VIP (Avatar.tsx) — só a raridade máxima ganha esse destaque.
    shapeLendario: {
      borderWidth: 3,
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
