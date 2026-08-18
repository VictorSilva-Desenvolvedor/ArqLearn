import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { LEAGUE_TIERS, LEAGUE_TIER_ICONS, LEAGUE_TIER_LABELS, type LeagueTierName } from "@/lib/gamification/leagueTiers";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface LeagueProgressionTrackProps {
  currentTier: LeagueTierName;
  onSelectTier?: (tier: LeagueTierName) => void;
}

// Trilha horizontal com as 10 ligas (Madeira → Diamante), a atual em destaque — dá uma percepção
// de jornada de longo prazo além da divisão em que o usuário está agora. Tocar numa liga abre o
// LeagueTiersDialog nela (reaproveita a navegação por liga/divisão já construída).
export function LeagueProgressionTrack({ currentTier, onSelectTier }: LeagueProgressionTrackProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {LEAGUE_TIERS.map((tier, index) => {
          const active = tier === currentTier;
          return (
            <Fragment key={tier}>
              {index > 0 && <View style={styles.connector} />}
              <Pressable
                style={styles.item}
                onPress={() => onSelectTier?.(tier)}
                accessibilityRole="button"
                accessibilityLabel={`Ver Liga ${LEAGUE_TIER_LABELS[tier]}`}
              >
                <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
                  <Icon name={LEAGUE_TIER_ICONS[tier]} size={20} color={active ? colors.onPrimary : colors.outline} />
                </View>
                <Text style={[type.labelCaps, styles.label, active && styles.labelActive]} numberOfLines={1}>
                  {LEAGUE_TIER_LABELS[tier]}
                </Text>
              </Pressable>
            </Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceBright,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 16,
      padding: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 4,
    },
    item: {
      alignItems: "center",
      minWidth: 60,
      gap: 4,
    },
    connector: {
      height: 2,
      width: 24,
      backgroundColor: colors.outlineVariant,
      marginTop: 20,
      flexShrink: 0,
    },
    badge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    badgeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    badgeInactive: {
      backgroundColor: colors.surfaceGray,
      borderColor: colors.outlineVariant,
    },
    label: {
      color: colors.outline,
      fontSize: 10,
      lineHeight: 13,
    },
    labelActive: {
      color: colors.primary,
      fontWeight: "700",
    },
  });
