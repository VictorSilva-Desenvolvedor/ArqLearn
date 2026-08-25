import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface EngagementBarChartProps {
  data: { day: string; value: number }[];
}

export function EngagementBarChart({ data }: EngagementBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card padding="md" radius="lg">
      {/* O valor de cada barra só existia no aria-label: quem enxerga via cinco retângulos iguais
          sem escala, sem eixo e sem número — um gráfico que não informa nada além de "tem mais
          num dia que no outro". O rótulo numérico acima da barra e o destaque do pico (em
          secondary) são o que a referência do Stitch faz (painel_do_professor/screen.png, barra
          de pico em laranja + legenda "Pico na Sexta"). */}
      <div className="flex items-end justify-between gap-sm h-40">
        {data.map((point) => (
          <div key={point.day} className="flex flex-col items-center justify-end h-full flex-1 gap-1">
            <span className="font-label text-body-sm text-on-surface-variant">{point.value}%</span>
            <div
              className={cn(
                "w-full max-w-10 rounded-t-md",
                point.value === max ? "bg-secondary" : "bg-primary",
              )}
              style={{ height: `${(point.value / max) * 100}%` }}
              role="img"
              aria-label={`${point.day}: ${point.value}%${point.value === max ? " (pico da semana)" : ""}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-sm mt-1">
        {data.map((point) => (
          <span
            key={point.day}
            className="flex-1 text-center font-label text-label-caps text-on-surface-variant"
          >
            {point.day}
          </span>
        ))}
      </div>
    </Card>
  );
}
