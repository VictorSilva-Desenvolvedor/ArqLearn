import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}

// Espelha apps/mobile/.../StatCard.tsx — onClick é opcional, só vira botão quando fornecido, pra
// não mudar quem já usa o componente sem a prop (ex.: resumo de lição).
export function StatCard({ icon, label, value, onClick }: StatCardProps) {
  const content = (
    <Card padding="md" radius="lg" className="flex flex-col items-center text-center gap-1">
      {icon}
      <span className="font-label text-stats-num font-bold text-on-surface">{value}</span>
      <span className="font-label text-label-caps uppercase text-on-surface-variant">{label}</span>
    </Card>
  );

  if (!onClick) return content;

  return (
    <button type="button" onClick={onClick} className="text-left w-full">
      {content}
    </button>
  );
}
