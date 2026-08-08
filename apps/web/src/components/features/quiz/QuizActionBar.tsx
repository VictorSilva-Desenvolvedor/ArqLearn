import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface QuizActionBarProps {
  revealed: boolean;
  isCorrect: boolean;
  explanation: string;
  canVerify: boolean;
  onSkip: () => void;
  onVerify: () => void;
  onContinue: () => void;
}

export function QuizActionBar({
  revealed,
  isCorrect,
  explanation,
  canVerify,
  onSkip,
  onVerify,
  onContinue,
}: QuizActionBarProps) {
  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright">
      {revealed && (
        <div
          className={cn(
            "px-md py-sm max-w-2xl mx-auto font-body-md text-body-md",
            isCorrect ? "text-on-tertiary-fixed-variant" : "text-on-error-container",
          )}
        >
          {explanation}
        </div>
      )}
      <div className="flex items-center justify-between gap-md max-w-2xl mx-auto px-md py-md">
        {revealed ? (
          <Button variant="primary" fullWidth onClick={onContinue}>
            Continuar
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onSkip}>
              Pular
            </Button>
            <Button variant="primary" disabled={!canVerify} onClick={onVerify}>
              Verificar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
