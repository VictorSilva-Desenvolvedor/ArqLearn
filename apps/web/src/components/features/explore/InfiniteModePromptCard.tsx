import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function InfiniteModePromptCard() {
  return (
    <Card radius="xl" className="flex flex-col md:flex-row items-center justify-between gap-md bg-surface-gray">
      <div className="flex items-center gap-md">
        <Icon name="all_inclusive" filled className="text-4xl text-secondary" />
        <div>
          <p className="font-display text-question-sm text-on-surface font-bold">Modo Infinito</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Pratique sem limites com perguntas de dificuldade elevada sobre Sistemas Estruturais.
          </p>
        </div>
      </div>
      <Link href="/infinito/estruturas/sessao">
        <Button variant="gamification">Desafiar-se</Button>
      </Link>
    </Card>
  );
}
