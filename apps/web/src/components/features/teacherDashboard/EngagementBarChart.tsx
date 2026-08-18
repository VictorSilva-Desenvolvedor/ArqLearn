import { Card } from "@/components/ui/Card";

interface EngagementBarChartProps {
  data: { day: string; value: number }[];
}

export function EngagementBarChart({ data }: EngagementBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card padding="md" radius="lg">
      <div className="flex items-end justify-between gap-sm h-40">
        {data.map((point) => (
          <div key={point.day} className="flex flex-col items-center justify-end h-full flex-1">
            <div
              className="w-full max-w-10 bg-primary rounded-t-md"
              style={{ height: `${(point.value / max) * 100}%` }}
              role="img"
              aria-label={`${point.day}: ${point.value}%`}
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
