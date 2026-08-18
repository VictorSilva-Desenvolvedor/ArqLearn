import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface ProfileMenuLinkProps {
  href?: string;
  icon: IconName;
  label: string;
}

// Espelha apps/web/src/components/features/profile/ProfileMenuLink.tsx — sem `href` mostra "Em
// breve" (Loja/Ajuda ainda são Fase 5).
export function ProfileMenuLink({ href, icon, label }: ProfileMenuLinkProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  const content = (
    <Card padding="md" radius="lg" style={[styles.row, !href && styles.disabled]}>
      <Icon name={icon} size={24} color={colors.onSurfaceVariant} />
      <Text style={[type.bodyLg, styles.label]}>{label}</Text>
      {href ? (
        <Icon name="chevronRight" size={20} color={colors.onSurfaceVariant} />
      ) : (
        <Text style={[type.labelCaps, styles.soon]}>Em breve</Text>
      )}
    </Card>
  );

  if (!href) return content;

  return (
    <Pressable onPress={() => router.push(href as never)} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    disabled: {
      opacity: 0.6,
    },
    label: {
      flex: 1,
      color: colors.onSurface,
    },
    soon: {
      color: colors.onSurfaceVariant,
    },
  });
