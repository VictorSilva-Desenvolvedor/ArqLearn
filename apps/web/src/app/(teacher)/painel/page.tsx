"use client";

import { useEffect, useState } from "react";
import {
  getClassSummary,
  getReviewQueue,
  getWeeklyEngagement,
  listTeacherClasses,
} from "@/lib/api/resources/teacher";
import type { TeacherClass, ReviewQueueRow } from "@/lib/api/mocks/fixtures/teacherAnalytics";
import type { TeacherClassSummary } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { ClassSelector } from "@/components/features/teacherDashboard/ClassSelector";
import { MetricCard } from "@/components/features/teacherDashboard/MetricCard";
import { WeakTopicsList } from "@/components/features/teacherDashboard/WeakTopicsList";
import { EngagementBarChart } from "@/components/features/teacherDashboard/EngagementBarChart";
import { ReviewQueueTable } from "@/components/features/teacherDashboard/ReviewQueueTable";

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [summary, setSummary] = useState<TeacherClassSummary | null>(null);
  const [engagement, setEngagement] = useState<{ day: string; value: number }[]>([]);
  const [queue, setQueue] = useState<ReviewQueueRow[]>([]);

  useEffect(() => {
    listTeacherClasses().then((result) => {
      setClasses(result);
      setSelectedClassId((current) => current ?? result[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    getClassSummary(selectedClassId).then(setSummary);
    getWeeklyEngagement(selectedClassId).then(setEngagement);
    getReviewQueue(selectedClassId).then(setQueue);
  }, [selectedClassId]);

  // Não há endpoint de exportação no contrato (API Spec) — isto é um CSV gerado 100% no cliente
  // a partir do que já está na tela, sem depender de um backend que ainda não existe.
  const handleExport = () => {
    const header = "Aluno,Questão ID,Tópico,Status\n";
    const csvRows = queue
      .map((row) => [row.student_name, row.question_id, row.topic, row.status].join(","))
      .join("\n");
    const blob = new Blob([header + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fila-revisao-${selectedClassId ?? "turma"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    // DESIGN.md: Teacher Dashboard usa "Density-First" — padding reduzido a sm (12px), não a
    // maior escala (spacing-section, 48px) usada nas telas de aluno/gamificação.
    <div className="max-w-container-max mx-auto px-sm py-sm flex flex-col gap-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
        <div>
          <h1 className="font-display text-display-lg font-bold text-on-surface">Painel de Análise</h1>
          {selectedClassId && (
            <ClassSelector classes={classes} selectedClassId={selectedClassId} onSelect={setSelectedClassId} />
          )}
        </div>
        <Button variant="ghost" icon={<Icon name="download" />} disabled={queue.length === 0} onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          <MetricCard
            icon={<Icon name="groups" filled className="text-3xl text-primary" />}
            label="Total de Alunos"
            value={String(summary.students_count)}
          />
          <MetricCard
            icon={<Icon name="local_fire_department" filled className="text-3xl text-secondary" />}
            label="Média de Ofensiva"
            value={`${summary.avg_streak} dias`}
          />
          <MetricCard
            icon={<Icon name="target" filled className="text-3xl text-tertiary" />}
            label="Precisão Média"
            value={`${summary.avg_accuracy}%`}
          />
          <MetricCard
            icon={<Icon name="fact_check" filled className="text-3xl text-error-red" />}
            label="Questões Pendentes"
            value={String(queue.length)}
          />
        </div>
      )}

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Tópicos Fracos</h2>
        <WeakTopicsList topics={summary?.weak_topics ?? []} />
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Engajamento Semanal</h2>
        <EngagementBarChart data={engagement} />
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Fila de Revisão de Questões</h2>
        <ReviewQueueTable rows={queue} />
      </section>
    </div>
  );
}
