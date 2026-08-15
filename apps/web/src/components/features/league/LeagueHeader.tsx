"use client";

import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/hooks/useToast";

const tierLabel: Record<string, string> = {
  bronze: "Liga Bronze",
  prata: "Liga Prata",
  ouro: "Liga Ouro",
  platina: "Liga Platina",
  diamante: "Liga Diamante",
};

// Espelha apps/mobile/.../liga.tsx — cabeçalho da liga (LeaguePage é Server Component, por isso
// esse pedaço precisou virar um client component à parte) agora reage ao clique com um toast
// reforçando o nome da liga e a regra de promoção/rebaixamento.
export function LeagueHeader({ tier }: { tier: string | null | undefined }) {
  const { showToast } = useToast();
  const label = tierLabel[tier ?? ""] ?? "Liga";

  return (
    <button
      type="button"
      onClick={() =>
        showToast(
          `Você está na ${label}. Os 10 melhores avançam de liga; os 5 piores caem para a liga anterior.`,
          "success",
        )
      }
      className="flex items-center gap-sm text-left"
    >
      <Icon name="trophy" filled className="text-4xl text-secondary" />
      <div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">{label}</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Os 10 melhores avançam de liga. Os 5 piores caem para a liga anterior.
        </p>
      </div>
    </button>
  );
}
