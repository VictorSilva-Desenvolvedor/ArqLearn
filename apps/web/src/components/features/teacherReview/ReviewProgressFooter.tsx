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
    // bottom-[86px] abaixo de md: a TeacherBottomNav é `fixed bottom-0 z-40` com 86px de altura,
    // então este rodapé (z auto) ficava 100% coberto por ela no telefone — medido: rodapé em
    // y 756–844, nav em y 758–844. O professor não conseguia ver o progresso nem alcançar
    // "Publicar Trilha", que é a ação terminal da tela. Acima de md a nav some (md:hidden) e o
    // rodapé volta pra bottom-0.
    <div className="sticky bottom-[86px] md:bottom-0 z-30 border-t-2 border-outline-variant bg-surface-bright rounded-t-lg px-lg py-md flex flex-col items-stretch gap-sm sm:flex-row sm:items-center sm:gap-md">
      {/* Empilhado abaixo de sm: lado a lado com o botão sobravam ~150px pro rótulo e
          "0/12 perguntas revisadas" quebrava em duas linhas dentro da barra. Empilhar dá largura
          inteira à barra de progresso e transforma "Publicar Trilha" num alvo de toque decente. */}
      <div className="flex-1">
        <ProgressBar value={reviewed} max={total || 1} variant="thin" tone="primary" />
        <span className="font-label text-label-caps text-on-surface-variant">
          {reviewed}/{total} perguntas revisadas
        </span>
      </div>
      <Button
        variant="primary"
        fullWidth
        className="sm:w-auto"
        disabled={!allReviewed || publishing}
        onClick={onPublish}
      >
        Publicar Trilha
      </Button>
    </div>
  );
}
