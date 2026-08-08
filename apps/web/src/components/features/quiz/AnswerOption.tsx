import { cn } from "@/lib/utils/cn";

interface AnswerOptionProps {
  label: string;
  selected: boolean;
  revealed: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function AnswerOption({ label, selected, revealed, isCorrect, disabled, onClick }: AnswerOptionProps) {
  let toneClasses = "border-outline-variant bg-surface-bright hover:border-primary";
  if (selected && !revealed) {
    toneClasses = "border-primary bg-primary-fixed";
  }
  if (revealed && selected) {
    toneClasses = isCorrect
      ? "border-tertiary bg-tertiary-fixed text-on-tertiary-fixed-variant"
      : "border-error bg-error-container text-on-error-container";
  }
  if (revealed && !selected) {
    toneClasses = "border-outline-variant bg-surface-bright opacity-60";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left border-2 rounded-lg px-md py-sm font-body-lg text-body-lg transition-colors disabled:cursor-not-allowed",
        toneClasses,
      )}
    >
      {label}
    </button>
  );
}
