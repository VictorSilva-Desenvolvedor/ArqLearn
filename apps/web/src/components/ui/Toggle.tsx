import { cn } from "@/lib/utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        // Alvo de toque real de 44x44 (achado de audit — a trilha visual de 44x24 sozinha ficava
        // abaixo do mínimo) sem mudar a aparência: o botão cresce, a trilha continua do mesmo
        // tamanho, centralizada dentro dele.
        "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-outline-variant",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
