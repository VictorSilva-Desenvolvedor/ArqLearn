import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { WeakTopic } from "@/types/api";

export function WeakTopicsList({ topics }: { topics: WeakTopic[] }) {
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
            <p className="font-body-sm text-body-sm text-error-red">{topic.accuracy_rate}% de acerto</p>
          </div>
          <Button variant="ghost" size="sm">
            Revisar Módulo
          </Button>
        </Card>
      ))}
    </div>
  );
}
