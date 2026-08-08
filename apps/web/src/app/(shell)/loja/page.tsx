"use client";

import { useState } from "react";
import { mockShopCatalog } from "@/lib/api/mocks/fixtures/shopCatalog";
import { purchaseShopItem } from "@/lib/api/resources/gamification";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/hooks/useAuth";
import { ShopFeatureCard } from "@/components/features/shop/ShopFeatureCard";
import { ShopCosmeticItem } from "@/components/features/shop/ShopCosmeticItem";

const HEARTS_MAX = 5;

export default function ShopPage() {
  const { gamification, updateGamification } = useAuth();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featuredItems = mockShopCatalog.filter((item) => item.tipo !== "cosmetic");
  const cosmeticItems = mockShopCatalog.filter((item) => item.tipo === "cosmetic");

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
        <span className="flex items-center gap-1 font-label text-stats-num font-bold text-primary">
          {gamification.gems}
        </span>
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
              onPurchase={() => handlePurchase(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
