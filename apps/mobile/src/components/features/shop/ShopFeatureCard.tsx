import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { ShopItem } from "@/types/api";

const featureIcon: Record<"hearts_refill" | "streak_freeze", IconName> = {
  hearts_refill: "hearts",
  streak_freeze: "freeze",
};

interface ShopFeatureCardProps {
  item: ShopItem;
  disabled: boolean;
  pending: boolean;
  onPurchase: () => void;
}

// Espelha apps/web/src/components/features/shop/ShopFeatureCard.tsx.
export function ShopFeatureCard({ item, disabled, pending, onPurchase }: ShopFeatureCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Icon name={featureIcon[item.tipo as "hearts_refill" | "streak_freeze"]} size={32} color={colors.secondary} />
        <View style={styles.textBlock}>
          <Text style={[type.questionSm, styles.title]}>{item.name}</Text>
          <Text style={[type.bodySm, styles.description]}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.action}>
        <Button
          variant="gamification"
          disabled={disabled || pending}
          onPress={onPurchase}
          icon={pending ? <LoadingBlueprint size={18} /> : <Icon name="gems" size={18} color={colors.onSecondaryContainer} />}
        >
          {pending ? "" : `${item.price_gems}`}
        </Button>
        {/* Botão desabilitado sozinho não deixa claro que é "sem gemas" — achado ao vivo. */}
        {disabled && !pending && <Text style={[type.labelCaps, styles.insufficientLabel]}>Gemas insuficientes</Text>}
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    info: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      flex: 1,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    description: {
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    action: {
      alignItems: "center",
      gap: 4,
    },
    insufficientLabel: {
      color: colors.error,
    },
  });
