import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// RN não tem um equivalente do `prefers-reduced-motion` global do CSS (ver apps/web/globals.css) —
// cada componente que anima precisa checar isso na mão. `/impeccable audit` (17/08/2026) encontrou
// zero uso disso no app apesar de loops indefinidos em LoadingBlueprint e o fade padrão do Modal.
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
