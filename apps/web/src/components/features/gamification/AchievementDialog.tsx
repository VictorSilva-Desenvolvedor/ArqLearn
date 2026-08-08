"use client";

import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import type { AchievementType } from "@/types/api";

interface AchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AchievementType;
}

export function AchievementDialog({ open, onOpenChange, type }: AchievementDialogProps) {
  const entry = achievementCatalog[type];
  if (!entry) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center text-center gap-md">
        <div className="w-24 h-24 rounded-xl bg-secondary text-on-secondary flex items-center justify-center rotate-45 shadow-sm">
          <Icon name={entry.icon} filled className="text-5xl -rotate-45" />
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
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
            <Icon name="bolt" filled /> +{entry.xp_reward} XP
          </span>
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-primary">
            <Icon name="diamond" filled /> +{entry.gems_reward} gemas
          </span>
        </div>
        <Button variant="primary" fullWidth onClick={() => onOpenChange(false)}>
          Continuar
        </Button>
      </div>
    </Modal>
  );
}
