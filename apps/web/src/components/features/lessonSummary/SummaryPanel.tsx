"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "./StatCard";

interface SummaryPanelProps {
  xpEarned: number;
  accuracy: number;
  streak: number;
  hearts: number;
  moduleProgressPercent: number;
  gemsEarned?: number;
  nextHref: string;
  chestAvailable?: boolean;
}

export function SummaryPanel({
  xpEarned,
  accuracy,
  streak,
  hearts,
  moduleProgressPercent,
  gemsEarned = 0,
  nextHref,
  chestAvailable = false,
}: SummaryPanelProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center px-md py-lg">
      <div className="w-full max-w-[28rem] bg-surface-bright border-2 border-outline-variant rounded-xl p-lg flex flex-col gap-lg text-center">
        <div>
          <h1 className="font-display text-display-lg font-bold text-primary">Lição Concluída!</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Excelente progresso, Arquiteto!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <StatCard
            icon={<Icon name="bolt" filled className="text-secondary text-3xl" />}
            label="Total XP"
            value={`+${xpEarned}`}
          />
          <StatCard
            icon={<Icon name="target" filled className="text-tertiary text-3xl" />}
            label="Precisão"
            value={`${accuracy}%`}
          />
          <StatCard
            icon={<Icon name="local_fire_department" filled className="text-secondary text-3xl" />}
            label="Ofensiva"
            value={`${streak} Dias`}
          />
          <StatCard
            icon={<Icon name="favorite" filled className="text-error-red text-3xl" />}
            label="Vidas Restantes"
            value={`${hearts}`}
          />
          {/* Spec §C ("Gems earned when applicable") — só aparece quando a lição realmente rendeu
              gemas (hoje, só via conquista desbloqueada nesta mesma lição). */}
          {gemsEarned > 0 && (
            <StatCard
              icon={<Icon name="diamond" filled className="text-primary text-3xl" />}
              label="Gemas Ganhas"
              value={`+${gemsEarned}`}
            />
          )}
        </div>

        <div className="text-left">
          <div className="flex justify-between mb-1">
            <span className="font-label text-label-caps uppercase text-on-surface-variant">
              Progresso do módulo
            </span>
            <span className="font-label text-label-caps text-on-surface-variant">
              {moduleProgressPercent}%
            </span>
          </div>
          <ProgressBar value={moduleProgressPercent} max={100} variant="thin" tone="primary" />
        </div>

        {/* CTA do Baú Diário (v1.18) — só aparece quando a Meta Diária escolhida (TDD §13,
            perguntas certas OU minutos estudados, lição + Modo Infinito somados) já foi batida e o
            baú de hoje ainda não foi aberto. */}
        {chestAvailable && (
          <Button
            variant="gamification"
            fullWidth
            onClick={() => router.push("/bau")}
            icon={<Icon name="redeem" filled className="text-2xl" />}
          >
            Abrir Baú Diário
          </Button>
        )}

        <Button variant="primary" fullWidth onClick={() => router.push(nextHref)}>
          Continuar para o Mapa
        </Button>
      </div>
    </div>
  );
}
