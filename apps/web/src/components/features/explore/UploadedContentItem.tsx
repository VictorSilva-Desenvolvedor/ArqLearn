import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
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

// Resumo Inteligente só existe para uploads já processados (ready_for_review/published) — nas
// demais fases o item ainda não tem conteúdo gerado para abrir.
const SUMMARIZABLE_STATUSES: UploadStatus[] = ["ready_for_review", "published"];

export function UploadedContentItem({ item }: { item: UploadedContent }) {
  const status = statusLabel[item.status];
  const canOpenSummary = SUMMARIZABLE_STATUSES.includes(item.status);

  const content = (
    <Card
      padding="sm"
      radius="md"
      interactive={canOpenSummary}
      className="flex items-center gap-sm"
    >
      <Icon name={fileTypeIcon[item.file_type]} className="text-2xl text-on-surface-variant" />
      <div className="flex-1 min-w-0">
        <p className="font-body-md text-body-md text-on-surface truncate">{item.filename}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{formatBytes(item.size_bytes)}</p>
      </div>
      <Badge tone={status.tone}>{status.label}</Badge>
      {canOpenSummary && <Icon name="chevron_right" className="text-on-surface-variant" />}
    </Card>
  );

  if (!canOpenSummary) return content;

  return <Link href={`/materiais/${item.id}/resumo`}>{content}</Link>;
}
