"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatPill } from "@/components/ui/StatPill";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeSelector } from "./ThemeSelector";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { useAuth } from "@/hooks/useAuth";
import { xpParaProximoNivel } from "@/lib/gamification/level";

export function TopAppBar() {
  const { user, gamification, logout } = useAuth();
  const [heartsDialogOpen, setHeartsDialogOpen] = useState(false);
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const xpFaltam = xpParaProximoNivel(gamification.level, gamification.xp_total);

  const stats = (
    <>
      <button
        type="button"
        onClick={() => setStreakDialogOpen(true)}
        aria-label="Ver sequência e bloqueio de ofensiva"
        className="rounded-full"
      >
        <StatPill
          tone="secondary"
          icon={<Icon name="local_fire_department" filled className="text-secondary" />}
          value={gamification.streak_current}
        />
      </button>
      <div className="w-px h-4 bg-outline-variant" />
      <button
        type="button"
        onClick={() => setHeartsDialogOpen(true)}
        aria-label="Ver vidas e restaurar"
        className="rounded-full"
      >
        <StatPill
          tone="error"
          icon={<Icon name="favorite" filled className="text-error-red" />}
          value={gamification.hearts_current}
        />
      </button>
      <div className="w-px h-4 bg-outline-variant" />
      <Link href="/loja" aria-label="Ir para a Loja" className="rounded-full">
        <StatPill
          tone="secondary"
          icon={<Icon name="diamond" filled className="text-secondary" />}
          value={gamification.gems}
        />
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant w-full">
      <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
        <Link href="/" className="flex items-center gap-xs">
          <Icon name="architecture" filled className="text-primary text-display-lg font-bold" />
          <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
        </Link>
        <div className="flex items-center gap-md">
          <div className="hidden sm:block">
            <ThemeSelector />
          </div>
          <div className="hidden md:flex items-center gap-sm bg-surface-gray rounded-full px-sm py-1 border border-outline-variant">
            {stats}
          </div>
          <Link
            href="/notificacoes"
            className="hidden md:inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-surface-gray transition-colors text-on-surface-variant"
            aria-label="Notificações"
          >
            <Icon name="notifications" />
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-xs text-primary font-bold p-1 rounded-md hover:bg-surface-container transition-colors"
          >
            {/* hidden abaixo de sm (achado /impeccable audit, 23/08/2026): em 390px de largura,
                essa faixa de texto junto do wordmark/avatar/logout empurrava o header 64px além
                da viewport (WCAG 1.4.10 Reflow) — mesmo princípio já aplicado ao seletor de tema
                e ao bloco de stats logo acima, que já colapsam progressivamente por breakpoint. */}
            <span className="hidden sm:flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-label text-label-caps text-primary uppercase">Nível {gamification.level}</span>
              <span className="font-label text-label-caps text-on-surface-variant normal-case">
                · {xpFaltam} XP p/ próx.
              </span>
            </span>
            <Avatar name={user.name} size={32} />
          </Link>
          <IconButton icon={<Icon name="logout" />} label="Sair" onClick={logout} />
        </div>
      </div>
      {/* Faixa única (era 2 blocos empilhados, cada um com seu próprio border-t/bg) — mesmo achado
          já corrigido em apps/mobile/TopAppBar.tsx (/impeccable layout, 2026-08-17): em telas
          estreitas (<640px) as duas faixas apareciam juntas, cada uma com sua própria borda,
          lendo como mais chrome do que o conteúdo pedia. sm:hidden aqui porque o seletor de tema
          já reaparece inline no header a partir de sm (`hidden sm:block` acima); stats continuam
          md:hidden porque só saem do header a partir de md. */}
      <div className="md:hidden flex flex-col items-center gap-1 bg-surface-gray py-2 border-t border-outline-variant">
        <div className="sm:hidden">
          <ThemeSelector />
        </div>
        <div className="flex justify-around items-center w-full">
          {stats}
          <div className="w-px h-4 bg-outline-variant" />
          {/* P0 do /impeccable critique (18/08/2026): o sino de notificações só existia
              `hidden md:inline-flex` — em telas <768px não havia NENHUM caminho até
              /notificacoes (nem no BottomNavBar, nem no menu do Perfil). Esta é a única faixa
              sempre visível abaixo de md, então a entrada mobile vive aqui. */}
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-surface-container-lowest transition-colors text-on-surface-variant"
          >
            <Icon name="notifications" />
          </Link>
        </div>
      </div>
      <NoHeartsDialog open={heartsDialogOpen} onOpenChange={setHeartsDialogOpen} />
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
    </header>
  );
}
