"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface AllDonePromptProps {
  topic: string;
  themeLabel: string;
}

// Aparece só quando a trilha em destaque da Home está 100% concluída (ver app/(shell)/page.tsx,
// allDone) — oferece continuar praticando no Modo Infinito em vez de simplesmente mostrar o mapa
// todo verde sem nenhuma próxima ação. sessionStorage evita reabrir sozinho a cada visita à Home
// depois que a pessoa já viu/dispensou nesta sessão do navegador — sem isso, voltar pra "/" depois
// de já ter ido pro Modo Infinito (ou só fechado o diálogo) mostraria o mesmo popup de novo.
export function AllDonePrompt({ topic, themeLabel }: AllDonePromptProps) {
  const router = useRouter();
  const dismissKey = `arqlearn_alldone_dismissed_${topic}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // setState adiado (não direto no corpo do efeito) de propósito — mesmo motivo do ajuste em
    // useCountdownToTimestamp: setState síncrono dentro de um efeito é sinalizado pelo lint como
    // possível cascata de render. Um tick de atraso é imperceptível aqui.
    const id = setTimeout(() => {
      if (!sessionStorage.getItem(dismissKey)) setOpen(true);
    }, 0);
    return () => clearTimeout(id);
  }, [dismissKey]);

  const dismiss = () => {
    sessionStorage.setItem(dismissKey, "1");
    setOpen(false);
  };

  const goInfinite = () => {
    sessionStorage.setItem(dismissKey, "1");
    router.push(`/infinito/${topic}/sessao`);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      radius="full"
      className="w-[min(90vw,24rem)]"
    >
      <div className="flex flex-col items-center text-center gap-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container">
          <Icon name="celebration" filled className="text-5xl text-secondary" />
        </div>
        <div>
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            Tudo em dia!
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
            Você concluiu todas as lições de {themeLabel} por enquanto. Continue praticando sem
            parar no Modo Infinito.
          </ModalDescription>
        </div>
        <div className="flex flex-col gap-sm w-full">
          <Button variant="gamification" fullWidth onClick={goInfinite}>
            Ir para o Modo Infinito
          </Button>
          <Button variant="ghost" fullWidth onClick={dismiss}>
            Ver o mapa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
