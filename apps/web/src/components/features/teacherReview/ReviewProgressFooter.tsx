import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ReviewProgressFooterProps {
  reviewed: number;
  total: number;
  onPublish: () => void;
  publishing: boolean;
}

export function ReviewProgressFooter({ reviewed, total, onPublish, publishing }: ReviewProgressFooterProps) {
  const allReviewed = total > 0 && reviewed === total;

  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright px-lg py-md flex items-center gap-md">
      <div className="flex-1">
        <ProgressBar value={reviewed} max={total || 1} variant="thin" tone="primary" />
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          {reviewed}/{total} perguntas revisadas
        </span>
      </div>
      <Button variant="primary" disabled={!allReviewed || publishing} onClick={onPublish}>
        Publicar Trilha
      </Button>
    </div>
  );
}
