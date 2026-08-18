"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getVipStatus, redeemVipCoupon } from "@/lib/api/resources/vip";
import type { VipStatus } from "@/types/api";

// Página VIP "Mestre Arquiteto" (a pedido do usuário), adaptada do mockup "Assinatura VIP" pros
// tokens reais do app. Espelha apps/mobile/src/app/vip.tsx.
const BENEFITS: { icon: string; title: string; description: string }[] = [
  {
    icon: "workspace_premium",
    title: "Baú Semanal Garantido",
    description: "Seu Baú Semanal sempre vem com um Bloqueio de Ofensiva garantido, sem sorteio.",
  },
  {
    icon: "bolt",
    title: "+25% de XP",
    description: "Todo XP ganho em respostas certas recebe um bônus de 25%.",
  },
  {
    icon: "replay",
    title: "Resets Extras",
    description: "1 reset a mais no Baú Diário por dia e 2 resets a mais no Baú Semanal por ciclo.",
  },
  {
    icon: "crown",
    title: "Perfil de Mestre Arquiteto",
    description: "Coroa, nome em destaque e selo exclusivo no seu perfil.",
  },
];

function formatExpiresAt(iso: string | null): string {
  if (!iso) return "Vitalício";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function VipPage() {
  const { gamification, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVipStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRedeem = async () => {
    if (redeeming || code.trim().length === 0) return;
    setError(null);
    setRedeeming(true);
    try {
      const result = await redeemVipCoupon(code.trim());
      updateGamification({ is_vip: result.is_vip, vip_expires_at: result.vip_expires_at });
      setStatus((current) => (current ? { ...current, is_vip: result.is_vip, vip_expires_at: result.vip_expires_at } : current));
      setCode("");
      showToast("VIP ativado! Bem-vindo, Mestre Arquiteto.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resgatar o cupom agora.");
    } finally {
      setRedeeming(false);
    }
  };

  const isVip = gamification.is_vip;

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex flex-col items-center text-center gap-sm">
        <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
          <Icon name="crown" filled className="text-4xl" />
        </div>
        <h1 className="font-display text-display-lg font-bold text-secondary">Mestre Arquiteto</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Eleve sua jornada com baús garantidos, mais XP e um perfil de destaque.
        </p>
      </div>

      {isVip && (
        <Card padding="lg" className="flex flex-col items-center text-center gap-xs border-secondary">
          <Badge tone="gold">VIP Ativo</Badge>
          <h2 className="font-display text-headline-md font-bold text-on-surface">Sua assinatura está ativa</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Válido até: {formatExpiresAt(gamification.vip_expires_at)}
          </p>
          {status && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Resets disponíveis: {status.daily_chest_resets_max - status.daily_chest_resets_used} diário ·{" "}
              {status.weekly_chest_resets_max - status.weekly_chest_resets_used} semanal
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} padding="md" className="flex flex-col gap-1">
            <Icon name={benefit.icon} filled className="text-3xl text-secondary" />
            <h3 className="font-question-lg text-question-lg font-semibold text-on-surface">{benefit.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{benefit.description}</p>
          </Card>
        ))}
      </div>

      {!isVip && (
        <Card padding="lg" className="flex flex-col gap-sm">
          <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">Já tenho um cupom</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Digite o código de 10 dígitos que você recebeu.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={10}
            placeholder="0000000000"
            className="border-2 border-outline-variant bg-surface rounded-md px-md py-sm text-body-lg text-on-surface tracking-widest"
          />
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <Button
            variant="primary"
            fullWidth
            disabled={redeeming || code.trim().length !== 10}
            onClick={handleRedeem}
            icon={<Icon name="confirmation_number" />}
          >
            {redeeming ? "Resgatando…" : "Resgatar Cupom"}
          </Button>
        </Card>
      )}

      {!isVip && (
        <Card padding="lg" className="flex flex-col items-center text-center gap-sm">
          <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">Torne-se Mestre Arquiteto</h2>
          <div className="flex items-end gap-1">
            <span className="font-display text-display-lg font-bold text-on-surface">R$ 29,90</span>
            <span className="font-body-md text-body-md text-on-surface-variant mb-1">/ mês</span>
          </div>
          <Button variant="primary" fullWidth disabled>
            Assinar — Em breve
          </Button>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Assinatura por cartão ainda não está disponível.{" "}
            <a href="/ajuda" className="text-primary hover:underline">
              Fale com a gente em Ajuda
            </a>{" "}
            pra saber como conseguir um cupom.
          </p>
        </Card>
      )}
    </div>
  );
}
