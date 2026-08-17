-- VIP "Mestre Arquiteto" (a pedido do usuário) — entitlement de gamificação, não propriedade de
-- conta: fica em user_gamification junto de gems/streak_freezes/baú, mesmo raciocínio de
-- migrations/0009/0010. is_vip + vip_expires_at controlam todo benefício com expiração lazy (sem
-- cron), mesmo padrão de LoadHeartsWithRegen — null em vip_expires_at = sem VIP ativo.
-- vip_daily_chest_resets_used/date e vip_weekly_chest_resets_used/cycle_start seguem o mesmo
-- reset preguiçoso de chest_questions_today/date e chest_weekly_questions/cycle_start: o reset
-- semanal compara contra o chest_weekly_cycle_start já existente, não cria ciclo próprio.
-- vip_subscription_status é scaffold pro fluxo de assinatura recorrente (POST /v1/vip/subscribe),
-- que fica desabilitado nesta fase — sem gateway de pagamento integrado ainda.
ALTER TABLE user_gamification
  ADD COLUMN is_vip BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN vip_expires_at TIMESTAMPTZ,
  ADD COLUMN vip_daily_chest_resets_used SMALLINT NOT NULL DEFAULT 0 CHECK (vip_daily_chest_resets_used >= 0),
  ADD COLUMN vip_daily_chest_resets_date DATE,
  ADD COLUMN vip_weekly_chest_resets_used SMALLINT NOT NULL DEFAULT 0 CHECK (vip_weekly_chest_resets_used >= 0),
  ADD COLUMN vip_weekly_chest_resets_cycle_start DATE,
  ADD COLUMN vip_subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (vip_subscription_status IN ('none', 'pending', 'active', 'canceled'));

-- vip_coupons: cupons de 10 dígitos numéricos gerados por um admin (POST /v1/vip/coupons) e
-- entregues manualmente pelo usuário fora do sistema — resgatáveis uma única vez
-- (POST /v1/vip/coupons/redeem). Não há painel admin no projeto ainda, então esse endpoint é
-- chamado direto (curl/Postman), documentado na API Spec.
CREATE TABLE vip_coupons (
  id UUID PRIMARY KEY,
  code CHAR(10) NOT NULL UNIQUE,
  duration_days SMALLINT NOT NULL CHECK (duration_days > 0),
  created_by UUID NOT NULL REFERENCES users(id),
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
