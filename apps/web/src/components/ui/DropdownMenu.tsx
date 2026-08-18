"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          sideOffset={4}
          className={cn(
            // Sem shadow-lg: a borda 2px já separa do conteúdo por trás; sistema é flat-by-default.
            "z-50 min-w-[12rem] max-h-[70vh] overflow-y-auto bg-surface-bright border-2 border-outline-variant rounded-lg p-1",
            "data-[state=open]:animate-[dropdown-in_150ms_ease-out]",
            "data-[state=closed]:animate-[dropdown-out_100ms_ease-in]",
          )}
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  active,
  disabled,
}: {
  children: ReactNode;
  onSelect: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dropdown.Item
      onSelect={disabled ? (e) => e.preventDefault() : onSelect}
      disabled={disabled}
      className={cn(
        // Radix move o foco real de DOM pro item destacado por teclado (roving focus) — por
        // isso outline-none aqui não é "sem indicador de foco", é substituir o outline padrão
        // do navegador pelo indicador próprio via data-highlighted (que cobre teclado E mouse).
        "px-sm py-2 rounded-md font-body-md text-body-md text-on-surface cursor-pointer outline-none",
        "data-[highlighted]:bg-surface-container data-[highlighted]:outline data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-primary",
        active && "text-primary font-bold",
        "data-[disabled]:text-error data-[disabled]:cursor-not-allowed data-[disabled]:opacity-80 data-[disabled]:data-[highlighted]:bg-transparent",
      )}
    >
      {children}
    </Dropdown.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <Dropdown.Label className="px-sm pt-sm pb-1 font-label text-label-caps uppercase text-on-surface-variant">
      {children}
    </Dropdown.Label>
  );
}

export function DropdownMenuSeparator() {
  return <Dropdown.Separator className="h-px bg-outline-variant my-1" />;
}
