"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatPill } from "@/components/ui/StatPill";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";

export function TopAppBar() {
  const { user, gamification, logout } = useAuth();

  const stats = (
    <>
      <StatPill
        tone="secondary"
        icon={<Icon name="local_fire_department" filled className="text-secondary" />}
        value={gamification.streak_current}
      />
      <div className="w-px h-4 bg-outline-variant" />
      <StatPill
        tone="error"
        icon={<Icon name="favorite" filled className="text-error-red" />}
        value={gamification.hearts_current}
      />
      <div className="w-px h-4 bg-outline-variant" />
      <StatPill
        tone="primary"
        icon={<Icon name="diamond" filled className="text-primary" />}
        value={gamification.gems}
      />
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant shadow-sm w-full">
      <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
        <Link href="/" className="flex items-center gap-xs">
          <Icon name="architecture" filled className="text-primary text-display-lg font-bold" />
          <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
        </Link>
        <div className="flex items-center gap-md">
          <div className="hidden md:flex items-center gap-sm bg-surface-gray rounded-full px-sm py-1 border border-outline-variant">
            {stats}
          </div>
          <Link
            href="/notificacoes"
            className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-gray transition-colors text-on-surface-variant"
            aria-label="Notificações"
          >
            <Icon name="notifications" />
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-xs text-primary font-bold p-1 rounded-md hover:bg-surface-container transition-colors"
          >
            <span className="font-label-caps text-label-caps uppercase">
              {gamification.xp_total} XP
            </span>
            <Avatar name={user.name} size={32} />
          </Link>
          <IconButton icon={<Icon name="logout" />} label="Sair" onClick={logout} />
        </div>
      </div>
      <div className="md:hidden flex justify-around items-center bg-surface-gray py-2 border-t border-outline-variant">
        {stats}
      </div>
    </header>
  );
}
