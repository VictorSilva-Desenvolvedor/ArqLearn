"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { BugReport } from "@/types/api";

const BUG_GEMS_REWARD = 10;
const SUGGESTION_GEMS_REWARD = 50;

const deviceTypeLabel: Record<string, string> = {
  mobile: "Celular",
  desktop: "Computador",
  tablet: "Tablet",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface BugReportCardProps {
  report: BugReport;
  pending: boolean;
  onResolve: (id: string) => void;
}

export function BugReportCard({ report, pending, onResolve }: BugReportCardProps) {
  const isFixed = report.status === "fixed";
  const isSuggestion = report.type === "suggestion";
  const gemsReward = isSuggestion ? SUGGESTION_GEMS_REWARD : BUG_GEMS_REWARD;
  const resolveLabel = isSuggestion ? "Marcar como implementada" : "Marcar como corrigido";
  const resolvedLabel = isSuggestion ? "Implementada" : "Corrigido";

  return (
    <Card padding="md" radius="lg" className="flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p className="font-body-lg text-body-lg font-bold text-on-surface">
            {report.reporter_name ?? "Usuário"}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {report.reporter_email} · {formatDate(report.created_at)}
          </p>
        </div>
        <div className="flex gap-xs">
          <Badge tone={isSuggestion ? "tertiary" : "error"}>{isSuggestion ? "MELHORIA" : "BUG"}</Badge>
          <Badge tone={isFixed ? "primary" : "secondary"}>{isFixed ? resolvedLabel.toUpperCase() : "ABERTO"}</Badge>
        </div>
      </div>

      <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{report.description}</p>

      {(report.device_model || report.device_type) && (
        <p className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="devices" className="text-base" />
          {report.device_type ? deviceTypeLabel[report.device_type] : null}
          {report.device_type && report.device_model ? " · " : null}
          {report.device_model}
        </p>
      )}

      {report.screenshot_base64 && (
        // eslint-disable-next-line @next/next/no-img-element -- data URI vindo do banco, não passa pelo otimizador de imagens do Next
        <img
          src={report.screenshot_base64}
          alt={`Print anexado ao relato de ${report.reporter_name ?? "usuário"}`}
          loading="lazy"
          className="max-h-64 w-auto rounded-lg border-2 border-outline-variant object-contain self-start"
        />
      )}

      {!isFixed && (
        <Button variant="gamification" disabled={pending} onClick={() => onResolve(report.id)} className="self-start">
          {pending ? "Marcando…" : `${resolveLabel} (+${gemsReward} gemas pro autor)`}
        </Button>
      )}
      {isFixed && report.resolved_at && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {resolvedLabel} em {formatDate(report.resolved_at)}
        </p>
      )}
    </Card>
  );
}
