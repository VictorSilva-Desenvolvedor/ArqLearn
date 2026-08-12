import { useState } from "react";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { purchaseShopItem } from "@/lib/api/resources/gamification";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { colors, spacing, type } from "@/theme/tokens";
import { HeartsCountdown } from "./HeartsCountdown";

const HEARTS_MAX = 5;
// Catálogo mock guarda os UUIDs reais de shop_items — reaproveitado aqui só pra achar o id/preço
// do item de recarga, igual à Loja (fora de escopo desta fase); não é dado inventado, é o mesmo
// catálogo usado nos dois lugares.
const HEARTS_REFILL_ITEM = mockShopCatalog.find((item) => item.tipo === "hearts_refill")!;

interface NoHeartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Espelha apps/web/src/components/features/gamification/NoHeartsDialog.tsx.
export function NoHeartsDialog({ open, onOpenChange }: NoHeartsDialogProps) {
  const router = useRouter();
  const { gamification, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRestore = gamification.gems >= HEARTS_REFILL_ITEM.price_gems;
  const blocked = gamification.hearts_current <= 0;

  const restoreWithGems = async () => {
    if (!canRestore || pending) return;
    setPending(true);
    setError(null);
    try {
      const idempotencyKey = Crypto.randomUUID();
      const result = await purchaseShopItem(HEARTS_REFILL_ITEM.id, idempotencyKey);
      updateGamification({
        gems: result.gems_restantes,
        hearts_current: HEARTS_MAX,
        hearts_next_at: null,
      });
      showToast("Vidas restauradas!", "success");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível restaurar suas vidas agora.");
    } finally {
      setPending(false);
    }
  };

  const backToHome = () => {
    onOpenChange(false);
    router.push("/");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} radius="full">
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon name={blocked ? "heartBroken" : "hearts"} size={40} color={colors.errorRed} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[type.headlineMd, styles.title]}>
            {blocked ? "Projetos em pausa!" : `${gamification.hearts_current}/${HEARTS_MAX} vidas`}
          </Text>
          <Text style={[type.bodyMd, styles.description]}>
            {blocked
              ? "Suas vidas se regeneram com o tempo — volte em breve ou restaure agora com suas gemas para continuar praticando."
              : "Uma vida a cada 3 horas, até o teto de 5 — ou restaure na hora com suas gemas."}
          </Text>
        </View>
        <HeartsCountdown />
        {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}
        <View style={styles.actions}>
          <Button variant="gamification" fullWidth disabled={!canRestore || pending} onPress={restoreWithGems}>
            Restaurar com {HEARTS_REFILL_ITEM.price_gems} Gemas
          </Button>
          {blocked ? (
            <Button variant="ghost" fullWidth onPress={backToHome}>
              Voltar para o Início
            </Button>
          ) : (
            <Button variant="ghost" fullWidth onPress={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.errorContainer,
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
