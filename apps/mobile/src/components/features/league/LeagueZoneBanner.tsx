import { StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

type ZoneKind = "promotion" | "demotion";

const createZoneConfig = (
  colors: ColorTokens,
): Record<ZoneKind, { label: string; icon: IconName; bg: string; fg: string }> => ({
  promotion: {
    label: "Zona de Promoção",
    icon: "trendingUp",
    bg: colors.tertiaryFixed,
    fg: colors.onTertiaryFixedVariant,
  },
  demotion: {
    label: "Zona de Rebaixamento",
    icon: "trendingDown",
    bg: colors.errorContainer,
    fg: colors.onErrorContainer,
  },
});

// Espelha apps/web/src/components/features/league/LeagueZoneBanner.tsx.
export function LeagueZoneBanner({ kind }: { kind: ZoneKind }) {
  const colors = useColors();
  const zoneConfig = createZoneConfig(colors);
  const config = zoneConfig[kind];
  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      <Icon name={config.icon} size={16} color={config.fg} />
      <Text style={[type.labelCaps, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
