"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface InfiniteModeHeaderProps {
  topicLabel: string;
  current: number;
  total: number;
}

export function InfiniteModeHeader({ topicLabel, current, total }: InfiniteModeHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant px-md py-sm">
      <div className="flex items-center gap-md max-w-2xl mx-auto mb-xs">
        <IconButton icon={<Icon name="close" />} label="Sair do Modo Infinito" onClick={() => router.push("/explorar")} />
        <div className="flex-1">
          <p className="font-display text-question-sm text-on-surface font-bold">Modo Infinito: {topicLabel}</p>
        </div>
        <Badge tone="error">Dificuldade Elevada</Badge>
      </div>
      <div className="flex items-center gap-sm max-w-2xl mx-auto">
        <ProgressBar value={current} max={total} variant="thin" tone="secondary" className="flex-1" />
        <span className="font-label text-body-sm text-on-surface-variant whitespace-nowrap">
          {current}/{total}
        </span>
      </div>
    </header>
  );
}
