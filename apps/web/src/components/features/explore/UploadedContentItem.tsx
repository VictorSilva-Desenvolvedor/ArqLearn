import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "@/lib/utils/format";
import type { UploadedContent, UploadFileType, UploadStatus } from "@/types/api";

const fileTypeIcon: Record<UploadFileType, string> = {
  pdf: "picture_as_pdf",
  docx: "description",
  pptx: "slideshow",
  image: "image",
  video: "movie",
};

const statusLabel: Record<UploadStatus, { label: string; tone: "primary" | "secondary" | "tertiary" | "error" | "neutral" }> = {
  received: { label: "Recebido", tone: "neutral" },
  processing: { label: "Processando", tone: "secondary" },
  ready_for_review: { label: "Pronto para revisão", tone: "primary" },
  published: { label: "Publicado", tone: "tertiary" },
  failed: { label: "Falhou", tone: "error" },
};

// Spec (Upload Material): 4 estágios NOMEADOS — Recebido / Extraindo conteúdo / Gerando
// perguntas / Pronto para revisão — não um "Processando" genérico do início ao fim. Recebido e
// Pronto para revisão já são status próprios; isto só nomeia as duas metades de "processing".
function processingStageLabel(progressPercent: number): string {
  return progressPercent < 50 ? "Extraindo conteúdo" : "Gerando perguntas";
}

// Resumo Inteligente só existe para uploads já processados (ready_for_review/published) — nas
// demais fases o item ainda não tem conteúdo gerado para abrir.
const SUMMARIZABLE_STATUSES: UploadStatus[] = ["ready_for_review", "published"];

export function UploadedContentItem({ item }: { item: UploadedContent }) {
  const canOpenSummary = SUMMARIZABLE_STATUSES.includes(item.status);
  const showProgress = item.status === "processing" && typeof item.progress_percent === "number";
  const status =
    item.status === "processing" && showProgress
      ? { label: processingStageLabel(item.progress_percent ?? 0), tone: statusLabel.processing.tone }
      : statusLabel[item.status];

  const content = (
    <Card padding="sm" radius="md" interactive={canOpenSummary} className="flex flex-col gap-1">
      {/* O nome do arquivo é o que identifica a linha, mas dividia a largura com um badge de texto
          longo ("Pronto para revisão"): em 390px sobravam 77px pro nome de 281px — ficava
          "Norma_d…" (medido na auditoria de 25/08/2026). Abaixo de `sm` o badge desce pra linha
          de baixo, junto do tamanho do arquivo; de `sm` pra cima o layout de uma linha continua. */}
      <div className="flex items-center gap-sm">
        <Icon name={fileTypeIcon[item.file_type]} className="text-on-surface-variant" size={24} />
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-x-sm">
          <p className="font-body-md text-body-md text-on-surface truncate sm:flex-1">{item.filename}</p>
          <div className="flex items-center gap-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant sm:order-first">
              {formatBytes(item.size_bytes)}
            </p>
            <Badge tone={status.tone} className="shrink-0">
              {status.label}
            </Badge>
          </div>
        </div>
        {canOpenSummary && <Icon name="chevron_right" className="text-on-surface-variant shrink-0" />}
      </div>
      {showProgress && (
        <div className="flex items-center gap-sm pl-[calc(1.5rem+var(--spacing-sm))]">
          <ProgressBar value={item.progress_percent ?? 0} max={100} variant="thin" tone="secondary" className="flex-1" />
          <span className="font-label text-body-sm text-on-surface-variant w-10 text-right">
            {item.progress_percent}%
          </span>
        </div>
      )}
    </Card>
  );

  if (!canOpenSummary) return content;

  return <Link href={`/materiais/${item.id}/resumo`}>{content}</Link>;
}
