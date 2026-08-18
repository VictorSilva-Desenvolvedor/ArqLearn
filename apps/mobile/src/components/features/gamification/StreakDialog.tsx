import { useState } from "react";
import * as Crypto from "expo-crypto";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { freezeStreak, purchaseShopItem } from "@/lib/api/resources/gamification";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { ApiError } from "@/lib/api/http";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Catálogo mock guarda os UUIDs reais de shop_items — mesmo item usado na Loja e aqui, não é
// dado inventado. Espelha apps/web/src/components/features/gamification/StreakDialog.tsx.
const STREAK_FREEZE_ITEM = mockShopCatalog.find((item) => item.tipo === "streak_freeze")!;

interface StreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StreakDialog({ open, onOpenChange }: StreakDialogProps) {
  const { gamification, streakFreezesAvailable, adjustStreakFreezes, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = useColors();
  const styles = createStyles(colors);
  const hasFreeze = streakFreezesAvailable > 0;
  const canBuyFreeze = gamification.gems >= STREAK_FREEZE_ITEM.price_gems;

  const useFreezeNow = async () => {
    if (!hasFreeze || pending) return;
    setPending(true);
    setError(null);
    try {
      await freezeStreak(streakFreezesAvailable);
      adjustStreakFreezes(-1);
      updateGamification({ streak_at_risk: false });
      showToast("Ofensiva protegida por hoje!", "success");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível usar o bloqueio agora.");
    } finally {
      setPending(false);
    }
  };

  const buyFreeze = async () => {
    if (!canBuyFreeze || pending) return;
    setPending(true);
    setError(null);
    try {
      const idempotencyKey = Crypto.randomUUID();
      const result = await purchaseShopItem(STREAK_FREEZE_ITEM.id, idempotencyKey);
      updateGamification({ gems: result.gems_restantes });
      adjustStreakFreezes(1);
      showToast("Bloqueio de Ofensiva comprado!", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível comprar o bloqueio agora.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} radius="full">
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon name="streak" size={40} color={colors.secondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[type.headlineMd, styles.title]}>
            {gamification.streak_current} {gamification.streak_current === 1 ? "dia" : "dias"} de sequência
          </Text>
          <Text style={[type.bodyMd, styles.description]}>
            Seu recorde é {gamification.streak_best} {gamification.streak_best === 1 ? "dia" : "dias"}.
            Pratique todo dia pra manter a sequência viva — ou use um Bloqueio de Ofensiva pra não
            perder se faltar um dia.
          </Text>
        </View>
        <Text style={[type.bodySm, styles.freezeCount]}>
          {hasFreeze
            ? `${streakFreezesAvailable} bloqueio${streakFreezesAvailable > 1 ? "s" : ""} disponív${streakFreezesAvailable > 1 ? "eis" : "el"}`
            : "Nenhum bloqueio disponível"}
        </Text>
        {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
        <View style={styles.actions}>
          {hasFreeze ? (
            <Button variant="gamification" fullWidth disabled={pending} onPress={useFreezeNow}>
              Usar Bloqueio Agora
            </Button>
          ) : (
            <Button variant="gamification" fullWidth disabled={!canBuyFreeze || pending} onPress={buyFreeze}>
              Comprar Bloqueio por {STREAK_FREEZE_ITEM.price_gems} Gemas
            </Button>
          )}
          <Button variant="ghost" fullWidth onPress={() => onOpenChange(false)}>
            Fechar
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      alignItems: "center",
      gap: spacing.md,
    },
    iconBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.secondaryContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      alignItems: "center",
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    description: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 8,
    },
    freezeCount: {
      color: colors.onSurfaceVariant,
    },
    error: {
      color: colors.error,
      backgroundColor: colors.errorContainer,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      width: "100%",
      textAlign: "center",
    },
    actions: {
      width: "100%",
      gap: spacing.sm,
    },
  });
