import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export type LessonNodeVariant = "completed" | "current" | "locked" | "checkpoint" | "foggy";

interface LessonNodeProps {
  variant: Exclude<LessonNodeVariant, "current">;
  icon: string;
  href?: string;
}

export function LessonNode({ variant, icon, href }: LessonNodeProps) {
  // Missão longe demais da posição atual (mais de 5 lições à frente) — nem o ícone da matéria
  // aparece, só névoa. Some conforme o jogador avança e a lição entra na janela das próximas 5
  // (vira "locked" normal, com ícone visível).
  if (variant === "foggy") {
    return (
      <div
        className="w-16 h-16 rounded-full bg-surface-gray/70 border-2 border-outline-variant/50 flex items-center justify-center cursor-not-allowed backdrop-blur-[2px]"
        aria-disabled
        aria-label="Missão ainda encoberta pela névoa"
      >
        <Icon name="foggy" className="text-3xl text-outline/60" />
      </div>
    );
  }

  if (variant === "checkpoint") {
    return (
      <Link
        href={href ?? "#"}
        className="w-20 h-20 rounded-xl bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-gamified rotate-45"
      >
        <Icon name={icon} filled className="text-4xl -rotate-45" />
      </Link>
    );
  }

  if (variant === "completed") {
    return (
      <Link
        href={href ?? "#"}
        className="w-16 h-16 rounded-full bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-gamified"
      >
        {/* "completed" sempre mostra check — não depende de nenhum dado mockado atribuir esse
            ícone à lição; o ícone da matéria (`icon`) só faz sentido pra checkpoint/locked. */}
        <Icon name="check" filled className="text-3xl" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full bg-surface-gray text-outline border-2 border-outline-variant flex items-center justify-center cursor-not-allowed",
      )}
      aria-disabled
    >
      <Icon name={icon} className="text-3xl" />
    </div>
  );
}
