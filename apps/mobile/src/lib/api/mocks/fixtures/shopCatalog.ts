import type { ShopItem } from "@/types/api";

// GET /v1/gamification/shop (catálogo) não existe no contrato — só
// POST /v1/gamification/shop/purchase, que já é real. Catálogo fica mock estático até o backend
// expor um endpoint de listagem — mas os `id` abaixo são os UUIDs reais de `shop_items`
// (migrations/0004_shop_items_seed), não placeholders: precisam bater exatamente pra
// POST /v1/gamification/shop/purchase encontrar a linha certa. Espelha
// apps/web/src/lib/api/mocks/fixtures/shopCatalog.ts — usado hoje só pelo NoHeartsDialog
// (item hearts_refill); os demais entram junto com a tela de Loja (Fase 5).
export const mockShopCatalog: ShopItem[] = [
  {
    id: "1fe51b82-7297-407e-b7b4-7b9e2c583b98",
    tipo: "hearts_refill",
    name: "Recarga de Vidas",
    description: "Restaure suas 5 vidas instantaneamente.",
    price_gems: 350,
  },
  {
    id: "bd64a8ca-c183-4a03-9c58-5bbfa73d87e1",
    tipo: "streak_freeze",
    name: "Bloqueio de Ofensiva",
    description: "Protege sua sequência caso você perca um dia de prática.",
    price_gems: 200,
  },
  {
    id: "41545ee7-29f2-4239-90f4-bc542db8b46a",
    tipo: "cosmetic",
    name: "Compasso Dourado",
    description: "Moldura de avatar exclusiva em dourado.",
    price_gems: 500,
  },
  {
    id: "8753e7c2-dffb-4a68-be24-7c3e72fb7722",
    tipo: "cosmetic",
    name: "Tablet Noturno",
    description: "Tema escuro alternativo para o app.",
    price_gems: 800,
    is_new: true,
  },
  {
    id: "cd540c6f-fc40-4054-aa1a-0543ec9a5980",
    tipo: "cosmetic",
    name: "Selo de Mestre",
    description: "Distintivo exclusivo para arquitetos de elite.",
    price_gems: 1200,
    requires_level: 10,
    locked: true,
  },
];
