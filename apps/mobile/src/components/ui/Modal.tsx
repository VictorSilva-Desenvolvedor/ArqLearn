import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, StyleSheet, View } from "react-native";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { colors, radius } from "@/theme/tokens";

type ModalRadius = "xl" | "full";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
  // "full": modal "redondinho" — cantos bem mais arredondados que radius.xl, pro efeito de
  // cartão compacto/circular (ex. diálogo de Vidas). Espelha apps/web/src/components/ui/Modal.tsx.
  radius?: ModalRadius;
}

const radiusValues: Record<ModalRadius, number> = {
  xl: radius.xl,
  full: 40,
};

// Usa o Modal nativo do react-native (não Radix — exclusivo do web); "fade" já dá a mesma
// sensação de entrada suave que a animação CSS do web sem precisar de reanimated.
export function Modal({ open, onOpenChange, children, dismissible = true, radius: radiusVariant = "xl" }: ModalProps) {
  const reduceMotion = useReduceMotion();
  return (
    <RNModal
      visible={open}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={() => dismissible && onOpenChange(false)}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => dismissible && onOpenChange(false)}
      >
        <Pressable style={[styles.content, { borderRadius: radiusValues[radiusVariant] }]} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    padding: 24,
  },
});
