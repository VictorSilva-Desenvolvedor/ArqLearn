import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  // VIP "Mestre Arquiteto" (a pedido do usuário): borda dourada no lugar da primária.
  vip?: boolean;
}

export function Avatar({ src, name, size = 32, vip = false }: AvatarProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dimensions = { width: size, height: size, borderRadius: size / 2 };
  const borderStyle = vip ? styles.baseVip : styles.base;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[borderStyle, dimensions]}
        accessibilityLabel={name}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[borderStyle, styles.fallback, dimensions]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    base: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    baseVip: {
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    fallback: {
      backgroundColor: colors.primaryFixed,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: {
      color: colors.onPrimaryFixed,
      fontWeight: "700",
    },
  });
