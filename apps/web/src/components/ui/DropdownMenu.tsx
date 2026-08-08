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
          className="z-50 min-w-[12rem] bg-surface-bright border-2 border-outline-variant rounded-lg p-1 shadow-lg"
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
}: {
  children: ReactNode;
  onSelect: () => void;
  active?: boolean;
}) {
  return (
    <Dropdown.Item
      onSelect={onSelect}
      className={cn(
        "px-sm py-2 rounded-md font-body-md text-body-md text-on-surface cursor-pointer outline-none",
        "data-[highlighted]:bg-surface-container",
        active && "text-primary font-bold",
      )}
    >
      {children}
    </Dropdown.Item>
  );
}
