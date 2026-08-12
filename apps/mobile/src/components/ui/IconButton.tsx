import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}

export function IconButton({ icon, label, disabled, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    backgroundColor: colors.surfaceGray,
  },
  disabled: {
    opacity: 0.5,
  },
});
