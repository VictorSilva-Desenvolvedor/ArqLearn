"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

type StatInfoTone = "primary" | "secondary" | "tertiary";

interface StatInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: string;
  tone?: StatInfoTone;
  title: string;
  description: string;
  footer?: ReactNode;
}

const toneClasses: Record<StatInfoTone, string> = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
};

// Espelha apps/mobile/.../StatInfoDialog.tsx — modal genérico pros StatCard de Perfil (XP Total,
// Trilhas Concluídas, Lições, Precisão) que antes só mostravam um toast — mesma casca visual do
// StreakDialog/NoHeartsDialog, parametrizado pelo conteúdo de cada stat.
export function StatInfoDialog({ open, onOpenChange, icon, tone = "primary", title, description, footer }: StatInfoDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} radius="full">
      <div className="flex flex-col items-center text-center gap-md">
        <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center", toneClasses[tone])}>
          <Icon name={icon} className="text-3xl" filled />
        </div>
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">{title}</ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            {description}
          </ModalDescription>
        </div>
        {footer}
        <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)}>
          Entendi
        </Button>
      </div>
    </Modal>
  );
}
