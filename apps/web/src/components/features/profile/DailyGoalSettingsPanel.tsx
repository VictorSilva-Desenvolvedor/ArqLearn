"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { getDailyGoalStatus, updateDailyGoalLevel } from "@/lib/api/resources/gamification";
import { DAILY_GOAL_LEVELS, dailyGoalCatalog } from "@/lib/gamification/dailyGoalCatalog";
import type { DailyGoalLevel, DailyGoalStatus } from "@/types/api";

// Meta Diária (TDD §13, v1.30) — seletor de nível em Configurações, fechando o gap que o backlog
// de gamificação já registrava ("hoje só existe no cliente"). Sem GET embutido em nenhum outro
// contexto já carregado (diferente de NotificationPreferencesPanel, que não tem GET no contrato) —
// busca o status próprio no mount.
export function DailyGoalSettingsPanel() {
  const [status, setStatus] = useState<DailyGoalStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyGoalStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelect(level: DailyGoalLevel) {
    if (saving || status?.level === level) return;
    setSaving(true);
    try {
      const updated = await updateDailyGoalLevel(level);
      setStatus(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" radius="lg" className="flex flex-col gap-md">
      <div>
        <h2 className="font-display text-headline-md text-on-surface">Meta Diária</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Escolha quanto contar como &ldquo;vencer o dia&rdquo; — perguntas certas ou minutos
          estudados, o que vier primeiro. Isso também decide o alvo do Baú Diário.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-sm">
        {DAILY_GOAL_LEVELS.map((level) => {
          const entry = dailyGoalCatalog[level];
          const selected = status?.level === level;
          return (
            <button
              key={level}
              type="button"
              disabled={saving}
              onClick={() => handleSelect(level)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border-2 p-sm text-left transition-colors disabled:opacity-60",
                selected
                  ? "border-primary bg-surface-container"
                  : "border-outline-variant hover:bg-surface-container-low",
              )}
            >
              <span className="flex items-center gap-1 font-label text-label-caps text-on-surface">
                <Icon name={entry.icon} className="text-lg" />
                {entry.title}
                {selected && <Icon name="check_circle" filled className="text-primary text-base ml-auto" />}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {entry.questionsTarget} perguntas ou {entry.studyMinutesTarget} min
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
