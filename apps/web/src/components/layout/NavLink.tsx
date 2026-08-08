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
}

export function NavLink({ href, icon, activeIcon, label, variant }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "bottom") {
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all active:scale-90",
          isActive
            ? "bg-primary-container text-on-primary-container"
            : "text-on-surface-variant hover:text-primary",
        )}
      >
        <span className="mb-1 text-2xl">{isActive ? activeIcon : icon}</span>
        <span className="font-label-caps text-label-caps">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-sm rounded-lg px-md py-sm font-body-lg text-body-lg transition-colors",
        isActive
          ? "bg-primary-container text-on-primary-container font-bold"
          : "text-on-surface-variant hover:bg-surface-container",
      )}
    >
      {isActive ? activeIcon : icon}
      {label}
    </Link>
  );
}
