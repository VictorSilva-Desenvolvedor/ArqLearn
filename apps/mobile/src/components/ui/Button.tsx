import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

type ButtonVariant = "primary" | "gamification" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  // Ex.: ActivityIndicator enquanto uma ação está em andamento (espelha o `icon?: ReactNode` de
  // apps/web/src/components/ui/Button.tsx) — renderizado antes do texto.
  icon?: ReactNode;
  onPress?: () => void;
  children: ReactNode;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; text: keyof typeof type }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, text: "bodySm" },
  md: { paddingVertical: 12, paddingHorizontal: 24, text: "bodyLg" },
  lg: { paddingVertical: 12, paddingHorizontal: 32, text: "headlineMd" },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  icon,
  onPress,
  children,
}: ButtonProps) {
  const colors = useColors();
  const sizeStyle = sizeStyles[size];
  return (
    // Sem `disabled` no Pressable de propósito: um Pressable desabilitado dentro de uma
    // ScrollView é uma armadilha conhecida do Android — o toque de arrastar pra rolar a lista
    // fica "preso" no botão desabilitado em vez de ser repassado pro ScrollView (reproduzido ao
    // vivo num device real). O bloqueio funcional continua — só vira no-op dentro do onPress —
    // accessibilityState mantém o "desabilitado" pra leitor de tela sem tocar no touch handling.
    <Pressable
      onPress={() => !disabled && onPress?.()}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      // Achado do /impeccable audit (18/08/2026): size="sm" renderiza ~36dp de altura (padding 8
      // + texto bodySm), abaixo do mínimo de 48dp — hitSlop fecha a lacuna sem mudar a aparência
      // visual do botão pequeno, mesma técnica de IconButton.tsx/Toggle.tsx.
      hitSlop={size === "sm" ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            variantStyle(variant, colors),
            { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
            fullWidth && styles.fullWidth,
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          {icon}
          <Text style={[type[sizeStyle.text], styles.label, { color: variantTextColor(variant, colors) }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: ButtonVariant, colors: ColorTokens) {
  switch (variant) {
    case "primary":
      return { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primary };
    case "gamification":
      // secondaryContainerBorder (não `secondary`) de propósito: `secondary` é mais claro que
      // `secondaryContainer` no tema escuro (Material 3 inverte a relação), o que quebrava o
      // efeito de sombra/"prensável" — ver o token em tokens.ts pro achado completo.
      return {
        backgroundColor: colors.secondaryContainer,
        borderBottomWidth: 4,
        borderBottomColor: colors.secondaryContainerBorder,
      };
    case "ghost":
      return { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary };
    case "danger":
      return { backgroundColor: colors.error, borderWidth: 2, borderColor: colors.error };
  }
}

function variantTextColor(variant: ButtonVariant, colors: ColorTokens) {
  switch (variant) {
    case "primary":
      return colors.onPrimary;
    case "gamification":
      return colors.onSecondaryContainer;
    case "ghost":
      return colors.primary;
    case "danger":
      return colors.onError;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: "700",
  },
});
