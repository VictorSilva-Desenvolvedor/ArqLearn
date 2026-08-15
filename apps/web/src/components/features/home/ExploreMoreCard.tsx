"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

// Espelha apps/mobile/.../ExploreMoreCard.tsx — antes o final da Home mostrava até 2 outras
// trilhas empilhadas depois da trilha em destaque; não fazia mais sentido com a tela de Explorar
// já madura (busca, seletor de tema). Esse card substitui isso.
export function ExploreMoreCard() {
  const router = useRouter();

  return (
    <Card radius="xl" className="mt-lg flex flex-col items-center text-center gap-sm">
      <Icon name="explore" className="text-primary text-4xl" />
      <div>
        <h2 className="font-display text-headline-md font-bold text-on-surface">
          Quer estudar outro assunto?
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Veja todas as trilhas disponíveis e troque de matéria quando quiser.
        </p>
      </div>
      <Button variant="primary" fullWidth onClick={() => router.push("/explorar")}>
        Explorar trilhas
      </Button>
    </Card>
  );
}
