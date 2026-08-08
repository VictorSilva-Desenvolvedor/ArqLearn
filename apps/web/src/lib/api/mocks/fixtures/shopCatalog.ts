import type { ShopItem } from "@/types/api";

// GET /v1/gamification/shop (catálogo) não existe no contrato — só
// POST /v1/gamification/shop/purchase. Catálogo fica mock estático até o backend expor um
// endpoint de listagem.
export const mockShopCatalog: ShopItem[] = [
  {
    id: "item-hearts-refill",
    tipo: "hearts_refill",
    name: "Recarga de Vidas",
    description: "Restaure suas 5 vidas instantaneamente.",
    price_gems: 350,
  },
  {
    id: "item-streak-freeze",
    tipo: "streak_freeze",
    name: "Bloqueio de Ofensiva",
    description: "Protege sua sequência caso você perca um dia de prática.",
    price_gems: 200,
  },
  {
    id: "item-compasso-dourado",
    tipo: "cosmetic",
    name: "Compasso Dourado",
    description: "Moldura de avatar exclusiva em dourado.",
    price_gems: 500,
  },
  {
    id: "item-tablet-noturno",
    tipo: "cosmetic",
    name: "Tablet Noturno",
    description: "Tema escuro alternativo para o app.",
    price_gems: 800,
    is_new: true,
  },
  {
    id: "item-selo-mestre",
    tipo: "cosmetic",
    name: "Selo de Mestre",
    description: "Distintivo exclusivo para arquitetos de elite.",
    price_gems: 1200,
    requires_level: 10,
    locked: true,
  },
];
