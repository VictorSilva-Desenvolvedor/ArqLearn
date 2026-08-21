import { useState } from "react";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { ShopCosmeticItem } from "@/components/features/shop/ShopCosmeticItem";
import { ShopFeatureCard } from "@/components/features/shop/ShopFeatureCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { purchaseShopItem } from "@/lib/api/resources/gamification";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

const HEARTS_MAX = 5;

// Espelha apps/web/src/app/(shell)/loja/page.tsx.
export default function LojaScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { gamification, updateGamification, adjustStreakFreezes } = useAuth();
  const { showToast } = useToast();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featuredItems = mockShopCatalog.filter((item) => item.tipo !== "cosmetic");
  const cosmeticItems = mockShopCatalog.filter((item) => item.tipo === "cosmetic");
  const ownedCosmeticIds = new Set(gamification.cosmetics.map((c) => c.item_id));

  const handlePurchase = async (itemId: string) => {
    setError(null);
    setPendingItemId(itemId);
    try {
      const idempotencyKey = Crypto.randomUUID();
      const result = await purchaseShopItem(itemId, idempotencyKey);
      updateGamification({
        gems: result.gems_restantes,
        ...(result.item.tipo === "hearts_refill" ? { hearts_current: HEARTS_MAX } : {}),
      });
      if (result.item.tipo === "streak_freeze") {
        adjustStreakFreezes(1);
      }
      const purchasedName = mockShopCatalog.find((i) => i.id === result.item.id)?.name ?? "Item";
      if (result.item.tipo === "cosmetic" && !ownedCosmeticIds.has(result.item.id)) {
        updateGamification({
          cosmetics: [
            ...gamification.cosmetics,
            { item_id: result.item.id, name: purchasedName, equipped: true, acquired_at: new Date().toISOString() },
          ],
        });
      }
      showToast(`${purchasedName} comprado!`, "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível concluir a compra.");
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[type.displayLg, styles.headerTitle]}>Loja da Arquiteta</Text>
          <View style={styles.gemsRow}>
            <Icon name="gems" size={20} color={colors.primary} />
            <Text style={[type.statsNum, styles.gemsValue]}>{gamification.gems}</Text>
          </View>
        </View>

        {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}

        <View style={styles.list}>
          {featuredItems.map((item) => (
            <ShopFeatureCard
              key={item.id}
              item={item}
              disabled={gamification.gems < item.price_gems}
              pending={pendingItemId === item.id}
              onPurchase={() => handlePurchase(item.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[type.headlineMd, styles.sectionTitle]}>Itens Cosméticos</Text>
          <View style={styles.cosmeticGrid}>
            {cosmeticItems.map((item) => (
              <View key={item.id} style={styles.cosmeticCell}>
                <ShopCosmeticItem
                  item={item}
                  disabled={gamification.gems < item.price_gems}
                  pending={pendingItemId === item.id}
                  owned={ownedCosmeticIds.has(item.id)}
                  onPurchase={() => handlePurchase(item.id)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    headerTitle: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: "700",
    },
    gemsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    gemsValue: {
      color: colors.primary,
    },
    error: {
      color: colors.error,
      backgroundColor: colors.errorContainer,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.onSurface,
    },
    cosmeticGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -spacing.xs / 2,
    },
    cosmeticCell: {
      width: "50%",
      paddingHorizontal: spacing.xs / 2,
      marginBottom: spacing.xs,
    },
  });
