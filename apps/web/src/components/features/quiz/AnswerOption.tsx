import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { cn } from "@/lib/utils/cn";

interface AnswerOptionProps {
  label: string;
  selected: boolean;
  revealed: boolean;
  /** Resposta enviada, aguardando o servidor confirmar certo/errado — mostra um spinner na
   * opção marcada em vez do ícone de certo/errado (ainda não sabemos qual dos dois é). */
  verifying?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function AnswerOption({
  label,
  selected,
  revealed,
  verifying,
  isCorrect,
  disabled,
  onClick,
}: AnswerOptionProps) {
  // Spec (Elevation & Depth): borda 1px no estado padrão, 2px só ao marcar seleção — não fixa em
  // 2px pra toda answer card.
  let toneClasses = "border border-outline-variant bg-surface-bright hover:border-primary";
  if (selected && !revealed) {
    toneClasses = "border-2 border-primary bg-primary-fixed";
  }
  if (selected && verifying) {
    toneClasses = "border-2 border-primary bg-primary-fixed opacity-80";
  }
  if (revealed && selected) {
    toneClasses = isCorrect
      ? "border-2 border-tertiary bg-tertiary-fixed text-on-tertiary-fixed-variant"
      : "border-2 border-error bg-error-container text-on-error-container";
  }
  if (revealed && !selected) {
    toneClasses = "border border-outline-variant bg-surface-bright opacity-60";
  }

  // Nunca só cor pra indicar certo/errado (spec §4) — ícone dedicado some ambiguidade pra quem
  // não distingue verde/vermelho, e também é o sinal que role="radio" comunica a leitor de tela
  // via aria-checked, já que a cor sozinha não chega até lá.
  const revealIcon = revealed && selected ? (isCorrect ? "check_circle" : "cancel") : null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-sm text-left rounded-lg px-md py-sm font-body-lg text-body-lg transition-colors disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        toneClasses,
      )}
    >
      <span className="flex-1">{label}</span>
      {selected && verifying && <LoadingBlueprint size={20} className="shrink-0" />}
      {revealIcon && (
        <Icon
          name={revealIcon}
          filled
          className={cn("text-xl shrink-0", isCorrect ? "text-tertiary" : "text-error")}
        />
      )}
    </button>
  );
}
