import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { UploadSummaryKeyPoint } from "@/types/api";

interface KeyPointsChecklistProps {
  points: UploadSummaryKeyPoint[];
}

export function KeyPointsChecklist({ points }: KeyPointsChecklistProps) {
  return (
    <section className="flex flex-col gap-sm">
      <h2 className="flex items-center gap-sm font-display text-headline-md text-on-surface">
        <Icon name="fact_check" className="text-primary shrink-0" size={24} />
        O que você precisa saber
      </h2>
      {/* Superfície opaca (achado da auditoria de 25/08/2026, rodada 4): esta é a tela de leitura
          mais longa do app e o texto ficava direto sobre a grade blueprint animada do <body> — as
          linhas da grade cruzavam cada linha de texto. A referência do Stitch
          (resumo_simplificado_sistemas_construtivos/screen.png) também agrupa os pontos-chave
          dentro de um card branco com divisores. */}
      <Card padding="md" radius="lg" className="flex flex-col divide-y-2 divide-outline-variant">
        {points.map((point, index) => (
          <div key={point.title} className={index === 0 ? "flex gap-sm pb-md" : "flex gap-sm py-md last:pb-0"}>
            {/* Marcador de item de lista, não estado de sucesso: verde é reservado a
                sucesso/validação pela One Job Per Color Rule (apps/web/DESIGN.md) e um check
                verde aqui também lê como "você já domina isto", que é falso. */}
            <Icon name="check_circle" className="text-primary shrink-0" size={24} />
            <div>
              <p className="font-body-lg text-body-lg font-bold text-on-surface">{point.title}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{point.explanation}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
