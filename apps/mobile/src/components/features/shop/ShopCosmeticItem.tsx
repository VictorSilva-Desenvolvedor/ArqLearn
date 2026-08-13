import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";
import type { ShopItem } from "@/types/api";

interface ShopCosmeticItemProps {
  item: ShopItem;
  disabled: boolean;
  pending: boolean;
  onPurchase: () => void;
}

// Espelha apps/web/src/components/features/shop/ShopCosmeticItem.tsx.
export function ShopCosmeticItem({ item, disabled, pending, onPurchase }: ShopCosmeticItemProps) {
  return (
    <Card padding="md" radius="lg" style={[styles.card, item.locked && styles.cardLocked]}>
      {item.is_new && (
        <View style={styles.badgeWrap}>
          <Badge tone="secondary">Novo</Badge>
        </View>
      )}
      <Icon name="cosmetic" size={32} color={colors.primary} />
      <Text style={[type.bodyMd, styles.name]} numberOfLines={2}>
        {item.name}
      </Text>
      {item.locked ? (
        <Text style={[type.labelCaps, styles.lockedLabel]}>Nível {item.requires_level}</Text>
      ) : (
        <Pressable disabled={disabled || pending} onPress={onPurchase} style={styles.purchaseButton}>
          <Icon name="gems" size={16} color={disabled || pending ? colors.onSurfaceVariant : colors.primary} />
          <Text style={[type.bodySm, styles.priceText, (disabled || pending) && styles.priceTextDisabled]}>
            {item.price_gems} gemas
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  cardLocked: {
    opacity: 0.6,
  },
  badgeWrap: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  name: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  lockedLabel: {
    color: colors.outline,
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    color: colors.primary,
    fontWeight: "700",
  },
  priceTextDisabled: {
    color: colors.onSurfaceVariant,
  },
});
