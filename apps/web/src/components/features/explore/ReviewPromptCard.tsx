import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface ReviewPromptCardProps {
  dueCount: number;
}

// "Revisar agora" (TDD §10.3) — só aparece quando GET /v1/review/summary diz que há algo vencido,
// entre todos os tópicos já praticados (não só o tema selecionado no momento). Espelha
// InfiniteModePromptCard, mas sem prop de tópico — a fila de revisão não é de um tema só.
export function ReviewPromptCard({ dueCount }: ReviewPromptCardProps) {
  if (dueCount <= 0) return null;

  return (
    <Card radius="xl" className="flex flex-col md:flex-row items-center justify-between gap-md bg-surface-gray">
      <div className="flex items-center gap-md">
        <Icon name="replay" filled className="text-4xl text-tertiary" />
        <div>
          <p className="font-display text-question-sm text-on-surface font-bold">Revisar agora</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {dueCount} {dueCount === 1 ? "item pronto" : "itens prontos"} pra revisão, de tudo que
            você já praticou.
          </p>
        </div>
      </div>
      <Link href="/revisao/sessao">
        <Button variant="gamification">Revisar</Button>
      </Link>
    </Card>
  );
}
