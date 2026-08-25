"use client";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

// Sugestões genéricas o bastante para qualquer material enviado (PDF de norma, planta, apostila).
// Não são decorativas: clicar envia a pergunta de verdade pelo mesmo caminho da barra de digitação.
export const CHAT_SUGGESTIONS = [
  "Resuma este material em 3 pontos",
  "Explique o conceito mais difícil deste documento",
  "Que erros comuns esse material ajuda a evitar?",
] as const;

interface ChatEmptyStateProps {
  title: string;
  onSuggestion: (question: string) => void;
  disabled?: boolean;
}

export function ChatEmptyState({ title, onSuggestion, disabled }: ChatEmptyStateProps) {
  return (
    <Card padding="lg" radius="lg" className="flex flex-col items-center gap-md text-center">
      <span className="flex items-center justify-center size-16 rounded-full bg-secondary-fixed shrink-0">
        <Icon name="forum" filled className="text-secondary" size={32} />
      </span>
      <div className="flex flex-col gap-xs">
        <h2 className="font-display text-headline-md text-on-surface">Pergunte à Arq</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ela responde com base em <strong className="font-bold">{title}</strong> e cita a página do
          documento em cada resposta.
        </p>
      </div>
      <ul className="flex flex-col gap-xs w-full">
        {CHAT_SUGGESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSuggestion(question)}
              className="w-full flex items-center justify-between gap-sm text-left rounded-xl border-2 border-primary px-md py-sm font-body-md text-body-md text-primary transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {question}
              <Icon name="arrow_forward" className="shrink-0" size={20} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
