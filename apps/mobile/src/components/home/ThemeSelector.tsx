import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";
import { themeCatalog, type ThemeDefinition } from "@/lib/api/mocks/fixtures/themes";
import { colors, spacing, type } from "@/theme/tokens";

const featured = themeCatalog.filter((t) => t.semester === undefined);
const bySemester = Array.from({ length: 10 }, (_, i) => i + 1)
  .map((semester) => ({ semester, themes: themeCatalog.filter((t) => t.semester === semester) }))
  .filter((group) => group.themes.length > 0);

// SectionList em vez de ScrollView+map manual (/impeccable optimize, 2026-08-17): o catálogo de
// temas já passa de ~50 entradas (7 em destaque + 10 semestres) — ScrollView monta todas as linhas
// de uma vez, mesmo as fora da área visível do Modal (maxHeight 420); SectionList recicla linhas
// fora de tela e escala se o catálogo crescer, sem mudar o agrupamento visual por semestre.
const sections = [
  { title: "Trilhas em destaque", data: featured },
  ...bySemester.map(({ semester, themes }) => ({ title: `${semester}º Semestre`, data: themes })),
];

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
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Trocar de matéria — atual: ${theme.label}`}
      >
        <Icon name={theme.icon} size={18} color={colors.primary} />
        <Text style={[type.labelCaps, styles.triggerLabel]} numberOfLines={1}>
          {theme.label}
        </Text>
        <Icon name="expandMore" size={18} color={colors.primary} />
      </Pressable>

      <Modal open={open} onOpenChange={setOpen}>
        <Text style={[type.headlineMd, styles.modalTitle]}>Escolher tema</Text>
        <SectionList
          style={styles.list}
          showsVerticalScrollIndicator={false}
          sections={sections}
          keyExtractor={(entry) => entry.topic}
          renderSectionHeader={({ section }) => <ThemeGroupLabel label={section.title} />}
          renderItem={({ item }) => (
            <ThemeRow entry={item} active={item.topic === theme.topic} onSelect={select} />
          )}
          stickySectionHeadersEnabled={false}
        />
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
  // Sem `disabled` no Pressable de propósito: um Pressable desabilitado dentro de uma ScrollView
  // é uma armadilha conhecida do Android — o toque de arrastar pra rolar a lista fica "preso" no
  // row desabilitado em vez de ser repassado pro ScrollView (reproduzido ao vivo num device real,
  // travava o gesto de arrastar assim que o dedo tocava uma das 7 trilhas em destaque, todas
  // bloqueadas por padrão). O bloqueio funcional continua — só vira um no-op dentro do onPress —
  // e accessibilityState mantém o "desabilitado" pra leitor de tela sem tocar no touch handling.
  return (
    <Pressable
      onPress={() => entry.hasContent && onSelect(entry.topic)}
      accessibilityState={{ disabled: !entry.hasContent }}
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
    gap: 6,
    maxWidth: 220,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  triggerPressed: {
    backgroundColor: colors.primaryFixed,
  },
  triggerLabel: {
    color: colors.primary,
    fontWeight: "700",
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
