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
  level: number;
  // variant (TDD §10.3): "review" troca título/selo/rótulo de saída pra refletir a fila de
  // revisão do SRS ("Revisar agora") em vez do Modo Infinito por tópico — mesmo componente, sem
  // duplicar a tela inteira.
  variant?: "infinite" | "review";
}

export function InfiniteModeHeader({ topicLabel, current, total, level, variant = "infinite" }: InfiniteModeHeaderProps) {
  const router = useRouter();
  const isReview = variant === "review";

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant px-md py-sm">
      <div className="flex items-center gap-md max-w-2xl mx-auto mb-xs">
        <IconButton
          icon={<Icon name="close" />}
          label={isReview ? "Sair da Revisão" : "Sair do Modo Infinito"}
          onClick={() => router.push("/explorar")}
        />
        <div className="flex-1">
          <p className="font-display text-question-sm text-on-surface font-bold">
            {isReview ? "Revisão" : `Modo Infinito: ${topicLabel}`}
          </p>
        </div>
        <Badge tone="primary">Nível {level}</Badge>
        <Badge tone="error">{isReview ? "Revisão" : "Dificuldade Elevada"}</Badge>
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
