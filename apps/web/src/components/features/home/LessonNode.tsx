import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

// "available" = tem pergunta aprovada de verdade, mas o usuário ainda não começou — navegável,
// fora de ordem (sem bloqueio por sequência fake). "construction" = sem nenhuma pergunta
// aprovada ainda, não navegável — mostra o ícone de "em construção" em vez do ícone normal da
// lição. Espelha apps/mobile/.../LessonNode.tsx.
export type LessonNodeVariant = "completed" | "current" | "available" | "construction" | "checkpoint";

interface LessonNodeProps {
  variant: Exclude<LessonNodeVariant, "current">;
  icon: string;
  href?: string;
}

export function LessonNode({ variant, icon, href }: LessonNodeProps) {
  if (variant === "checkpoint") {
    return (
      <Link
        href={href ?? "#"}
        aria-label="Checkpoint — toque para abrir"
        className="w-20 h-20 rounded-xl bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-gamified rotate-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name={icon} filled className="text-4xl -rotate-45" />
      </Link>
    );
  }

  if (variant === "completed") {
    return (
      <Link
        href={href ?? "#"}
        aria-label="Lição concluída — toque para revisar"
        className="w-16 h-16 rounded-full bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform shadow-gamified focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {/* "completed" sempre mostra check — não depende de nenhum dado mockado atribuir esse
            ícone à lição; o ícone da matéria (`icon`) só faz sentido pra checkpoint/available. */}
        <Icon name="check" filled className="text-3xl" />
      </Link>
    );
  }

  if (variant === "available") {
    return (
      <Link
        href={href ?? "#"}
        className="w-16 h-16 rounded-full bg-surface-bright text-primary border-2 border-primary flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Lição disponível — toque para começar"
      >
        <Icon name={icon} className="text-3xl" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full bg-surface-gray text-outline border-2 border-dashed border-outline-variant flex items-center justify-center cursor-not-allowed",
      )}
      // role="button" + aria-disabled: um <div> sem role não garante que aria-disabled seja
      // anunciado por leitor de tela — precisa de um role de widget pra esse estado valer.
      role="button"
      aria-disabled="true"
      aria-label="Lição em construção — ainda sem conteúdo"
    >
      <Icon name="construction" className="text-2xl" />
    </div>
  );
}
