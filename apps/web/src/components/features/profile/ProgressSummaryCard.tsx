"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { StatInfoDialog } from "./StatInfoDialog";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/mobile/.../ProgressSummaryCard.tsx — "Em Andamento" reaproveita a navegação pra
// Explorar (onde as trilhas em progresso aparecem) e os outros 3 abrem um StatInfoDialog
// explicando o número, já que não existe tela dedicada de "trilhas concluídas", "histórico de
// lições" ou "detalhe de precisão".
export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  const router = useRouter();
  const [tracksDialogOpen, setTracksDialogOpen] = useState(false);
  const [lessonsDialogOpen, setLessonsDialogOpen] = useState(false);
  const [accuracyDialogOpen, setAccuracyDialogOpen] = useState(false);

  return (
    <div>
      <h2 className="font-display text-headline-md text-on-surface mb-sm">Progresso Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        <StatCard
          icon={<Icon name="school" filled className="text-primary text-2xl" />}
          label="Trilhas Concluídas"
          value={`${summary.tracks_completed}`}
          onClick={() => setTracksDialogOpen(true)}
        />
        <StatCard
          icon={<Icon name="menu_book" filled className="text-secondary text-2xl" />}
          label="Em Andamento"
          value={`${summary.tracks_in_progress}`}
          onClick={() => router.push("/explorar")}
        />
        <StatCard
          icon={<Icon name="event_available" filled className="text-tertiary text-2xl" />}
          label="Lições (7 dias)"
          value={`${summary.lessons_completed_last_7d}`}
          onClick={() => setLessonsDialogOpen(true)}
        />
        <StatCard
          icon={<Icon name="target" filled className="text-primary text-2xl" />}
          label="Precisão"
          value={`${summary.accuracy_rate}%`}
          onClick={() => setAccuracyDialogOpen(true)}
        />
      </div>
      <StatInfoDialog
        open={tracksDialogOpen}
        onOpenChange={setTracksDialogOpen}
        icon="school"
        tone="primary"
        title={
          summary.tracks_completed === 1 ? "1 trilha concluída" : `${summary.tracks_completed} trilhas concluídas`
        }
        description="Você concluiu todas as lições dessas trilhas. Continue explorando pra desbloquear mais conquistas e XP."
      />
      <StatInfoDialog
        open={lessonsDialogOpen}
        onOpenChange={setLessonsDialogOpen}
        icon="event_available"
        tone="tertiary"
        title={`${summary.lessons_completed_last_7d} lições nos últimos 7 dias`}
        description="Contagem de lições concluídas na última semana corrida. Pratique todo dia pra manter o ritmo e sua sequência viva."
      />
      <StatInfoDialog
        open={accuracyDialogOpen}
        onOpenChange={setAccuracyDialogOpen}
        icon="target"
        tone="primary"
        title={`${summary.accuracy_rate}% de precisão`}
        description="Percentual de respostas certas em relação ao total de respostas dadas em todas as suas sessões de prática."
      />
    </div>
  );
}
