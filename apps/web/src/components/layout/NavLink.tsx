"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  label: string;
  variant: "bottom" | "side";
  // VIP (a pedido do usuário): item dourado sempre, ativo ou não — lê como destino premium em
  // vez de "apagar" quando inativo igual aos outros itens de navegação.
  tone?: "default" | "gold";
}

export function NavLink({ href, icon, activeIcon, label, variant, tone = "default" }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isGold = tone === "gold";

  if (variant === "bottom") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all active:scale-90",
          isGold
            ? isActive
              ? "bg-secondary text-on-secondary"
              : "bg-secondary-fixed text-secondary hover:bg-secondary-container"
            : isActive
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:text-primary",
        )}
      >
        <span className="mb-1 text-2xl">{isActive ? activeIcon : icon}</span>
        <span className="font-label text-label-caps">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-sm rounded-lg px-md py-sm font-body-lg text-body-lg transition-colors",
        isGold
          ? isActive
            ? "bg-secondary text-on-secondary font-bold"
            : "text-secondary hover:bg-secondary-fixed"
          : isActive
            ? "bg-primary-container text-on-primary-container font-bold"
            : "text-on-surface-variant hover:bg-surface-container",
      )}
    >
      {isActive ? activeIcon : icon}
      {label}
    </Link>
  );
}
