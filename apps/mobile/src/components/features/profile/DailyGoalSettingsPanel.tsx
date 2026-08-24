import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getDailyGoalStatus, updateDailyGoalLevel } from "@/lib/api/resources/gamification";
import { DAILY_GOAL_LEVELS, dailyGoalCatalog } from "@/lib/gamification/dailyGoalCatalog";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { DailyGoalLevel, DailyGoalStatus } from "@/types/api";

// Meta Diária (TDD §13, v1.30) — seletor de nível em Configurações, fechando o gap que o backlog
// de gamificação já registrava ("hoje só existe no cliente"). Sem GET embutido em nenhum outro
// contexto já carregado (diferente de NotificationPreferencesPanel, que não tem GET no contrato) —
// busca o status próprio no mount. Espelha apps/web/.../DailyGoalSettingsPanel.tsx.
export function DailyGoalSettingsPanel() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [status, setStatus] = useState<DailyGoalStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyGoalStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelect(level: DailyGoalLevel) {
    if (saving || status?.level === level) return;
    setSaving(true);
    try {
      const updated = await updateDailyGoalLevel(level);
      setStatus(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" radius="lg" style={styles.card}>
      <View>
        <Text style={[type.headlineMd, styles.title]}>Meta Diária</Text>
        <Text style={[type.bodySm, styles.description]}>
          Escolha quanto contar como &quot;vencer o dia&quot; — perguntas certas ou minutos
          estudados, o que vier primeiro. Isso também decide o alvo do Baú Diário.
        </Text>
      </View>
      <View style={styles.grid}>
        {DAILY_GOAL_LEVELS.map((level) => {
          const entry = dailyGoalCatalog[level];
          const selected = status?.level === level;
          return (
            <Pressable
              key={level}
              disabled={saving}
              onPress={() => handleSelect(level)}
              style={[styles.option, selected ? styles.optionSelected : styles.optionUnselected, saving && styles.optionDisabled]}
            >
              <View style={styles.optionHeader}>
                <Icon name={entry.icon} size={18} color={colors.onSurface} />
                <Text style={[type.labelCaps, styles.optionTitle]}>{entry.title}</Text>
                {selected && <Icon name="success" size={16} color={colors.primary} />}
              </View>
              <Text style={[type.bodySm, styles.optionSubtitle]}>
                {entry.questionsTarget} perguntas ou {entry.studyMinutesTarget} min
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    description: {
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    option: {
      flexBasis: "47%",
      flexGrow: 1,
      borderRadius: 12,
      borderWidth: 2,
      padding: spacing.sm,
      gap: 4,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceContainer,
    },
    optionUnselected: {
      borderColor: colors.outlineVariant,
    },
    optionDisabled: {
      opacity: 0.6,
    },
    optionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    optionTitle: {
      color: colors.onSurface,
      flex: 1,
    },
    optionSubtitle: {
      color: colors.onSurfaceVariant,
    },
  });
