import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}

// Sem `disabled` no Pressable de propósito — dentro de uma ScrollView, um Pressable desabilitado
// é uma armadilha conhecida do Android que trava o gesto de arrastar (mesmo bug de Button.tsx/
// ThemeSelector.tsx). accessibilityState continua marcando desabilitado pra leitor de tela.
export function IconButton({ icon, label, disabled, onPress }: IconButtonProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={() => !disabled && onPress?.()}
      // 44x44 cobre o mínimo do iOS (44pt) mas fica 4dp abaixo do mínimo do Android (48dp) —
      // hitSlop estende a área de toque sem mudar o círculo visual de 44px.
      hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      style={({ pressed }) => [styles.base, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
