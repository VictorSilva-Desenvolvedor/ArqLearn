"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SummaryPanel } from "@/components/features/lessonSummary/SummaryPanel";
import { achievementCatalog } from "@/lib/gamification/achievementCatalog";
import { listTrackLessons } from "@/lib/api/resources/lessons";

export default function LessonSummaryPage() {
  const searchParams = useSearchParams();
  const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();

  const xp = Number(searchParams.get("xp") ?? 0);
  const accuracy = Number(searchParams.get("accuracy") ?? 0);
  const streak = Number(searchParams.get("streak") ?? 0);
  const hearts = Number(searchParams.get("hearts") ?? 0);
  const chestAvailable = searchParams.get("chest") === "true";

  // Antes: número literal (75) fixo, pra qualquer trilha, em qualquer ponto do progresso real
  // (auditoria de 25/08/2026, pendência #3 — decisão do usuário: calcular de verdade). A API não
  // expõe a qual "unidade" uma lição pertence (track.units nunca é serializado, ver
  // Docs/CLAUDE.md), só a ordem achatada da trilha inteira — então "módulo" aqui é a trilha
  // inteira, não uma unidade dela. `lessonId` da própria rota já conta como concluída mesmo antes
  // do GET recarregar (evita a barra "voltar" pra trás por causa de latência de propagação).
  const [moduleProgressPercent, setModuleProgressPercent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTrackLessons(trackId)
      .then(({ data }) => {
        if (cancelled || data.length === 0) return;
        const completed = data.filter(
          (item) => item.progress_status === "completed" || item.lesson.id === lessonId,
        ).length;
        setModuleProgressPercent(Math.round((completed / data.length) * 100));
      })
      .catch(() => {
        // Falha de rede não deve derrubar o resumo inteiro — a barra só fica em 0% em vez de
        // mostrar um número inventado.
      });
    return () => {
      cancelled = true;
    };
  }, [trackId, lessonId]);

  // Marco simples e honesto de disparar no mock: lição concluída sem nenhum erro. Um backend
  // real decidiria isso no Gamification Service e devolveria em /v1/gamification/me.achievements.
  const achievementUnlocked = accuracy === 100;
  const nextHref = achievementUnlocked
    ? `/trilhas/${trackId}/${lessonId}/conquista?type=licao_perfeita`
    : "/";

  return (
    <SummaryPanel
      xpEarned={xp}
      accuracy={accuracy}
      streak={streak}
      hearts={hearts}
      moduleProgressPercent={moduleProgressPercent}
      gemsEarned={achievementUnlocked ? achievementCatalog.licao_perfeita.gems_reward : 0}
      nextHref={nextHref}
      chestAvailable={chestAvailable}
    />
  );
}
