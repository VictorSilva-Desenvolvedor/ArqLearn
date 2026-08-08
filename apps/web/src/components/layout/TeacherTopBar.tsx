"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";

export function TeacherTopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant shadow-sm w-full">
      <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
        <Link href="/painel" className="flex items-center gap-xs">
          <Icon name="architecture" filled className="text-primary text-display-lg font-bold" />
          <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
          <span className="ml-xs font-label-caps text-label-caps uppercase text-on-surface-variant bg-surface-gray px-2 py-1 rounded">
            Professor
          </span>
        </Link>
        <div className="flex items-center gap-sm">
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
