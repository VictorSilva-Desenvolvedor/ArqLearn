-- Catálogo real da Loja (API Spec §8, POST /v1/gamification/shop/purchase) — shop_items existia
-- desde 0001_init mas nunca foi populada. Sem GET de listagem no contrato (a tela usa um catálogo
-- estático no frontend pra exibição — ver apps/web/.../mocks/fixtures/shopCatalog.ts — só a
-- compra em si precisa ser real), então os ids abaixo têm que bater exatamente com os do mock.
--
-- category usa "hearts_refill" (não "heart_refill" do comentário original em 0001_init) pra bater
-- exatamente com ShopItemType no frontend — não há CHECK constraint travando isso, então ajustar
-- aqui é seguro.
INSERT INTO shop_items (id, name, category, price_gems, active) VALUES
  ('1fe51b82-7297-407e-b7b4-7b9e2c583b98', 'Recarga de Vidas', 'hearts_refill', 350, true),
  ('bd64a8ca-c183-4a03-9c58-5bbfa73d87e1', 'Bloqueio de Ofensiva', 'streak_freeze', 200, true),
  ('41545ee7-29f2-4239-90f4-bc542db8b46a', 'Compasso Dourado', 'cosmetic', 500, true),
  ('8753e7c2-dffb-4a68-be24-7c3e72fb7722', 'Tablet Noturno', 'cosmetic', 800, true),
  ('cd540c6f-fc40-4054-aa1a-0543ec9a5980', 'Selo de Mestre', 'cosmetic', 1200, true);
