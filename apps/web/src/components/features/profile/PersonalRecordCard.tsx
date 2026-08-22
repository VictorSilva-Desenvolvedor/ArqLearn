"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { shareOrCopy } from "@/lib/share";
import { personalRecordCatalog, personalRecordIcon } from "@/lib/gamification/personalRecordCatalog";
import type { PersonalRecord } from "@/types/api";

interface PersonalRecordCardProps {
  record: PersonalRecord;
}

// Personal Record (TDD §12) é sempre um número visível, sem estado "bloqueada" — diferente de
// AchievementBadge, não existe versão "não conquistado ainda" pra mostrar (a métrica sempre tem um
// valor, mesmo que seja o de um usuário que nunca praticou). Espelha
// apps/mobile/.../PersonalRecordCard.tsx.
export function PersonalRecordCard({ record }: PersonalRecordCardProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const entry = personalRecordCatalog[record.metric];
  const valueLabel = entry.formatValue(record.value);

  async function handleShare() {
    await shareOrCopy(
      {
        title: entry.title,
        text: `🏛️ ${entry.title}: ${valueLabel} — meu recorde pessoal no ArqLearn!`,
      },
      () => showToast("Copiado! Cole onde quiser compartilhar.", "success"),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center text-center gap-1 rounded-lg p-sm bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={`Recorde pessoal: ${entry.title}, ${valueLabel}`}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-on-primary">
          <Icon name={personalRecordIcon(record)} filled className="text-2xl" />
        </div>
        <span className="font-display text-headline-sm font-bold text-on-surface">{valueLabel}</span>
        <span className="font-label text-label-caps text-on-surface-variant">{entry.title}</span>
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <div className="flex flex-col items-center text-center gap-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-on-primary">
            <Icon name={personalRecordIcon(record)} filled className="text-3xl" />
          </div>
          <div>
            <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
              {valueLabel}
            </ModalTitle>
            <ModalDescription className="font-body-md text-body-md text-on-surface-variant mt-2">
              {entry.description}
            </ModalDescription>
          </div>
          <Button variant="primary" fullWidth onClick={handleShare}>
            <Icon name="share" /> Compartilhar
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </div>
      </Modal>
    </>
  );
}
