"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

interface ChatInputBarProps {
  // Retorna (ou resolve para) `false` em caso de falha — o rascunho só é limpo em caso de
  // sucesso (achado do /impeccable critique, 18/08/2026: antes disso o texto era apagado
  // otimisticamente antes da chamada assíncrona resolver, então uma falha de rede fazia a
  // pergunta digitada simplesmente sumir).
  onSend: (message: string) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    const result = await onSend(trimmed);
    if (result !== false) setValue("");
  };

  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright px-md py-sm">
      <div className="flex items-center gap-sm max-w-2xl mx-auto bg-surface-gray border-2 border-outline-variant rounded-xl px-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Pergunte algo sobre o material..."
          aria-label="Pergunte algo sobre o material"
          disabled={disabled}
          className="flex-1 bg-transparent outline-none py-sm font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant"
        />
        <IconButton icon={<Icon name="send" filled />} label="Enviar pergunta" onClick={submit} disabled={disabled} />
      </div>
    </div>
  );
}
