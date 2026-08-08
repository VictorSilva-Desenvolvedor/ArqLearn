import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

export function Avatar({ src, name, size = 32 }: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  if (src) {
    return <Image source={{ uri: src }} style={[styles.base, dimensions]} accessibilityLabel={name} />;
  }

  return (
    <View style={[styles.base, styles.fallback, dimensions]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: colors.primary,
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
