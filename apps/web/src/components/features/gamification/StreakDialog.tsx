"use client";

import { useState } from "react";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { freezeStreak, purchaseShopItem } from "@/lib/api/resources/gamification";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { ApiError } from "@/lib/api/http";

// Catálogo mock guarda os UUIDs reais de shop_items (migrations/0004) — mesmo item usado na Loja
// (app/(shell)/loja/page.tsx) e no diálogo de Vidas, não é dado inventado aqui.
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
  const hasFreeze = streakFreezesAvailable > 0;
  const canBuyFreeze = gamification.gems >= STREAK_FREEZE_ITEM.price_gems;

  const useFreezeNow = async () => {
    if (!hasFreeze || pending) return;
    setPending(true);
    setError(null);
    try {
      await freezeStreak(streakFreezesAvailable);
      adjustStreakFreezes(-1);
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
      const idempotencyKey = crypto.randomUUID();
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
    <Modal open={open} onOpenChange={onOpenChange} radius="full" className="w-[min(90vw,24rem)]">
      <div className="flex flex-col items-center text-center gap-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container">
          <Icon name="local_fire_department" filled className="text-5xl text-secondary" />
        </div>
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            {gamification.streak_current} {gamification.streak_current === 1 ? "dia" : "dias"} de sequência
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            Seu recorde é {gamification.streak_best}{" "}
            {gamification.streak_best === 1 ? "dia" : "dias"}. Pratique todo dia pra manter a sequência
            viva — ou use um Bloqueio de Ofensiva pra não perder se faltar um dia.
          </ModalDescription>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {hasFreeze
            ? `${streakFreezesAvailable} bloqueio${streakFreezesAvailable > 1 ? "s" : ""} disponív${streakFreezesAvailable > 1 ? "eis" : "el"}`
            : "Nenhum bloqueio disponível"}
        </p>
        {error && (
          <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm w-full">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full">
          {hasFreeze ? (
            <Button variant="gamification" fullWidth disabled={pending} onClick={useFreezeNow}>
              Usar Bloqueio Agora
            </Button>
          ) : (
            <Button variant="gamification" fullWidth disabled={!canBuyFreeze || pending} onClick={buyFreeze}>
              Comprar Bloqueio por {STREAK_FREEZE_ITEM.price_gems} Gemas
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
