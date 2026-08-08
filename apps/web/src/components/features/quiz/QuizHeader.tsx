"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatPill } from "@/components/ui/StatPill";

interface QuizHeaderProps {
  currentIndex: number;
  total: number;
  hearts: number;
  gems: number;
}

export function QuizHeader({ currentIndex, total, hearts, gems }: QuizHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface-bright/90 backdrop-blur-md border-b-2 border-outline-variant px-md py-sm">
      <div className="flex items-center gap-md max-w-2xl mx-auto">
        <IconButton icon={<Icon name="close" />} label="Sair da lição" onClick={() => router.push("/")} />
        <ProgressBar value={currentIndex} max={total} variant="thin" tone="primary" className="flex-1" />
        <StatPill tone="secondary" icon={<Icon name="favorite" filled className="text-secondary" />} value={hearts} />
        <StatPill tone="primary" icon={<Icon name="diamond" filled className="text-primary" />} value={gems} />
      </div>
    </header>
  );
}
