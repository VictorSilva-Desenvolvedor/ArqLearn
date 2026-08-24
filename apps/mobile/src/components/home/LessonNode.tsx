import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useToast } from "@/hooks/useToast";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// "available" = tem pergunta aprovada de verdade, mas o usuário ainda não começou — navegável,
// fora de ordem (sem bloqueio por sequência fake). "construction" = sem nenhuma pergunta aprovada
// ainda, não navegável — mostra o ícone de "em construção" em vez do ícone normal da lição, pra
// não parecer só "bloqueada" (que sugeria um pré-requisito que não existe de verdade).
export type LessonNodeVariant = "completed" | "current" | "available" | "construction" | "checkpoint";

interface LessonNodeProps {
  variant: Exclude<LessonNodeVariant, "current">;
  icon: IconName;
  href: string;
}

export function LessonNode({ variant, icon, href }: LessonNodeProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const colors = useColors();
  const styles = createStyles(colors);

  if (variant === "checkpoint") {
    return (
      <Pressable
        onPress={() => router.push(href as never)}
        accessibilityRole="button"
        accessibilityLabel="Checkpoint — toque para abrir"
        style={styles.checkpointOuter}
      >
        <View style={styles.checkpointIcon}>
          <Icon name={icon} size={32} color={colors.onPrimary} />
        </View>
      </Pressable>
    );
  }

  if (variant === "completed") {
    return (
      <Pressable
        onPress={() => router.push(href as never)}
        accessibilityRole="button"
        accessibilityLabel="Lição concluída — toque para revisar"
        style={styles.completed}
      >
        {/* "completed" sempre mostra check — não depende de nenhum dado mockado atribuir esse
            ícone à lição; o ícone da matéria (`icon`) só faz sentido pra checkpoint/available.
            Espelha apps/web/.../LessonNode.tsx e a referência do Stitch
            (home_mapa_de_aprendizado/screen.png), onde os nós concluídos são checks. */}
        <Icon name="check" size={28} color={colors.onPrimary} />
      </Pressable>
    );
  }

  if (variant === "available") {
    return (
      <Pressable
        onPress={() => router.push(href as never)}
        style={styles.available}
        accessibilityRole="button"
        accessibilityLabel="Lição disponível — toque para começar"
      >
        <Icon name={icon} size={28} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    // Pressable em vez de View: tocar não fazia nada — sem feedback, achado ao vivo. Continua
    // "não navegável" de propósito (sem router.push), só explica por que a lição não abre.
    <Pressable
      onPress={() => showToast("Esta lição ainda está em preparação — volte em breve!")}
      style={styles.construction}
      accessibilityRole="button"
      accessibilityLabel="Lição em construção — ainda sem conteúdo"
    >
      <Icon name="construction" size={26} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    checkpointOuter: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: "45deg" }],
    },
    checkpointIcon: {
      transform: [{ rotate: "-45deg" }],
    },
    completed: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    available: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceBright,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    construction: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceGray,
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
  });
