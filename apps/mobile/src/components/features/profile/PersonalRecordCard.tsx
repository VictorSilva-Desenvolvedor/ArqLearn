import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { shareRecordEntry } from "@/lib/share";
import { personalRecordCatalog, personalRecordIcon } from "@/lib/gamification/personalRecordCatalog";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { PersonalRecord } from "@/types/api";

// Personal Record (TDD §12) é sempre um número visível, sem estado "bloqueada" — diferente de
// AchievementBadge, não existe versão "não conquistado ainda" pra mostrar. Espelha
// apps/web/.../PersonalRecordCard.tsx.
export function PersonalRecordCard({ record }: { record: PersonalRecord }) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [open, setOpen] = useState(false);
  const entry = personalRecordCatalog[record.metric];
  const valueLabel = entry.formatValue(record.value);

  function handleShare() {
    shareRecordEntry(entry, valueLabel);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel={`Recorde pessoal: ${entry.title}, ${valueLabel}`}
      >
        <View style={styles.shape}>
          <Icon name={personalRecordIcon(record)} size={24} color={colors.onPrimary} />
        </View>
        <Text style={[type.statsNum, styles.value]}>{valueLabel}</Text>
        <Text style={[type.labelCaps, styles.label]} numberOfLines={2}>
          {entry.title}
        </Text>
      </Pressable>
      <Modal open={open} onOpenChange={setOpen}>
        <View style={styles.modalContent}>
          <View style={[styles.shape, styles.modalShape]}>
            <Icon name={personalRecordIcon(record)} size={28} color={colors.onPrimary} />
          </View>
          <View style={styles.modalTextBlock}>
            <Text style={[type.headlineMd, styles.modalTitle]}>{valueLabel}</Text>
            <Text style={[type.bodyMd, styles.modalDescription]}>{entry.description}</Text>
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

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      padding: spacing.sm,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
    },
    shape: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    value: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    label: {
      color: colors.onSurfaceVariant,
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
  });
