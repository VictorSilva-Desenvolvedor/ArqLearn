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
  // Estado de navegação/progresso — azul primário, não laranja (reservado à camada de
  // gamificação/recompensa; ver DESIGN.md "The One Job Per Color Rule"). O nó atual e o callout
  // "Continuar lição" desta mesma tela já tinham sido corrigidos pra azul; só o badge e a borda
  // do card da unidade ficaram pra trás, deixando a Home com dois azuis e um laranja pro MESMO
  // estado. apps/mobile já usa "primary" aqui — isto também fecha a paridade.
  current: { label: "EM ANDAMENTO", tone: "primary" },
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
      {/* O card só existe quando há um subtítulo de verdade pra carregar. Antes ele repetia
          `title` — exatamente a mesma string do <h3> logo acima, 40px de distância, sem nenhuma
          informação nova (achado da auditoria visual da Home, 24/08/2026). O card do Stitch
          repete o nome da trilha porque LÁ o heading é genérico ("Unidade 1"); aqui o heading já
          é o nome da trilha, então a repetição virou ruído. `subtitle` vem de track.description,
          que desde 25/08/2026 É serializado pela API real (formalizado no struct `track`, na API
          Spec §3.3 e no Database Design §4.1 — v1.32). O campo é opcional e vem OMITIDO quando
          vazio, então o `{subtitle && ...}` abaixo é o que decide se a caixa existe: trilha sem
          descrição não deixa um card vazio na Home. */}
      {subtitle && (
        <Card
          padding="md"
          radius="xl"
          className={cn(
            "mb-xs",
            status === "current" && "border-primary shadow-gamified",
            status === "completed" && "border-primary bg-surface-gray",
          )}
        >
          <p className="font-body-md text-body-md font-bold text-on-surface-variant">{subtitle}</p>
        </Card>
      )}
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
