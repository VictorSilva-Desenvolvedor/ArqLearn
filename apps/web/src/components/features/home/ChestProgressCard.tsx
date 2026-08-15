import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/cn";

interface ChestProgressCardProps {
  title: string;
  questionsCurrent: number;
  questionsRequired: number;
  available: boolean;
  claimed: boolean;
  href: string;
}

// Cards de progresso do Baú Diário/Semanal na Home (a pedido do usuário, mockup Stitch com os dois
// baús lado a lado) — sempre visíveis (não só quando disponível), pra dar visibilidade contínua do
// progresso. Clicável mesmo indisponível: leva pra /bau, que já trata o estado "ainda não
// disponível" (mensagem + botão voltar), então não é um beco sem saída. Espelha
// apps/mobile/.../ChestProgressCard.tsx.
export function ChestProgressCard({
  title,
  questionsCurrent,
  questionsRequired,
  available,
  claimed,
  href,
}: ChestProgressCardProps) {
  const statusLabel = available
    ? "Disponível!"
    : claimed
      ? "Já resgatado"
      : `${Math.min(questionsCurrent, questionsRequired)}/${questionsRequired} questões`;

  return (
    <Link href={href} className="block">
      <Card
        radius="xl"
        className={cn(
          "flex flex-col items-center gap-xs text-center relative overflow-hidden transition-colors hover:border-primary cursor-pointer",
          available ? "border-secondary" : "border-primary",
        )}
      >
        <Icon
          name="redeem"
          filled
          className={cn("text-4xl", available ? "text-secondary" : "text-primary")}
        />
        <div>
          <p className="font-body-md font-bold text-primary">{title}</p>
          <p className="font-stats-num text-body-sm text-secondary">{statusLabel}</p>
        </div>
        <ProgressBar value={questionsCurrent} max={questionsRequired} variant="thin" tone="secondary" />
      </Card>
    </Link>
  );
}
