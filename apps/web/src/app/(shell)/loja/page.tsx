"use client";

import Link from "next/link";
import { useState } from "react";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { purchaseShopItem } from "@/lib/api/resources/gamification";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ShopFeatureCard } from "@/components/features/shop/ShopFeatureCard";
import { ShopCosmeticItem } from "@/components/features/shop/ShopCosmeticItem";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const HEARTS_MAX = 5;

export default function ShopPage() {
  const { gamification, updateGamification, adjustStreakFreezes } = useAuth();
  const { showToast } = useToast();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featuredItems = mockShopCatalog.filter((item) => item.tipo !== "cosmetic");
  const cosmeticItems = mockShopCatalog.filter((item) => item.tipo === "cosmetic");
  const ownedCosmeticIds = new Set(gamification.cosmetics.map((c) => c.item_id));

  const handlePurchase = async (itemId: string) => {
    setError(null);
    setPendingItemId(itemId);
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await purchaseShopItem(itemId, idempotencyKey);
      updateGamification({
        gems: result.gems_restantes,
        ...(result.item.tipo === "hearts_refill" ? { hearts_current: HEARTS_MAX } : {}),
      });
      if (result.item.tipo === "streak_freeze") {
        adjustStreakFreezes(1);
      }
      const purchasedName = mockShopCatalog.find((i) => i.id === result.item.id)?.name ?? "Item";
      if (result.item.tipo === "cosmetic" && !ownedCosmeticIds.has(result.item.id)) {
        updateGamification({
          cosmetics: [
            ...gamification.cosmetics,
            { item_id: result.item.id, name: purchasedName, equipped: true, acquired_at: new Date().toISOString() },
          ],
        });
      }
      showToast(`${purchasedName} comprado!`, "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Não foi possível concluir a compra.");
      }
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-lg font-bold text-on-surface">Loja da Arquiteta</h1>
        <Link href="/loja/extrato" className="flex items-center gap-1 font-label text-stats-num font-bold text-primary hover:underline">
          <Icon name="diamond" filled className="text-xl" />
          {gamification.gems}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-sm">
        <Link href="/loja/gemas">
          <Card padding="md" interactive className="flex items-center gap-sm h-full">
            <Icon name="diamond" filled className="text-2xl text-primary" />
            <div>
              <p className="font-body-md text-body-md font-semibold text-on-surface">Comprar Gemas</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Pacotes e cupons</p>
            </div>
          </Card>
        </Link>
        <Link href="/loja/aposta">
          <Card padding="md" interactive className="flex items-center gap-sm h-full">
            <Icon name="casino" filled className="text-2xl text-tertiary" />
            <div>
              <p className="font-body-md text-body-md font-semibold text-on-surface">Double or Nothing</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Aposte no seu streak</p>
            </div>
          </Card>
        </Link>
      </div>

      {error && (
        <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-sm">
        {featuredItems.map((item) => (
          <ShopFeatureCard
            key={item.id}
            item={item}
            disabled={gamification.gems < item.price_gems}
            pending={pendingItemId === item.id}
            onPurchase={() => handlePurchase(item.id)}
          />
        ))}
      </div>

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Itens Cosméticos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
          {cosmeticItems.map((item) => (
            <ShopCosmeticItem
              key={item.id}
              item={item}
              disabled={gamification.gems < item.price_gems}
              pending={pendingItemId === item.id}
              owned={ownedCosmeticIds.has(item.id)}
              onPurchase={() => handlePurchase(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
