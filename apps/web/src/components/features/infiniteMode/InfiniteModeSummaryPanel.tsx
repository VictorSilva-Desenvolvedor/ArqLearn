"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/features/lessonSummary/StatCard";
import { formatMinutesSeconds } from "@/lib/utils/format";

interface InfiniteModeSummaryPanelProps {
  questionsAnswered: number;
  correctCount: number;
  accuracy: number;
  xpEarned: number;
  avgTimeMs: number;
}

export function InfiniteModeSummaryPanel({
  questionsAnswered,
  correctCount,
  accuracy,
  xpEarned,
  avgTimeMs,
}: InfiniteModeSummaryPanelProps) {
  const router = useRouter();
  const title = accuracy >= 90 ? "Nota Máxima Alcançada!" : "Sessão Concluída!";

  return (
    <div className="flex-1 flex items-center justify-center px-md py-lg">
      <div className="w-full max-w-[28rem] bg-surface-bright border-2 border-outline-variant rounded-xl p-lg flex flex-col gap-lg text-center">
        <div>
          <h1 className="font-display text-display-lg font-bold text-primary">{title}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Modo Infinito</p>
        </div>

        <div className="grid grid-cols-3 gap-sm">
          <StatCard
            icon={<Icon name="fact_check" filled className="text-primary text-3xl" />}
            label="Questões"
            value={`${questionsAnswered}`}
          />
          <StatCard
            icon={<Icon name="target" filled className="text-tertiary text-3xl" />}
            label="Precisão"
            value={`${accuracy}%`}
          />
          <StatCard
            icon={<Icon name="bolt" filled className="text-secondary text-3xl" />}
            label="XP Ganho"
            value={`+${xpEarned}`}
          />
        </div>

        <div className="text-left border-2 border-outline-variant rounded-lg p-md">
          <p className="font-headline-md text-question-sm text-on-surface font-bold mb-sm">Análise de Desempenho</p>
          <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
            <span>Tempo médio por questão</span>
            <span className="font-bold text-on-surface">{formatMinutesSeconds(avgTimeMs / 1000)}</span>
          </div>
          <div className="flex justify-between font-body-md text-body-md text-on-surface-variant mt-1">
            <span>Acertos</span>
            <span className="font-bold text-on-surface">{correctCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <Button variant="primary" fullWidth onClick={() => router.push("/")}>
            Voltar ao Mapa
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push("/explorar")}>
            Tentar Outro Tema
          </Button>
        </div>
      </div>
    </div>
  );
}
