import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { ShopItem } from "@/types/api";

interface ShopCosmeticItemProps {
  item: ShopItem;
  disabled: boolean;
  pending: boolean;
  // Já está no inventário do usuário (user_cosmetics) — achado do porte de gamificação: antes
  // disto, comprar de novo era possível sem aviso nenhum de que já tinha o item.
  owned: boolean;
  onPurchase: () => void;
}

// O Card não leva `interactive`: ele não tem onClick — quem compra é o botão de preço abaixo. Com
// `interactive` o card virava um role="button" focável que não fazia nada (dois pontos de
// tabulação para uma ação só, e o primeiro morto).
export function ShopCosmeticItem({ item, disabled, pending, owned, onPurchase }: ShopCosmeticItemProps) {
  return (
    <Card
      padding="md"
      radius="lg"
      className={cn("flex flex-col items-center text-center gap-xs relative", item.locked && "opacity-60")}
    >
      {item.is_new && !owned && (
        <Badge tone="secondary" className="absolute top-2 right-2">
          Novo
        </Badge>
      )}
      <Icon name="styler" filled className="text-4xl text-primary" />
      <p className="font-body-md text-body-md font-bold text-on-surface">{item.name}</p>
      {owned ? (
        <Badge tone="tertiary">Adquirido</Badge>
      ) : item.locked ? (
        <span className="font-label text-label-caps text-outline uppercase">
          Nível {item.requires_level}
        </span>
      ) : (
        <>
          {/* Pílula de verdade, não texto azul: é a mesma ação ("comprar") dos itens utilitários
              logo acima, que já usam Button — e a referência do Stitch desenha os cosméticos com
              um botão contornado, não com um preço solto. */}
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || pending}
            onClick={onPurchase}
            icon={<Icon name="diamond" filled className="text-base" />}
            className="font-label"
          >
            {item.price_gems} gemas
          </Button>
          {/* Botão desabilitado sozinho não deixa claro que é "sem gemas" — achado ao vivo no
              mobile, mesmo componente espelhado aqui. */}
          {disabled && !pending && (
            <span className="font-label text-label-caps text-error">Gemas insuficientes</span>
          )}
        </>
      )}
    </Card>
  );
}
