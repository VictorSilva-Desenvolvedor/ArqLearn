import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { CurrentLessonNode } from "./CurrentLessonNode";
import { FogOverlay } from "./FogOverlay";
import { LessonNode, type LessonNodeVariant } from "./LessonNode";
import { PathConnector } from "./PathConnector";

export type UnitStatus = "completed" | "current" | "locked";

export interface UnitNodeData {
  lessonId: string;
  icon: string;
  variant: LessonNodeVariant;
  href: string;
  ctaLabel?: string;
}

interface UnitSectionProps {
  title: string;
  subtitle?: string;
  status: UnitStatus;
  nodes: UnitNodeData[];
}

const statusBadge: Record<UnitStatus, { label: string; tone: "primary" | "secondary" | "neutral" }> = {
  completed: { label: "CONCLUÍDO", tone: "primary" },
  current: { label: "EM ANDAMENTO", tone: "secondary" },
  locked: { label: "BLOQUEADO", tone: "neutral" },
};

// Quantos nós "foggy" de fachada renderizar depois do último visível de verdade — fixo, não
// escala com quantas lições realmente existem depois. Sem isso, dava pra rolar a página, medir a
// altura da névoa e contar exatamente quantas lições estão escondidas (o problema que o usuário
// apontou) — truncar o DOM aqui é o que garante que o mesmo visual apareça tanto se faltam 3
// lições quanto se faltam 300.
const TEASER_FOGGY_COUNT = 2;

export function UnitSection({ title, subtitle, status, nodes }: UnitSectionProps) {
  const badge = statusBadge[status];
  const firstFoggyIndex = nodes.findIndex((n) => n.variant === "foggy");
  // Só o necessário pra "espiar" a névoa chega no DOM — o resto (por mais lições que existam de
  // verdade) nem é renderizado, então não tem altura real pra medir.
  const visibleNodes = firstFoggyIndex >= 0 ? nodes.slice(0, firstFoggyIndex + TEASER_FOGGY_COUNT) : nodes;
  // Começa a névoa um pouco antes do primeiro nó "foggy" (não em cima dele) — esmaece gradual em
  // vez de corte seco. Calculado sobre visibleNodes (não nodes) — é essa lista que define a
  // altura real do container.
  const fogTopPercent =
    firstFoggyIndex >= 0 ? Math.max(0, (firstFoggyIndex / visibleNodes.length) * 100 - 10) : null;

  return (
    <div className={cn("w-full mb-12", status === "locked" && "opacity-60")}>
      <div className="flex items-center justify-between mb-sm px-4">
        <h3 className="font-display text-headline-md text-on-surface">{title}</h3>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <Card
        padding="md"
        radius="xl"
        className={cn(
          "mb-xs",
          status === "current" && "border-secondary shadow-gamified",
          status === "completed" && "border-primary bg-surface-gray",
        )}
      >
        <p
          className={cn(
            "font-body-md text-body-md font-bold",
            status === "current" ? "text-secondary" : "text-on-surface-variant",
          )}
        >
          {title}
        </p>
        {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </Card>
      <div className="relative flex flex-col items-center gap-8 py-6 overflow-hidden">
        {visibleNodes.length > 1 && <PathConnector dashed={status === "current"} />}
        {visibleNodes.map((node, index) => (
          <div
            key={node.lessonId}
            className="relative z-10"
            style={{ transform: `translateX(${index % 2 === 0 ? -32 : 32}px)` }}
          >
            {node.variant === "current" ? (
              <CurrentLessonNode icon={node.icon} href={node.href} ctaLabel={node.ctaLabel} />
            ) : (
              <LessonNode variant={node.variant} icon={node.icon} href={node.href} />
            )}
          </div>
        ))}
        {fogTopPercent !== null && <FogOverlay topPercent={fogTopPercent} />}
      </div>
    </div>
  );
}
