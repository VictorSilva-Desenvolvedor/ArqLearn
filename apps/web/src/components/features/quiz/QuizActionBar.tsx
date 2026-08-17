import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { cn } from "@/lib/utils/cn";

interface QuizActionBarProps {
  revealed: boolean;
  isCorrect: boolean;
  explanation: string;
  xpDailyCapReached: boolean;
  canVerify: boolean;
  verifying?: boolean;
  onSkip: () => void;
  onVerify: () => void;
  onContinue: () => void;
  // "Explique melhor" (API Spec §6, v1.6) — aprofunda a explicação curta acima sob demanda,
  // chamando IA de verdade (Groq). deepExplanation null = ainda não pedida nesta pergunta.
  deepExplanation?: string | null;
  explainLoading?: boolean;
  explainError?: string | null;
  onExplainMore?: () => void;
}

export function QuizActionBar({
  revealed,
  isCorrect,
  explanation,
  xpDailyCapReached,
  canVerify,
  verifying = false,
  onSkip,
  onVerify,
  onContinue,
  deepExplanation,
  explainLoading,
  explainError,
  onExplainMore,
}: QuizActionBarProps) {
  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright">
      {revealed && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "px-md py-sm max-w-2xl mx-auto font-body-md text-body-md",
            isCorrect ? "text-on-tertiary-fixed-variant" : "text-on-error-container",
          )}
        >
          {explanation}
        </div>
      )}
      {revealed && onExplainMore && (
        <div className="px-md pb-sm max-w-2xl mx-auto flex flex-col gap-xs">
          {deepExplanation ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container rounded-md px-md py-sm">
              {deepExplanation}
            </p>
          ) : (
            <button
              type="button"
              onClick={onExplainMore}
              disabled={explainLoading}
              className="self-start flex items-center gap-1 font-label text-body-sm text-primary underline disabled:opacity-50"
            >
              {explainLoading && <LoadingBlueprint size={16} />}
              {explainLoading ? "Aprofundando..." : "Explique melhor"}
            </button>
          )}
          {explainError && <p className="font-body-sm text-body-sm text-error">{explainError}</p>}
        </div>
      )}
      {revealed && xpDailyCapReached && (
        <div className="px-md pb-sm max-w-2xl mx-auto flex items-center gap-1 font-body-sm text-body-sm text-secondary">
          <Icon name="bolt" filled className="text-base" />
          Você atingiu o limite diário de XP — continue praticando, mas o XP extra de hoje não conta.
        </div>
      )}
      <div className="flex items-center justify-between gap-md max-w-2xl mx-auto px-md py-md">
        {revealed ? (
          <Button variant="primary" fullWidth onClick={onContinue}>
            Continuar
          </Button>
        ) : (
          <>
            <Button variant="ghost" disabled={verifying} onClick={onSkip}>
              Pular
            </Button>
            <Button
              variant="gamification"
              disabled={!canVerify || verifying}
              icon={verifying ? <LoadingBlueprint size={20} /> : undefined}
              onClick={onVerify}
            >
              {verifying ? "Verificando…" : "Verificar"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
