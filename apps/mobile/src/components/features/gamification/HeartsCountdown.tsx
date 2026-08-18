import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdownToTimestamp } from "@/hooks/useCountdown";
import { useAuth } from "@/hooks/useAuth";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Mesmo intervalo do backend (TDD §5.4) — só usado aqui pra desenhar a barra de progresso (o
// "quanto falta" vem de verdade de hearts_next_at, isto é só a escala visual da barra). Era 3h
// até 18/08/2026, a pedido do usuário (36min por vida = 3h pra encher do zero, não mais 15h).
const HEARTS_REGEN_INTERVAL_SECONDS = 36 * 60;

// Espelha apps/web/src/components/features/gamification/HeartsCountdown.tsx.
export function HeartsCountdown() {
  const { gamification } = useAuth();
  const { secondsLeft, formatted, reachedZero } = useCountdownToTimestamp(gamification.hearts_next_at);
  const colors = useColors();
  const styles = createStyles(colors);

  if (!gamification.hearts_next_at) {
    return (
      <View style={styles.fullRow}>
        <Icon name="hearts" size={16} color={colors.errorRed} />
        <Text style={[type.bodySm, styles.fullText]}>Suas vidas estão cheias!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Icon name="schedule" size={16} color={colors.onSurfaceVariant} />
        <Text style={[type.bodySm, styles.text]}>
          {reachedZero ? "Regenerando…" : `Próxima vida em ${formatted}`}
        </Text>
      </View>
      <ProgressBar
        value={HEARTS_REGEN_INTERVAL_SECONDS - Math.min(secondsLeft, HEARTS_REGEN_INTERVAL_SECONDS)}
        max={HEARTS_REGEN_INTERVAL_SECONDS}
        variant="tube"
        tone="secondary"
      />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
      gap: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    text: {
      color: colors.onSurfaceVariant,
    },
    fullRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    fullText: {
      color: colors.onSurfaceVariant,
    },
  });
