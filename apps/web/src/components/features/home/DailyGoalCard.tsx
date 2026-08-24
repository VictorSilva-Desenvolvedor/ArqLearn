import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import type { DailyGoalStatus } from "@/types/api";

interface DailyGoalCardProps {
  status: DailyGoalStatus;
}

// Meta Diária (TDD §13, v1.30) — antes deste componente lia xpToday/goal (DAILY_GOAL_XP=50
// hardcoded em (shell)/page.tsx, nunca vindo do servidor); agora consome GET
// /v1/gamification/daily-goal de verdade. Meta batida assim que QUALQUER UMA das duas métricas
// (perguntas certas OU minutos estudados) atinge o alvo do nível escolhido — a barra mostra
// sempre a métrica mais perto de completar, nunca inventa um número só (progresso "inflado"
// destrói a confiança no indicador, princípio explícito do documento de metas diárias). "Revisar
// Erros" agora navega de verdade pra fila de revisão espaçada (TDD §10.3, mesmo destino que
// ReviewPromptCard já usa) — antes só mostrava um toast "em breve", sem nenhuma ação real atrás.
export function DailyGoalCard({ status }: DailyGoalCardProps) {
  const questionsProgress = status.questions_target > 0 ? status.questions_today / status.questions_target : 0;
  const minutesProgress = status.study_minutes_target > 0 ? status.study_minutes_today / status.study_minutes_target : 0;
  const leadingByQuestions = questionsProgress >= minutesProgress;

  return (
    <Card
      radius="xl"
      className="mb-section flex flex-col md:flex-row items-center justify-between gap-md relative overflow-hidden"
    >
      <div className="flex-1 w-full">
        <h2 className="font-display text-question-sm text-on-surface mb-xs">Meta Diária</h2>
        <div className="flex items-center gap-sm w-full">
          {/* min-w-0: flex-1 sozinho não basta — o min-width:auto padrão do item flex trava a
              barra na largura do próprio conteúdo em vez de deixar encolher, e ela "empurra" o
              texto ao lado (whitespace-nowrap, não pode quebrar) pra fora da viewport em telas
              estreitas ou zoom alto (WCAG 1.4.10 Reflow). */}
          <ProgressBar
            value={leadingByQuestions ? status.questions_today : status.study_minutes_today}
            max={leadingByQuestions ? status.questions_target : status.study_minutes_target}
            variant="tube"
            tone="secondary"
            className="flex-1 min-w-0"
          />
          <span className="font-label text-body-sm text-on-surface-variant whitespace-nowrap shrink-0">
            {status.questions_today}/{status.questions_target} perguntas · {status.study_minutes_today}/
            {status.study_minutes_target} min
          </span>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <Link href="/revisao/sessao">
          <Button variant="ghost" size="md" fullWidth className="md:w-auto">
            Revisar Erros
          </Button>
        </Link>
      </div>
    </Card>
  );
}
