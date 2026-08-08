import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

type ButtonVariant = "primary" | "gamification" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; text: keyof typeof type }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, text: "bodySm" },
  md: { paddingVertical: 12, paddingHorizontal: 24, text: "bodyLg" },
  lg: { paddingVertical: 12, paddingHorizontal: 32, text: "headlineMd" },
};

export function Button({ variant = "primary", size = "md", fullWidth = false, onPress, children }: ButtonProps) {
  const sizeStyle = sizeStyles[size];
  return (
    <Pressable onPress={onPress} style={fullWidth ? styles.fullWidth : undefined}>
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            variantStyle(variant),
            { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
            fullWidth && styles.fullWidth,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[type[sizeStyle.text], styles.label, { color: variantTextColor(variant) }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primary };
    case "gamification":
      return {
        backgroundColor: colors.secondaryContainer,
        borderBottomWidth: 4,
        borderBottomColor: colors.secondary,
      };
    case "ghost":
      return { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary };
  }
}

function variantTextColor(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return colors.onPrimary;
    case "gamification":
      return colors.onSecondaryContainer;
    case "ghost":
      return colors.primary;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontWeight: "700",
  },
});
