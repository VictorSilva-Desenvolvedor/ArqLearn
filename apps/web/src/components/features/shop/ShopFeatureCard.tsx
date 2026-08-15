import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import type { ShopItem } from "@/types/api";

const featureIcon: Record<string, string> = {
  hearts_refill: "favorite",
  streak_freeze: "ac_unit",
};

interface ShopFeatureCardProps {
  item: ShopItem;
  disabled: boolean;
  pending: boolean;
  onPurchase: () => void;
}

export function ShopFeatureCard({ item, disabled, pending, onPurchase }: ShopFeatureCardProps) {
  return (
    <Card radius="xl" className="flex items-center justify-between gap-md">
      <div className="flex items-center gap-md">
        <Icon name={featureIcon[item.tipo] ?? "star"} filled className="text-4xl text-secondary" />
        <div>
          <p className="font-display text-question-sm text-on-surface font-bold">{item.name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
        </div>
      </div>
      <Button variant="gamification" disabled={disabled || pending} onClick={onPurchase}>
        {pending ? (
          <LoadingBlueprint size={18} />
        ) : (
          <>
            <Icon name="diamond" filled className="text-base" /> {item.price_gems}
          </>
        )}
      </Button>
    </Card>
  );
}
