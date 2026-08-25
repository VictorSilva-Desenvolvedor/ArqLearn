import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import {
  LEAGUE_TIERS,
  LEAGUE_TIER_COLOR_KEYS,
  LEAGUE_TIER_ICONS,
  LEAGUE_TIER_LABELS,
  type LeagueTierName,
} from "@/lib/gamification/leagueTiers";
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
                {/* Cor por tier também aqui, paridade com o mesmo fix no web (auditoria de
                    25/08/2026): o selo grande logo acima nesta MESMA tela já pinta a liga atual na
                    cor do próprio tier desde a pendência #8, mas esta trilha continuava em
                    colors.primary — mesmo tier aparecendo em duas cores na mesma dobra. O rótulo
                    de texto segue em colors.primary de propósito: a paleta de tier é de material
                    (prata/platina são claríssimos) e não garante contraste de TEXTO sobre o card
                    branco — o círculo carrega o material, o rótulo carrega o estado. */}
                <View
                  style={[
                    styles.badge,
                    active
                      ? { backgroundColor: colors[LEAGUE_TIER_COLOR_KEYS[tier].bg], borderColor: colors.outlineVariant }
                      : styles.badgeInactive,
                  ]}
                >
                  <Icon
                    name={LEAGUE_TIER_ICONS[tier]}
                    size={20}
                    color={active ? colors[LEAGUE_TIER_COLOR_KEYS[tier].on] : colors.outline}
                  />
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
    // (badgeActive removido — a cor do nó ativo agora vem de LEAGUE_TIER_COLOR_KEYS, inline.)
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
