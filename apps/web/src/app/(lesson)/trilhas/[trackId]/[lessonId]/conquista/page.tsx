"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { useAuth } from "@/hooks/useAuth";
import { isResourceReal } from "@/lib/api/config";
import { getGamificationProfile } from "@/lib/api/resources/gamification";
import type { AchievementType } from "@/types/api";

// Tela própria de transição (spec §C: "If an achievement was unlocked, transition to Achievement
// screen") — antes era um Modal sobre o Resumo; a rota separada é a versão fiel ao spec.
export default function AchievementScreenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { gamification, updateGamification } = useAuth();
  const type = searchParams.get("type") as AchievementType | null;
  const entry = type ? achievementCatalog[type] : undefined;

  // Credita a recompensa uma única vez ao entrar na tela — mesmo em dev (React monta o efeito
  // 2x em StrictMode), o ref garante que só a primeira execução realmente soma XP/gemas.
  const creditedRef = useRef(false);
  useEffect(() => {
    if (!entry || creditedRef.current) return;
    creditedRef.current = true;
    // Paridade com apps/mobile (mesma tela, mesma correção de 18/08/2026): com backend real,
    // busca o perfil já atualizado em vez de somar XP/gemas no cliente — somar localmente
    // contraria a regra do projeto ("nunca calcular XP/streak/nível no cliente") e mostra número
    // errado se o servidor divergir (teto diário de XP, corrida entre requisições). O modo mock
    // mantém a soma local como stand-in, por não existir endpoint de conquista pra consultar.
    if (isResourceReal("gamification")) {
      getGamificationProfile().then((fresh) => updateGamification(fresh));
      return;
    }
    updateGamification({
      xp_total: gamification.xp_total + entry.xp_reward,
      gems: gamification.gems + entry.gems_reward,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar uma vez ao montar; gamification.* mudaria a cada crédito e recriaria o efeito
  }, [entry, updateGamification]);

  // Redirecionar precisa ser efeito, não corpo do render: `router.replace` durante o render
  // dispara "Cannot update a component (Router) while rendering a different component" — erro
  // real observado no console ao abrir /conquista sem `?type=` (auditoria de 25/08/2026).
  useEffect(() => {
    if (!entry) router.replace("/");
  }, [entry, router]);

  if (!entry) return null;

  return (
    <div className="flex-1 flex items-center justify-center px-md py-lg">
      {/* Painel opaco (fiel à moldura técnica do Stitch): sem ele o texto da conquista fica
          direto sobre a grade blueprint animada do <body> e os traços do fundo cruzam as
          palavras — confirmado em screenshot na auditoria de 25/08/2026. */}
      <div className="w-full max-w-[28rem] flex flex-col items-center text-center gap-lg bg-surface-bright border-2 border-outline-variant rounded-xl px-lg py-xl">
        <div className="w-28 h-28 rounded-xl bg-secondary text-on-secondary flex items-center justify-center rotate-45 shadow-gamified">
          {/* size (style inline) em vez de `text-6xl`: a folha do Material Symbols não é
              "layered" e vence as utilities do Tailwind v4, então toda classe de tamanho em
              <Icon> é ignorada e o glifo fica em 24px — ver Docs/PENDENCIAS_WEB_REAL.md. */}
          <Icon name={entry.icon} filled size={56} className="-rotate-45" />
        </div>
        <div>
          <p className="font-label text-label-caps uppercase text-secondary mb-1">Conquista desbloqueada</p>
          <h1 className="font-display text-headline-md font-bold text-on-surface">{entry.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{entry.description}</p>
        </div>
        <div className="flex items-center gap-lg">
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
            <Icon name="bolt" filled /> +{entry.xp_reward} XP
          </span>
          <span className="flex items-center gap-1 font-label text-stats-num font-bold text-secondary">
            <Icon name="diamond" filled /> +{entry.gems_reward} gemas
          </span>
        </div>
        <Button variant="primary" fullWidth onClick={() => router.push("/")}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
