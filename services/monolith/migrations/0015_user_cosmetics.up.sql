-- user_cosmetics: inventário de posse dos itens category='cosmetic' da loja. `purchases` já
-- registra a transação (comprovante), mas não modela "o que o usuário tem hoje" nem se está
-- equipado — até aqui, comprar um cosmético não tinha nenhum efeito visível (Docs/
-- ArqLearn_Backlog_Gamificacao_Atelie.md, achado "Gemas/Loja — cosméticos"). `equipped` default
-- true: sem tela de "trocar equipado" ainda, então o cosmético já comprado fica sempre ativo —
-- suficiente enquanto existir no máximo 1 cosmético por "slot" visual (moldura de avatar, selo).
CREATE TABLE user_cosmetics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shop_items(id),
  equipped BOOLEAN NOT NULL DEFAULT true,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX idx_user_cosmetics_user_equipped ON user_cosmetics(user_id) WHERE equipped;
