"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";

interface CurrentLessonNodeProps {
  icon: string;
  href: string;
  ctaLabel?: string;
}

export function CurrentLessonNode({ icon, href, ctaLabel }: CurrentLessonNodeProps) {
  const router = useRouter();
  const { gamification } = useAuth();
  const [noHeartsOpen, setNoHeartsOpen] = useState(false);

  const handleClick = () => {
    if (gamification.hearts_current <= 0) {
      setNoHeartsOpen(true);
      return;
    }
    router.push(href);
  };

  return (
    <div className="relative flex flex-col items-center">
      {ctaLabel && (
        // Callout de navegação/progresso — azul primário, não laranja (reservado à camada de
        // gamificação/recompensa; ver DESIGN.md "The One Job Per Color Rule"). Sem animate-bounce
        // nem shadow-md: um loop infinito de bounce e uma sombra genérica são exatamente os
        // reflexos que este sistema evita por padrão (flat-by-default, um único momento autoral).
        <div className="absolute -top-12 bg-surface-bright border-2 border-primary text-primary font-label-caps text-label-caps px-3 py-1 rounded-lg flex flex-col items-center whitespace-nowrap">
          {ctaLabel}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary absolute -bottom-[10px]" />
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-label={ctaLabel ?? "Lição atual"}
        // Navegação/estado "em andamento" — azul primário, não laranja.
        className="w-20 h-20 rounded-full bg-primary text-on-primary border-4 border-surface-bright shadow-[0_0_0_2px_var(--color-primary)] flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name={icon} filled className="text-4xl" />
      </button>
      <NoHeartsDialog
        open={noHeartsOpen}
        onOpenChange={(open) => {
          setNoHeartsOpen(open);
          if (!open) router.push("/");
        }}
      />
    </div>
  );
}
