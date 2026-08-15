"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { StatInfoDialog } from "./StatInfoDialog";
import { progressoDoNivel, xpParaProximoNivel } from "@/lib/gamification/level";

interface ProfileStatsGridProps {
  xpTotal: number;
  level: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// UX spec (Profile): "Show: Level. Total XP. Current streak. Best streak. Gems..." — XP Total
// nunca aparecia aqui (só o "520 XP" discreto do TopAppBar compartilhado, que não é específico
// desta tela e não cobre o requisito do spec pra Perfil).
//
// Espelha apps/mobile/.../ProfileStatsGrid.tsx — os 4 cards reagem ao clique: XP Total abre um
// modal explicando nível/progresso (StatInfoDialog), Sequência e Máximo reaproveitam o mesmo
// StreakDialog do TopAppBar (mostra streak atual E recorde) e Gemas reaproveita a navegação já
// existente pra Loja.
export function ProfileStatsGrid({ xpTotal, level, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  const router = useRouter();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const xpFaltam = xpParaProximoNivel(level, xpTotal);
  const progresso = progressoDoNivel(level, xpTotal);

  return (
    <div className="grid grid-cols-2 gap-sm">
      <StatCard
        icon={<Icon name="bolt" filled className="text-secondary text-2xl" />}
        label="XP Total"
        value={`${xpTotal}`}
        onClick={() => setXpDialogOpen(true)}
      />
      <StatCard
        icon={<Icon name="local_fire_department" filled className="text-secondary text-2xl" />}
        label="Sequência"
        value={`${streakCurrent} dias`}
        onClick={() => setStreakDialogOpen(true)}
      />
      <StatCard
        icon={<Icon name="military_tech" filled className="text-primary text-2xl" />}
        label="Máximo"
        value={`${streakBest} dias`}
        onClick={() => setStreakDialogOpen(true)}
      />
      <StatCard
        icon={<Icon name="diamond" filled className="text-primary text-2xl" />}
        label="Gemas"
        value={`${gems}`}
        onClick={() => router.push("/loja")}
      />
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
      <StatInfoDialog
        open={xpDialogOpen}
        onOpenChange={setXpDialogOpen}
        icon="bolt"
        tone="secondary"
        title={`${xpTotal} XP no total`}
        description={`Você está no Nível ${level}. Faltam ${xpFaltam} XP para o Nível ${level + 1} — ganhe XP completando lições e mantendo sua sequência.`}
        footer={
          <div className="w-full h-2 rounded-full bg-surface-gray overflow-hidden">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.round(progresso * 100)}%` }} />
          </div>
        }
      />
    </div>
  );
}
