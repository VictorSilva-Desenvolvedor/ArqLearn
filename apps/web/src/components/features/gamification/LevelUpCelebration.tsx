"use client";

import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

// Spec §6: celebração dedicada ao subir de nível, até 1.5s, dispensável. Fica montada uma vez
// no root layout (dentro do AuthProvider) e reage a justLeveledUpTo vindo de qualquer tela que
// chame updateGamification com um xp_total novo. Usa useContext direto (não useAuth) porque
// também está montada em /login, onde ainda não há sessão.
export function LevelUpCelebration() {
  const auth = useContext(AuthContext);
  const justLeveledUpTo = auth?.justLeveledUpTo ?? null;
  const dismissLevelUp = auth?.dismissLevelUp;

  useEffect(() => {
    if (justLeveledUpTo === null || !dismissLevelUp) return;
    const timer = setTimeout(dismissLevelUp, 1500);
    return () => clearTimeout(timer);
  }, [justLeveledUpTo, dismissLevelUp]);

  if (!dismissLevelUp) return null;

  return (
    <Modal open={justLeveledUpTo !== null} onOpenChange={(open) => !open && dismissLevelUp()}>
      <div className="flex flex-col items-center text-center gap-md">
        <div className="w-24 h-24 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
          <Icon name="military_tech" filled className="text-5xl" />
        </div>
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            Nível {justLeveledUpTo}!
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            Você subiu de nível. Continue assim!
          </ModalDescription>
        </div>
      </div>
    </Modal>
  );
}
