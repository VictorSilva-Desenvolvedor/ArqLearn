import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { CurrentLessonNode } from "./CurrentLessonNode";
import { LessonNode, type LessonNodeVariant } from "./LessonNode";
import { PathConnector } from "./PathConnector";

// "available" = tem lição com pergunta de verdade, mas nada foi começado ainda (não é mais
// "bloqueado" — a trilha inteira ficava esmaecida mesmo tendo conteúdo pronto pra praticar).
// "construction" = nenhuma lição da trilha tem pergunta aprovada ainda. Espelha
// apps/mobile/.../UnitSection.tsx.
export type UnitStatus = "completed" | "current" | "available" | "construction";

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
  available: { label: "DISPONÍVEL", tone: "primary" },
  construction: { label: "EM CONSTRUÇÃO", tone: "neutral" },
};

export function UnitSection({ title, subtitle, status, nodes }: UnitSectionProps) {
  const badge = statusBadge[status];

  return (
    <div className={cn("w-full mb-12", status === "construction" && "opacity-60")}>
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
        {nodes.length > 1 && <PathConnector dashed={status === "current"} />}
        {nodes.map((node, index) => (
          <div
            key={node.lessonId}
            className="relative z-10"
            // 32px == --spacing-xl — via var() em vez de repetir o número mágico, pra continuar
            // preso à escala se ela mudar (mesmo padrão a corrigir em apps/mobile/UnitSection.tsx).
            style={{
              transform: `translateX(${index % 2 === 0 ? "calc(-1 * var(--spacing-xl))" : "var(--spacing-xl)"})`,
            }}
          >
            {node.variant === "current" ? (
              <CurrentLessonNode icon={node.icon} href={node.href} ctaLabel={node.ctaLabel} />
            ) : (
              <LessonNode variant={node.variant} icon={node.icon} href={node.href} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
