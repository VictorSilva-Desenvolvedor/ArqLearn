import { Button } from "@/components/ui/Button";

interface InfiniteModeActionBarProps {
  revealed: boolean;
  canConfirm: boolean;
  onGiveUp: () => void;
  onConfirm: () => void;
  onContinue: () => void;
}

export function InfiniteModeActionBar({
  revealed,
  canConfirm,
  onGiveUp,
  onConfirm,
  onContinue,
}: InfiniteModeActionBarProps) {
  return (
    <div className="sticky bottom-0 border-t-2 border-outline-variant bg-surface-bright px-md py-md">
      <div className="flex items-center justify-between gap-md max-w-2xl mx-auto">
        {revealed ? (
          <Button variant="primary" fullWidth onClick={onContinue}>
            Continuar
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onGiveUp}>
              Desistir
            </Button>
            <Button variant="primary" disabled={!canConfirm} onClick={onConfirm}>
              Confirmar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
