import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { freezeStreak } from "@/lib/api/resources/gamification";
import { ApiError } from "@/lib/api/http";
import { colors, type } from "@/theme/tokens";

// Espelha apps/web/src/components/features/profile/StreakFreezeCard.tsx.
export function StreakFreezeCard() {
  const { streakFreezesAvailable, adjustStreakFreezes } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUse = async () => {
    setPending(true);
    setMessage(null);
    try {
      await freezeStreak(streakFreezesAvailable);
      adjustStreakFreezes(-1);
      setMessage("Ofensiva protegida! Se você faltar hoje, sua sequência continua intacta.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Não foi possível usar o bloqueio agora.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card padding="md" radius="lg" style={styles.card}>
      <Icon name="freeze" size={28} color={colors.primary} />
      <View style={styles.textBlock}>
        <Text style={[type.bodyLg, styles.title]}>Bloqueio de Ofensiva</Text>
        <Text style={[type.bodySm, styles.caption]}>
          {streakFreezesAvailable > 0
            ? `${streakFreezesAvailable} disponível${streakFreezesAvailable > 1 ? "is" : ""} — protege sua sequência caso falte um dia.`
            : "Sem bloqueios disponíveis — compre um na Loja."}
        </Text>
        {message && <Text style={[type.bodySm, styles.message]}>{message}</Text>}
      </View>
      <Button variant="ghost" size="sm" disabled={streakFreezesAvailable === 0 || pending} onPress={handleUse}>
        {pending ? "Usando…" : "Usar"}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  caption: {
    color: colors.onSurfaceVariant,
  },
  message: {
    color: colors.tertiary,
    marginTop: 4,
  },
});
