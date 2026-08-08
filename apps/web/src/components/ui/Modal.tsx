"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}

export function Modal({ open, onOpenChange, children, dismissible = true, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2",
            "bg-surface-bright border-2 border-outline-variant rounded-xl p-lg shadow-lg",
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
