import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { WeakTopic } from "@/types/api";

interface WeakTopicsListProps {
  topics: WeakTopic[];
  onReviewTopic: (topic: string) => void;
}

export function WeakTopicsList({ topics, onReviewTopic }: WeakTopicsListProps) {
  if (topics.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Nenhum tópico fraco identificado nesta turma.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {topics.map((topic) => (
        <Card key={topic.topic} padding="sm" radius="md" className="flex items-center justify-between gap-sm">
          <div>
            <p className="font-body-md text-body-md font-bold text-on-surface">{topic.topic}</p>
            {/* Antes: "{accuracy_rate}% de acerto" pintado de text-error-red. Um número de ACERTO
                em vermelho de erro lê ao contrário — quem escaneia a lista vê "55%" em vermelho e
                entende taxa de erro. A referência do Stitch (painel_do_professor/screen.png)
                mostra justamente o complemento ("45% de erro"), que é a grandeza que justifica o
                tópico estar numa lista chamada "Tópicos Fracos" e que o vermelho de fato
                descreve. */}
            <p className="font-body-sm text-body-sm text-error-red">
              {100 - topic.accuracy_rate}% de erro
            </p>
          </div>
          {/* Antes: sem onClick nenhum — prometia uma ação e não fazia nada (auditoria de
              25/08/2026, pendência #9). Decisão do usuário: combinação das duas opções — a fila
              de revisão já mora nesta mesma página (ver painel/page.tsx) e já carrega `topic` por
              linha, então "revisar" filtra a fila por este tópico e rola até ela, funcionando como
              destino real E como "detalhe do tópico" dentro do próprio painel, sem exigir
              `upload_id` em WeakTopic nem uma tela nova. */}
          <Button variant="ghost" size="sm" onClick={() => onReviewTopic(topic.topic)}>
            Revisar Módulo
          </Button>
        </Card>
      ))}
    </div>
  );
}
