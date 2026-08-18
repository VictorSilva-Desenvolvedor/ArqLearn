"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

interface SummaryHeaderProps {
  title: string;
  eyebrow?: string;
}

export function SummaryHeader({ title, eyebrow = "Resumo Inteligente" }: SummaryHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant px-md py-sm">
      <div className="flex items-center gap-sm max-w-2xl mx-auto">
        <IconButton icon={<Icon name="arrow_back" />} label="Voltar" onClick={() => router.back()} />
        <div>
          <p className="font-label text-label-caps uppercase text-on-surface-variant">{eyebrow}</p>
          <h1 className="font-display text-question-lg text-on-surface font-bold">{title}</h1>
        </div>
      </div>
    </header>
  );
}
