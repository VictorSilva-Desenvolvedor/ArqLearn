import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

// Web usa Material Symbols Outlined (webfont). RN usa MaterialCommunityIcons (bundled em
// @expo/vector-icons) — nomes de glifo são diferentes, então o mapeamento fica centralizado
// aqui em vez de espalhar strings de fonte por componente.
const glyphs = {
  logo: "compass-outline",
  streak: "fire",
  hearts: "heart",
  gems: "diamond-stone",
  notifications: "bell-outline",
  check: "check-bold",
  checkpoint: "trophy",
  accountBalance: "bank",
  castle: "castle",
  locationCity: "city",
  school: "school",
  explore: "compass",
  league: "podium-gold",
  profile: "account-circle",
  home: "home-variant",
  lock: "lock",
  chevronRight: "chevron-right",
  errors: "close-circle-outline",
} as const;

export type IconName = keyof typeof glyphs;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = colors.onSurface }: IconProps) {
  return <MaterialCommunityIcons name={glyphs[name]} size={size} color={color} />;
}
