-- Moeda e Loja (TDD §16) — livro-razão de gemas (item #1 do checklist técnico do documento de
-- moeda virtual: sem isso não dá pra corrigir erro nem investigar fraude), pacotes de gemas
-- comprados com dinheiro real (mockup — checkout fica 501 até um gateway existir, ver
-- internal/gamification/gempackages.go GemPackagePurchasesEnabled) com cupom manual como caminho
-- real hoje (mesmo padrão já usado pelo VIP, vip_coupons), e a aposta Double or Nothing.
CREATE TABLE gem_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- positivo = crédito, negativo = débito.
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'achievement', 'daily_chest', 'weekly_chest', 'shop_purchase',
    'bug_report_reward', 'gem_coupon', 'bet_stake', 'bet_payout'
  )),
  -- ex.: achievements.type, shop_items.id, gem_bets.id — sem FK (referencia tabelas diferentes
  -- dependendo de `reason`), só um texto livre pra rastreabilidade humana.
  reference_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gem_transactions_user_id_created_at_idx ON gem_transactions (user_id, created_at DESC);

CREATE TABLE gem_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gems_amount INTEGER NOT NULL CHECK (gems_amount > 0),
  price_brl_cents INTEGER NOT NULL CHECK (price_brl_cents > 0),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Catálogo inicial — mesma escada de materiais já usada em conquistas/personal records
-- (Terracota é o mais acessível, Ouro o maior). Preço calibrado contra o único preço real já em
-- produção (VIP R$29,90/mês, migrations anteriores): faixa larga, valor por gema melhora nos
-- pacotes maiores. Calibração inicial, não telemetria real — revisitar depois de estar no ar.
INSERT INTO gem_packages (name, gems_amount, price_brl_cents, sort_order) VALUES
  ('Pacote Terracota', 300, 490, 1),
  ('Pacote Bronze', 800, 1190, 2),
  ('Pacote Mármore', 2000, 2490, 3),
  ('Pacote Ouro', 5000, 4990, 4);

CREATE TABLE gem_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  gems_amount INTEGER NOT NULL CHECK (gems_amount > 0),
  created_by UUID NOT NULL REFERENCES users(id),
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gem_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stake_gems INTEGER NOT NULL CHECK (stake_gems >= 50),
  days_required SMALLINT NOT NULL DEFAULT 7,
  days_completed SMALLINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
-- No máximo 1 aposta 'active' por usuário — índice parcial único, mais forte que checar antes do
-- INSERT no código (protege contra corrida de duas requisições concorrentes de verdade).
CREATE UNIQUE INDEX gem_bets_one_active_per_user_idx ON gem_bets (user_id) WHERE status = 'active';
