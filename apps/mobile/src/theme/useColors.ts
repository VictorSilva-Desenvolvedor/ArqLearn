import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ColorTokens } from "./tokens";

// Fonte única de cor por tema — reflete o modo escuro/claro do sistema (app.json,
// userInterfaceStyle: "automatic"). Todo componente que usa cor de "@/theme/tokens" deve chamar
// isto em vez de importar lightColors/darkColors direto.
export function useColors(): ColorTokens {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
