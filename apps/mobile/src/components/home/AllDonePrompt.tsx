import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface AllDonePromptProps {
  topic: string;
  themeLabel: string;
  // true quando StreakAtRiskPrompt (_layout.tsx raiz) também vai abrir sozinho — os dois são
  // Modals independentes e um por cima do outro intercepta o toque do botão de baixo (mesmo
  // problema confirmado ao vivo no espelho web via Playwright). Streak em risco é mais urgente
  // (a sequência morre à meia-noite) que "continue no Modo Infinito" (sem prazo), então este não
  // abre sozinho quando os dois concorreriam.
  suppressAutoOpen?: boolean;
}

// Dispensados nesta execução do app — equivalente RN de sessionStorage (web): não há storage de
// sessão de navegador aqui, então um Set em memória de módulo já cobre o mesmo objetivo (não
// reabrir sozinho depois que a pessoa já viu/dispensou), e reseta sozinho quando o app é
// fechado/reaberto de verdade, igual a uma aba nova reiniciaria o sessionStorage do zero.
const dismissedThisSession = new Set<string>();

// Espelha apps/web/src/components/features/home/AllDonePrompt.tsx — aparece só quando a trilha em
// destaque da Home está 100% concluída (ver (tabs)/index.tsx), oferecendo continuar praticando no
// Modo Infinito em vez de só mostrar o mapa todo verde sem próxima ação.
export function AllDonePrompt({ topic, themeLabel, suppressAutoOpen }: AllDonePromptProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const colors = useColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (suppressAutoOpen) return;
    // Delay proposital (não 0ms): dá um instante pro mapa 100% verde aparecer primeiro — a
    // conquista se lê no próprio mapa antes do modal chegar, em vez de interceptar a tela no
    // instante do mount como uma interrupção não pedida.
    const id = setTimeout(() => {
      if (!dismissedThisSession.has(topic)) setOpen(true);
    }, 600);
    return () => clearTimeout(id);
  }, [topic, suppressAutoOpen]);

  const dismiss = () => {
    dismissedThisSession.add(topic);
    setOpen(false);
  };

  const goInfinite = () => {
    dismissedThisSession.add(topic);
    setOpen(false);
    router.push(`/infinito/${topic}/sessao` as never);
  };

  return (
    <Modal open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())} radius="full">
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon name="celebration" size={40} color={colors.secondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[type.headlineMd, styles.title]}>Tudo em dia!</Text>
          <Text style={[type.bodyMd, styles.description]}>
            Você concluiu todas as lições de {themeLabel} por enquanto. Continue praticando sem
            parar no Modo Infinito.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button variant="gamification" fullWidth onPress={goInfinite}>
            Ir para o Modo Infinito
          </Button>
          <Button variant="ghost" fullWidth onPress={dismiss}>
            Ver o mapa
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      alignItems: "center",
      gap: spacing.md,
    },
    iconBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.secondaryContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      alignItems: "center",
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    description: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 8,
    },
    actions: {
      width: "100%",
      gap: spacing.sm,
    },
  });
