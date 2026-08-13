import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// Espelha apps/web/src/components/ui/Toggle.tsx.
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
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
