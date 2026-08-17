import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { ShopItem } from "@/types/api";

interface ShopCosmeticItemProps {
  item: ShopItem;
  disabled: boolean;
  pending: boolean;
  onPurchase: () => void;
}

export function ShopCosmeticItem({ item, disabled, pending, onPurchase }: ShopCosmeticItemProps) {
  return (
    <Card
      padding="md"
      radius="lg"
      interactive={!item.locked}
      className={cn("flex flex-col items-center text-center gap-xs relative", item.locked && "opacity-60")}
    >
      {item.is_new && (
        <Badge tone="secondary" className="absolute top-2 right-2">
          Novo
        </Badge>
      )}
      <Icon name="styler" filled className="text-4xl text-primary" />
      <p className="font-body-md text-body-md font-bold text-on-surface">{item.name}</p>
      {item.locked ? (
        <span className="font-label-caps text-label-caps text-outline uppercase">
          Nível {item.requires_level}
        </span>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled || pending}
            onClick={onPurchase}
            className="flex items-center gap-1 font-label text-body-sm font-bold text-primary disabled:opacity-50"
          >
            <Icon name="diamond" filled className="text-base" /> {item.price_gems} gemas
          </button>
          {/* Botão desabilitado sozinho não deixa claro que é "sem gemas" — achado ao vivo no
              mobile, mesmo componente espelhado aqui. */}
          {disabled && !pending && (
            <span className="font-label-caps text-label-caps text-error">Gemas insuficientes</span>
          )}
        </>
      )}
    </Card>
  );
}
