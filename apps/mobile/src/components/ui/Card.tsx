import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/theme/tokens";

type CardPadding = "sm" | "md" | "lg";
type CardRadius = "md" | "lg" | "xl";

interface CardProps extends ViewProps {
  padding?: CardPadding;
  radius?: CardRadius;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

const paddingValues: Record<CardPadding, number> = {
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const radiusValues: Record<CardRadius, number> = {
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
};

export function Card({
  padding = "md",
  radius: radiusProp = "lg",
  bordered = true,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: paddingValues[padding], borderRadius: radiusValues[radiusProp] },
        bordered && styles.bordered,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceBright,
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
});
