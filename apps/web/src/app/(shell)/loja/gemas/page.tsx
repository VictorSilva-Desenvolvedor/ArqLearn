"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getGemPackages, redeemGemCoupon } from "@/lib/api/resources/gems";
import type { GemPackage } from "@/types/api";

// Pacotes de gemas (TDD §15.2) — mesmo molde de app/(shell)/vip/page.tsx: catálogo real, compra
// por cartão travada em mockup (botão desabilitado, "Em breve"), cupom como caminho funcional
// hoje. Espelha apps/mobile/src/app/loja/gemas.tsx.
function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GemPackagesPage() {
  const { gamification, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<GemPackage[]>([]);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGemPackages().then((data) => {
      if (!cancelled) setPackages(data);
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
      const result = await redeemGemCoupon(code.trim());
      updateGamification({ gems: result.gems });
      setCode("");
      showToast(`+${result.gems_credited} gemas creditadas!`, "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resgatar o cupom agora.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex flex-col items-center text-center gap-sm">
        <div className="w-16 h-16 rounded-xl bg-primary-container text-on-primary-container border-2 border-primary flex items-center justify-center">
          <Icon name="diamond" filled className="text-4xl" />
        </div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">Pacotes de Gemas</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Você tem <span className="font-bold text-on-surface">{gamification.gems}</span> gemas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {packages.map((pkg) => (
          <Card key={pkg.id} padding="lg" className="flex flex-col items-center text-center gap-sm">
            {pkg.name === "Pacote Ouro" && <Badge tone="gold">Melhor valor</Badge>}
            <Icon name="diamond" filled className="text-3xl text-primary" />
            <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">{pkg.name}</h2>
            <p className="font-display text-headline-md font-bold text-on-surface">{pkg.gems_amount} gemas</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{formatBRL(pkg.price_brl_cents)}</p>
            <Button variant="ghost" fullWidth disabled>
              Comprar — Em breve
            </Button>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="flex flex-col gap-sm">
        <h2 className="font-question-lg text-question-lg font-semibold text-on-surface">Já tenho um código</h2>
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
          {redeeming ? "Resgatando…" : "Resgatar Código"}
        </Button>
      </Card>

      <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
        Compra por cartão ainda não está disponível.{" "}
        <a href="/ajuda" className="text-primary hover:underline">
          Fale com a gente em Ajuda
        </a>{" "}
        pra saber como conseguir um código.
      </p>
    </div>
  );
}
