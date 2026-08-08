import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card padding="md" radius="lg" className="flex items-center gap-sm">
      {icon}
      <div>
        <p className="font-label text-stats-num font-bold text-on-surface">{value}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{label}</p>
      </div>
    </Card>
  );
}
