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
  close: "close",
  success: "check-circle",
  error: "alert-circle",
  wifiOff: "wifi-off",
  // --- Fase 1 (loop de estudo): quiz, gamificação, catálogo de conquistas ---
  heartOutline: "heart-outline",
  heartBroken: "heart-broken",
  bolt: "lightning-bolt",
  target: "target",
  download: "download",
  downloadDone: "check-circle",
  schedule: "clock-outline",
  cancel: "close-circle",
  militaryTech: "medal",
  verified: "check-decagram",
  menuBook: "book-open-page-variant",
  psychology: "head-lightbulb-outline",
  allInclusive: "all-inclusive",
  replay: "replay",
  storefront: "storefront-outline",
  uploadFile: "file-upload-outline",
  summarize: "text-box-outline",
  forum: "forum-outline",
  bugReport: "bug-outline",
  taskAlt: "check-circle-outline",
  // --- Fase 2 (Modo Infinito) ---
  construction: "hammer-wrench",
  factCheck: "clipboard-check-outline",
  // --- Fase 3 (Materiais: Resumo e Chat) ---
  back: "arrow-left",
  send: "send",
  lightbulb: "lightbulb-on-outline",
  diagram: "floor-plan",
  bookmark: "bookmark-outline",
  filePdf: "file-pdf-box",
  fileDoc: "file-word-outline",
  filePpt: "file-powerpoint-outline",
  fileImage: "file-image-outline",
  fileVideo: "file-video-outline",
  // --- Fase 4 (Perfil real) ---
  eventAvailable: "calendar-check",
  eventBusy: "calendar-remove",
  freeze: "snowflake",
  settings: "cog-outline",
  help: "help-circle-outline",
  logout: "logout",
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
