"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ModalRadius = "xl" | "full";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
  // "full": modal "redondinho" — cantos bem mais arredondados que o --radius-xl padrão (1.5rem),
  // pro efeito de cartão compacto/circular (ex.: diálogo de Vidas). Token não existe em
  // globals.css porque é um caso pontual de forma, não uma cor — não se aplica a regra de nunca
  // hardcodar hex/px de cor fora do arquivo de tokens.
  radius?: ModalRadius;
  className?: string;
}

const radiusClasses: Record<ModalRadius, string> = {
  xl: "rounded-xl",
  full: "rounded-[2.5rem]",
};

export function Modal({ open, onOpenChange, children, dismissible = true, radius = "xl", className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-background/40 backdrop-blur-sm",
            "data-[state=open]:animate-[overlay-fade-in_200ms_ease-out]",
            "data-[state=closed]:animate-[overlay-fade-out_150ms_ease-in]",
          )}
        />
        <Dialog.Content
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2",
            "bg-surface-bright border-2 border-outline-variant p-lg shadow-lg",
            radiusClasses[radius],
            "data-[state=open]:animate-[modal-content-in_200ms_ease-out]",
            "data-[state=closed]:animate-[modal-content-out_150ms_ease-in]",
            className,
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalTitle = Dialog.Title;
export const ModalDescription = Dialog.Description;
export const ModalClose = Dialog.Close;
