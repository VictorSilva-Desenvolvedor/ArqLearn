import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, StyleSheet, View } from "react-native";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { radius } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

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
  const colors = useColors();
  const styles = createStyles(colors);
  const reduceMotion = useReduceMotion();
  return (
    <RNModal
      visible={open}
      transparent
      // statusBarTranslucent/navigationBarTranslucent (achado ao investigar ThemeSelector não
      // abrindo em device Android físico, 21/08/2026): o Modal nativo do RN, sem essas duas
      // props, não renderiza de forma confiável em cima do conteúdo quando o edge-to-edge do
      // Android está ativo — que é sempre, a partir do Expo SDK 54 (não é mais opcional, ver
      // app.json). Sem isso, o modal ficava "aberto" no estado (visible=true) mas invisível na
      // tela. Bug sistêmico, não específico do ThemeSelector — este componente é compartilhado
      // por todo diálogo do app (StreakDialog, NoHeartsDialog, AllDonePrompt, etc.).
      statusBarTranslucent
      navigationBarTranslucent
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

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
