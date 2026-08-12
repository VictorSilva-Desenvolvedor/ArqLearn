import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface InfiniteModeActionBarProps {
  revealed: boolean;
  xpDailyCapReached: boolean;
  canConfirm: boolean;
  verifying?: boolean;
  onGiveUp: () => void;
  onConfirm: () => void;
  onContinue: () => void;
}

export function InfiniteModeActionBar({
  revealed,
  xpDailyCapReached,
  canConfirm,
  verifying = false,
  onGiveUp,
  onConfirm,
  onContinue,
}: InfiniteModeActionBarProps) {
  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright px-md py-md">
      {revealed && xpDailyCapReached && (
        <div className="max-w-2xl mx-auto mb-sm flex items-center gap-1 font-body-sm text-body-sm text-secondary">
          <Icon name="bolt" filled className="text-base" />
          Você atingiu o limite diário de XP — o XP extra de hoje não conta.
        </div>
      )}
      <div className="flex items-center justify-between gap-md max-w-2xl mx-auto">
        {revealed ? (
          <Button variant="primary" fullWidth onClick={onContinue}>
            Continuar
          </Button>
        ) : (
          <>
            <Button variant="ghost" disabled={verifying} onClick={onGiveUp}>
              Desistir
            </Button>
            <Button
              variant="primary"
              disabled={!canConfirm || verifying}
              icon={
                verifying ? (
                  <Icon name="progress_activity" className="animate-spin text-xl" />
                ) : undefined
              }
              onClick={onConfirm}
            >
              {verifying ? "Verificando…" : "Confirmar"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
