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
        <div className="absolute -top-12 bg-surface-bright border-2 border-secondary text-secondary font-label-caps text-label-caps px-3 py-1 rounded-lg shadow-md flex flex-col items-center whitespace-nowrap">
          {ctaLabel}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-secondary absolute -bottom-[10px]" />
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        className="w-20 h-20 rounded-full bg-secondary text-on-secondary border-4 border-surface-bright shadow-[0_0_0_2px_var(--color-secondary)] flex items-center justify-center hover:scale-105 transition-transform"
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
