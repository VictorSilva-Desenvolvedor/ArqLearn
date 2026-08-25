"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatPill } from "@/components/ui/StatPill";
import { HeartsRow } from "./HeartsRow";
import { useLessonDownload } from "@/hooks/useLessonDownload";

interface QuizHeaderProps {
  currentIndex: number;
  total: number;
  hearts: number;
  gems: number;
  // Só a sessão de lição de trilha tem esse conceito (spec §9) — Modo Infinito é geração
  // sob demanda, não tem "lição" fixa pra marcar como disponível offline.
  lessonId?: string;
}

export function QuizHeader({ currentIndex, total, hearts, gems, lessonId }: QuizHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant px-md py-sm">
      {/* flex-wrap + basis-full: numa largura de telefone os 5 corações + gemas + download + sair
          espremiam a barra de progresso até ~10px (medido em 390px na auditoria de 25/08/2026) —
          o dado mais importante do cabeçalho virava um pontinho cinza. Abaixo de `sm` a barra cai
          para uma linha própria; de `sm` pra cima o layout de uma linha só continua igual. */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-md gap-y-xs max-w-2xl mx-auto">
        <IconButton icon={<Icon name="close" />} label="Sair da lição" onClick={() => router.push("/")} />
        <ProgressBar
          value={currentIndex}
          max={total}
          variant="thin"
          tone="primary"
          className="flex-1 order-last basis-full sm:order-none sm:basis-auto"
        />
        {lessonId && <LessonDownloadToggle lessonId={lessonId} />}
        <HeartsRow hearts={hearts} />
        <StatPill tone="secondary" icon={<Icon name="diamond" filled className="text-secondary" />} value={gems} />
      </div>
    </header>
  );
}

function LessonDownloadToggle({ lessonId }: { lessonId: string }) {
  const { downloaded, toggle } = useLessonDownload(lessonId);
  return (
    <IconButton
      icon={<Icon name={downloaded ? "download_done" : "download"} filled={downloaded} />}
      label={downloaded ? "Remover download — lição não ficará disponível offline" : "Baixar lição para uso offline"}
      onClick={toggle}
      className={downloaded ? "text-secondary" : undefined}
    />
  );
}
