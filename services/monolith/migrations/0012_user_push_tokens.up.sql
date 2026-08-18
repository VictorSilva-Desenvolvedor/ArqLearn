-- user_push_tokens: tokens de push (Expo Push API, formato "ExponentPushToken[...]") por device —
-- um usuário pode ter várias linhas (vários devices/reinstalações). token é único: reinstalar
-- gera token novo, o antigo fica órfão (limpeza de tokens obsoletos fica fora de escopo por
-- ora — a pedido do usuário, ver Docs/PENDENCIAS_TESTE_DEVICE.md). platform é informativo
-- (filtragem futura), não obrigatório.
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_push_tokens_user ON user_push_tokens(user_id);
