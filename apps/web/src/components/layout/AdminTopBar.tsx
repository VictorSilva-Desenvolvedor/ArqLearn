"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";

export function AdminTopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant shadow-sm w-full">
      <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
        <Link href="/admin" className="flex items-center gap-xs">
          <Icon name="architecture" filled className="text-primary text-display-lg font-bold" />
          <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
          <span className="ml-xs font-label-caps text-label-caps uppercase text-on-error-container bg-error-container px-2 py-1 rounded">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-sm">
          <Link
            href="/admin/bugs"
            className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-gray transition-colors text-on-surface-variant"
            aria-label="Ajuda e Bugs"
          >
            <Icon name="bug_report" />
          </Link>
          <span className="hidden md:inline font-body-md text-body-md text-on-surface-variant">
            {user.name}
          </span>
          <Avatar name={user.name} size={32} />
          <IconButton icon={<Icon name="logout" />} label="Sair" onClick={logout} />
        </div>
      </div>
    </header>
  );
}
