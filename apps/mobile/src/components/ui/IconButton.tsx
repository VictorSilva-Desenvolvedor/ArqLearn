import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
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
});
