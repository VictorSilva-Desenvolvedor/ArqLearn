import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// Espelha apps/web/src/components/ui/Toggle.tsx. Sem `disabled` no Pressable de propósito —
// dentro de uma ScrollView (ver NotificationPreferencesPanel), um Pressable desabilitado é uma
// armadilha conhecida do Android que trava o gesto de arrastar (mesmo bug de Button.tsx/
// ThemeSelector.tsx). accessibilityState continua marcando desabilitado pra leitor de tela.
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      onPress={() => !disabled && onChange(!checked)}
      // Achado de audit (18/08/2026): a trilha visual de 44x24 sozinha fica abaixo do mínimo de
      // 48dp do Android — hitSlop fecha a lacuna sem mudar a aparência (mesma técnica de
      // IconButton.tsx).
      hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
      style={[styles.track, { backgroundColor: checked ? colors.primary : colors.outlineVariant }, disabled && styles.disabled]}
    >
      <View style={[styles.thumb, checked && styles.thumbChecked]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
  thumbChecked: {
    alignSelf: "flex-end",
  },
});
