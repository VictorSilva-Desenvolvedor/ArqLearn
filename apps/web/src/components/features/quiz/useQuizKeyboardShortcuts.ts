import { useEffect } from "react";

interface UseQuizKeyboardShortcutsOptions {
  enabled: boolean;
  revealed: boolean;
  optionIds: string[];
  canSelect: boolean;
  canVerify: boolean;
  verifying: boolean;
  onSelect: (optionId: string) => void;
  onVerify: () => void;
  onContinue: () => void;
}

// Heurística 7 (Flexibility/Efficiency) do /impeccable critique (18/08/2026): sem nenhum
// acelerador de teclado na ação mais repetida do produto. "Invisible to novices" por natureza —
// nunca mostra dica na tela, só funciona pra quem já sabe que existe (Alex, power user).
// `canSelect` desliga a seleção por dígito em fill_blank (texto livre) pra não competir com a
// digitação; Enter continua funcionando ali normalmente via onSubmit nativo do form/input.
export function useQuizKeyboardShortcuts({
  enabled,
  revealed,
  optionIds,
  canSelect,
  canVerify,
  verifying,
  onSelect,
  onVerify,
  onContinue,
}: UseQuizKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;

      if (revealed) {
        if (event.key === "Enter") {
          event.preventDefault();
          onContinue();
        }
        return;
      }

      if (canSelect && /^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (index < optionIds.length) {
          event.preventDefault();
          onSelect(optionIds[index]);
        }
        return;
      }

      if (event.key === "Enter" && canVerify && !verifying) {
        event.preventDefault();
        onVerify();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, revealed, optionIds, canSelect, canVerify, verifying, onSelect, onVerify, onContinue]);
}
