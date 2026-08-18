"use client";

import { useCallback, useEffect, useState } from "react";
import { listBugReports, resolveBugReport } from "@/lib/api/resources/bugReports";
import { ApiError } from "@/lib/api/http";
import { useToast } from "@/hooks/useToast";
import { BugReportCard } from "@/components/features/admin/BugReportCard";
import type { BugReport, BugReportStatus, BugReportType } from "@/types/api";

const statusTabs: { value: BugReportStatus | "all"; label: string }[] = [
  { value: "open", label: "Abertos" },
  { value: "fixed", label: "Resolvidos" },
  { value: "all", label: "Todos" },
];

const typeTabs: { value: BugReportType | "all"; label: string }[] = [
  { value: "all", label: "Todos os tipos" },
  { value: "bug", label: "Bugs" },
  { value: "suggestion", label: "Sugestões" },
];

function pillClass(active: boolean): string {
  return `font-label text-label-caps uppercase px-md py-sm rounded-full border-2 transition-colors ${
    active
      ? "border-primary bg-primary text-on-primary"
      : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
  }`;
}

export default function AdminBugsPage() {
  const { showToast } = useToast();
  const [statusTab, setStatusTab] = useState<BugReportStatus | "all">("open");
  const [typeTab, setTypeTab] = useState<BugReportType | "all">("all");
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async (status: BugReportStatus | "all", type: BugReportType | "all") => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBugReports({
        status: status === "all" ? undefined : status,
        type: type === "all" ? undefined : type,
      });
      setReports(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os relatos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Adiado (não direto no corpo do efeito) de propósito — mesmo ajuste de AllDonePrompt/
    // useCountdownToTimestamp: `load` chama setState síncrono como primeira linha, o que o lint
    // sinaliza como possível cascata de render.
    const id = setTimeout(() => void load(statusTab, typeTab), 0);
    return () => clearTimeout(id);
  }, [statusTab, typeTab, load]);

  const handleResolve = async (id: string) => {
    setPendingId(id);
    try {
      const result = await resolveBugReport(id);
      showToast(`Marcado como resolvido — ${result.gems_awarded} gemas concedidas ao autor.`, "success");
      await load(statusTab, typeTab);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Não foi possível marcar como resolvido.", "error");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-lg">
      <div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">Ajuda e Bugs</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Relatos enviados pelos usuários. Resolver um bug credita 10 gemas; implementar uma
          sugestão credita 50 — e os dois notificam quem reportou.
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        <div className="flex gap-sm" role="tablist" aria-label="Filtrar por status">
          {statusTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={statusTab === t.value}
              onClick={() => setStatusTab(t.value)}
              className={pillClass(statusTab === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-sm" role="tablist" aria-label="Filtrar por tipo">
          {typeTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={typeTab === t.value}
              onClick={() => setTypeTab(t.value)}
              className={pillClass(typeTab === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="font-body-md text-body-md text-on-surface-variant">Carregando…</p>}
      {error && (
        <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm">{error}</p>
      )}
      {!loading && !error && reports.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">Nenhum relato por aqui.</p>
      )}

      <div className="flex flex-col gap-sm">
        {reports.map((report) => (
          <BugReportCard
            key={report.id}
            report={report}
            pending={pendingId === report.id}
            onResolve={handleResolve}
          />
        ))}
      </div>
    </div>
  );
}
