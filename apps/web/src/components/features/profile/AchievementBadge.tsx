"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { shareOrCopy } from "@/lib/share";
import { cn } from "@/lib/utils/cn";
import type { AchievementCatalogEntry, AchievementRarity } from "@/lib/gamification/achievementCatalog";

interface AchievementBadgeProps {
  entry: AchievementCatalogEntry;
  unlocked: boolean;
  unlockedAt?: string;
}

// rarityShapeClasses: identidade visual por tier (documento de brainstorm de conquistas §5.2 —
// materiais de construção como metáfora de raridade), mapeada aos tokens semânticos que já
// existem no design system em vez de uma paleta nova. "epico" reaproveita o tratamento amber que
// era o único usado antes desta mudança (todo unlocked virava bg-secondary); "lendario" ganha o
// mesmo anel dourado grosso já usado pelo Compasso Dourado/VIP (Avatar.tsx) — reaproveita um
// significado que a UI já usa pra "isso é especial" em vez de inventar uma 6ª cor.
const rarityShapeClasses: Record<AchievementRarity, string> = {
  comum: "bg-surface-container-high text-on-surface",
  incomum: "bg-tertiary text-on-tertiary",
  raro: "bg-primary text-on-primary",
  epico: "bg-secondary text-on-secondary",
  lendario: "bg-secondary text-on-secondary ring-4 ring-secondary-container ring-offset-2 ring-offset-surface",
};

// Espelha apps/mobile/.../AchievementBadge.tsx — conquista desbloqueada agora também abre um
// modal (com a data de desbloqueio, que a API já retorna em unlocked_at mas nunca era exibida em
// lugar nenhum), em vez de ficar só decorativa.
export function AchievementBadge({ entry, unlocked, unlockedAt }: AchievementBadgeProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  async function handleShare() {
    await shareOrCopy(
      {
        title: entry.title,
        text: `🏛️ Desbloqueei "${entry.title}" no ArqLearn! ${entry.description}`,
      },
      () => showToast("Copiado! Cole onde quiser compartilhar.", "success"),
    );
  }

  const shape = (
    <div
      className={cn(
        "w-16 h-16 rounded-xl flex items-center justify-center rotate-45",
        unlocked
          ? rarityShapeClasses[entry.rarity]
          : "bg-surface-gray text-outline border-2 border-dashed border-outline-variant",
      )}
    >
      <Icon name={unlocked ? entry.icon : "lock"} filled={unlocked} className="text-2xl -rotate-45" />
    </div>
  );

  const label = (
    <span className={cn("font-label text-label-caps", unlocked ? "text-on-surface" : "text-outline")}>
      {unlocked ? entry.title : "Bloqueada"}
    </span>
  );

  if (unlocked) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center text-center gap-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`Conquista desbloqueada: ${entry.title}`}
        >
          {shape}
          {label}
        </button>
        <Modal open={open} onOpenChange={setOpen}>
          <div className="flex flex-col items-center text-center gap-md">
            <div
              className={cn(
                "w-20 h-20 rounded-xl flex items-center justify-center rotate-45",
                rarityShapeClasses[entry.rarity],
              )}
            >
              <Icon name={entry.icon} filled className="text-3xl -rotate-45" />
            </div>
            <div>
              <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
                {entry.title}
              </ModalTitle>
              <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
                {entry.description}
              </ModalDescription>
              {unlockedAt && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  Desbloqueada em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-lg">
              <span className="flex items-center gap-1 font-label text-body-sm font-bold text-on-surface-variant">
                <Icon name="bolt" /> +{entry.xp_reward} XP
              </span>
              <span className="flex items-center gap-1 font-label text-body-sm font-bold text-on-surface-variant">
                <Icon name="diamond" /> +{entry.gems_reward} gemas
              </span>
            </div>
            <Button variant="primary" fullWidth onClick={handleShare}>
              <Icon name="share" /> Compartilhar
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
              Entendi
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  // Conquista bloqueada é "tap to reveal": não mostra o título (spoiler) até tocar, mas revela o
  // critério de desbloqueio já cadastrado em achievementCatalog.ts.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center text-center gap-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={`Conquista bloqueada — toque para ver como desbloquear`}
      >
        {shape}
        {label}
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <div className="flex flex-col items-center text-center gap-md">
          <div className="w-20 h-20 rounded-xl bg-surface-gray text-outline border-2 border-dashed border-outline-variant flex items-center justify-center rotate-45">
            <Icon name="lock" className="text-3xl -rotate-45" />
          </div>
          <div>
            <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
              {entry.title}
            </ModalTitle>
            <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
              {entry.description}
            </ModalDescription>
          </div>
          <div className="flex items-center gap-lg">
            <span className="flex items-center gap-1 font-label text-body-sm font-bold text-on-surface-variant">
              <Icon name="bolt" /> +{entry.xp_reward} XP
            </span>
            <span className="flex items-center gap-1 font-label text-body-sm font-bold text-on-surface-variant">
              <Icon name="diamond" /> +{entry.gems_reward} gemas
            </span>
          </div>
          <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </div>
      </Modal>
    </>
  );
}
