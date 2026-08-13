import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";
import { themeCatalog, type ThemeDefinition } from "@/lib/api/mocks/fixtures/themes";
import { colors, spacing, type } from "@/theme/tokens";

const featured = themeCatalog.filter((t) => t.semester === undefined);
const bySemester = Array.from({ length: 10 }, (_, i) => i + 1)
  .map((semester) => ({ semester, themes: themeCatalog.filter((t) => t.semester === semester) }))
  .filter((group) => group.themes.length > 0);

// Espelha apps/web/src/components/layout/ThemeSelector.tsx — dropdown vira Modal com lista
// rolável (RN não tem menu suspenso nativo equivalente). Escolha do tema persiste via
// ThemeContext (AsyncStorage); temas sem conteúdo (`!hasContent`) ficam desabilitados com o
// rótulo "Em construção", mesmo comportamento do web.
export function ThemeSelector() {
  const { theme, setTopic } = useTheme();
  const [open, setOpen] = useState(false);

  const select = (topic: string) => {
    setTopic(topic);
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Icon name={theme.icon} size={16} color={colors.onSurfaceVariant} />
        <Text style={[type.labelCaps, styles.triggerLabel]} numberOfLines={1}>
          {theme.label}
        </Text>
        <Icon name="expandMore" size={16} color={colors.onSurfaceVariant} />
      </Pressable>

      <Modal open={open} onOpenChange={setOpen}>
        <Text style={[type.headlineMd, styles.modalTitle]}>Escolher tema</Text>
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <ThemeGroupLabel label="Trilhas em destaque" />
          {featured.map((entry) => (
            <ThemeRow key={entry.topic} entry={entry} active={entry.topic === theme.topic} onSelect={select} />
          ))}

          {bySemester.map(({ semester, themes }) => (
            <View key={semester}>
              <ThemeGroupLabel label={`${semester}º Semestre`} />
              {themes.map((entry) => (
                <ThemeRow key={entry.topic} entry={entry} active={entry.topic === theme.topic} onSelect={select} />
              ))}
            </View>
          ))}
        </ScrollView>
      </Modal>
    </>
  );
}

function ThemeGroupLabel({ label }: { label: string }) {
  return <Text style={[type.labelCaps, styles.groupLabel]}>{label}</Text>;
}

function ThemeRow({
  entry,
  active,
  onSelect,
}: {
  entry: ThemeDefinition;
  active: boolean;
  onSelect: (topic: string) => void;
}) {
  return (
    <Pressable
      disabled={!entry.hasContent}
      onPress={() => onSelect(entry.topic)}
      style={[styles.row, active && styles.rowActive, !entry.hasContent && styles.rowDisabled]}
    >
      <Icon name={entry.hasContent ? entry.icon : "lock"} size={18} color={active ? colors.primary : colors.onSurfaceVariant} />
      <Text style={[type.bodyMd, styles.rowLabel, active && styles.rowLabelActive]} numberOfLines={2}>
        {entry.label}
      </Text>
      {!entry.hasContent && <Text style={[type.labelCaps, styles.comingSoon]}>Em construção</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
  },
  triggerLabel: {
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  modalTitle: {
    color: colors.onSurface,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 420,
  },
  groupLabel: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: colors.primaryFixed,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLabel: {
    flex: 1,
    color: colors.onSurface,
  },
  rowLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  comingSoon: {
    color: colors.error,
  },
});
