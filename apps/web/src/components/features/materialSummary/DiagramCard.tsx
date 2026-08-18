import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

// Placeholder honesto: o material enviado pelo usuário não tem um diagrama gerado
// disponível no mock (o pipeline de IA que geraria isso ainda é stub no backend) — mostramos
// um espaço reservado identificado, em vez de inventar uma imagem.
export function DiagramCard({ caption }: { caption: string }) {
  return (
    <Card padding="lg" radius="lg" className="flex flex-col items-center justify-center gap-sm bg-surface-gray min-h-48">
      <Icon name="architecture" className="text-5xl text-outline" />
      <p className="font-label text-label-caps uppercase text-on-surface-variant text-center">{caption}</p>
    </Card>
  );
}
