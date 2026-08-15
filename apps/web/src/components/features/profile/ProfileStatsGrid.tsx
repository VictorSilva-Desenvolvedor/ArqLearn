"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { useToast } from "@/hooks/useToast";

interface ProfileStatsGridProps {
  xpTotal: number;
  streakCurrent: number;
  streakBest: number;
  gems: number;
}

// UX spec (Profile): "Show: Level. Total XP. Current streak. Best streak. Gems..." — XP Total
// nunca aparecia aqui (só o "520 XP" discreto do TopAppBar compartilhado, que não é específico
// desta tela e não cobre o requisito do spec pra Perfil).
//
// Espelha apps/mobile/.../ProfileStatsGrid.tsx — os 4 cards agora reagem ao clique: XP Total e
// Máximo mostram um toast informativo (não existe tela dedicada pra eles), Sequência reaproveita
// o mesmo StreakDialog do TopAppBar e Gemas reaproveita a navegação já existente pra Loja.
export function ProfileStatsGrid({ xpTotal, streakCurrent, streakBest, gems }: ProfileStatsGridProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-sm">
      <StatCard
        icon={<Icon name="bolt" filled className="text-secondary text-2xl" />}
        label="XP Total"
        value={`${xpTotal}`}
        onClick={() => showToast(`Você já acumulou ${xpTotal} XP no total!`, "success")}
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
        onClick={() => showToast(`Seu recorde de sequência é ${streakBest} dias!`, "success")}
      />
      <StatCard
        icon={<Icon name="diamond" filled className="text-primary text-2xl" />}
        label="Gemas"
        value={`${gems}`}
        onClick={() => router.push("/loja")}
      />
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
    </div>
  );
}
