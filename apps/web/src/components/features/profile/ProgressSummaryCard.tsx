"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { useToast } from "@/hooks/useToast";
import type { ProgressSummary } from "@/types/api";

// Espelha apps/mobile/.../ProgressSummaryCard.tsx — "Em Andamento" reaproveita a navegação pra
// Explorar (onde as trilhas em progresso aparecem) e os outros 3 mostram um toast informativo, já
// que não existe tela dedicada de "trilhas concluídas", "histórico de lições" ou "precisão".
export function ProgressSummaryCard({ summary }: { summary: ProgressSummary }) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <div>
      <h2 className="font-display text-headline-md text-on-surface mb-sm">Progresso Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        <StatCard
          icon={<Icon name="school" filled className="text-primary text-2xl" />}
          label="Trilhas Concluídas"
          value={`${summary.tracks_completed}`}
          onClick={() =>
            showToast(
              summary.tracks_completed === 1
                ? "Você concluiu 1 trilha até agora!"
                : `Você concluiu ${summary.tracks_completed} trilhas até agora!`,
              "success",
            )
          }
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
          onClick={() =>
            showToast(`Você concluiu ${summary.lessons_completed_last_7d} lições nos últimos 7 dias.`, "success")
          }
        />
        <StatCard
          icon={<Icon name="target" filled className="text-primary text-2xl" />}
          label="Precisão"
          value={`${summary.accuracy_rate}%`}
          onClick={() => showToast(`Sua taxa de acerto geral é ${summary.accuracy_rate}%.`, "success")}
        />
      </div>
    </div>
  );
}
