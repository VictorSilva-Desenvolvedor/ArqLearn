"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { purchaseShopItem } from "@/lib/api/resources/gamification";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { ApiError } from "@/lib/api/http";
import { HeartsCountdown } from "./HeartsCountdown";

const HEARTS_MAX = 5;
// Catálogo mock guarda os UUIDs reais de shop_items (migrations/0004) — reaproveitado aqui só
// pra achar o id/preço do item de recarga, igual à Loja (app/(shell)/loja/page.tsx); não é dado
// inventado, é o mesmo catálogo usado nos dois lugares.
const HEARTS_REFILL_ITEM = mockShopCatalog.find((item) => item.tipo === "hearts_refill")!;

interface NoHeartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
      const idempotencyKey = crypto.randomUUID();
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
    <Modal open={open} onOpenChange={onOpenChange} radius="full" className="w-[min(90vw,24rem)]">
      <div className="flex flex-col items-center text-center gap-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-error-container">
          <Icon name={blocked ? "heart_broken" : "favorite"} filled className="text-5xl text-error-red" />
        </div>
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            {blocked ? "Projetos em pausa!" : `${gamification.hearts_current}/${HEARTS_MAX} vidas`}
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            {blocked
              ? "Suas vidas se regeneram com o tempo — volte em breve ou restaure agora com suas gemas para continuar praticando."
              : "Uma vida a cada 36 minutos, até o teto de 5 — ou restaure na hora com suas gemas."}
          </ModalDescription>
        </div>
        <HeartsCountdown />
        {error && (
          <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm w-full">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full">
          <Button variant="gamification" fullWidth disabled={!canRestore || pending} onClick={restoreWithGems}>
            Restaurar com {HEARTS_REFILL_ITEM.price_gems} Gemas
          </Button>
          {blocked ? (
            <Button variant="ghost" fullWidth onClick={backToHome}>
              Voltar para o Início
            </Button>
          ) : (
            <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
