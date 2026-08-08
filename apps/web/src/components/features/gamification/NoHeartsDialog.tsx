"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { HeartsCountdown } from "./HeartsCountdown";

const HEARTS_REFILL_COST_GEMS = 350;
const HEARTS_MAX = 5;

interface NoHeartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoHeartsDialog({ open, onOpenChange }: NoHeartsDialogProps) {
  const router = useRouter();
  const { gamification, updateGamification } = useAuth();
  const canRestore = gamification.gems >= HEARTS_REFILL_COST_GEMS;

  const restoreWithGems = () => {
    if (!canRestore) return;
    updateGamification({
      hearts_current: HEARTS_MAX,
      gems: gamification.gems - HEARTS_REFILL_COST_GEMS,
    });
    onOpenChange(false);
  };

  const backToHome = () => {
    onOpenChange(false);
    router.push("/");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center text-center gap-md">
        <Icon name="heart_broken" filled className="text-6xl text-error-red" />
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            Projetos em pausa!
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            Suas vidas se regeneram com o tempo — volte em breve ou restaure agora com suas gemas
            para continuar praticando.
          </ModalDescription>
        </div>
        <HeartsCountdown />
        <div className="flex flex-col gap-sm w-full">
          <Button variant="gamification" fullWidth disabled={!canRestore} onClick={restoreWithGems}>
            Restaurar com {HEARTS_REFILL_COST_GEMS} Gemas
          </Button>
          <Button variant="ghost" fullWidth onClick={backToHome}>
            Voltar para o Início
          </Button>
        </div>
      </div>
    </Modal>
  );
}
