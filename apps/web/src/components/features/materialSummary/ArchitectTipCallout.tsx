import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export function ArchitectTipCallout({ tip }: { tip: string }) {
  return (
    <Card padding="md" radius="lg" className="bg-secondary-fixed border-secondary flex gap-sm">
      <Icon name="lightbulb" filled className="text-secondary text-2xl shrink-0" />
      <div>
        <p className="font-label-caps text-label-caps uppercase text-on-secondary-fixed-variant">
          Dica do Arquiteto
        </p>
        <p className="font-body-md text-body-md text-on-secondary-fixed">{tip}</p>
      </div>
    </Card>
  );
}
