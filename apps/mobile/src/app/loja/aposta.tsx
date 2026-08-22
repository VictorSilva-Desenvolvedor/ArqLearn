import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getActiveGemBet, startGemBet } from "@/lib/api/resources/gems";
import { spacing, radius, type as typeTokens } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { GemBet } from "@/types/api";

// Double or Nothing (TDD §15.3) — aposta gemas, compromete-se a manter o streak por 7 dias
// corridos, dobra ou perde. Resolvida automaticamente pelo backend nos mesmos pontos que já
// leem/expiram o streak; esta tela só inicia a aposta e mostra o progresso. Espelha
// apps/web/src/app/(shell)/loja/aposta/page.tsx.
const MIN_STAKE = 50;

export default function GemBetScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { gamification } = useAuth();
  const { showToast } = useToast();
  const [bet, setBet] = useState<GemBet | null | undefined>(undefined);
  const [stake, setStake] = useState(String(MIN_STAKE));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveGemBet().then((b) => {
      if (!cancelled) setBet(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = async () => {
    const stakeGems = parseInt(stake, 10);
    if (starting || !Number.isFinite(stakeGems)) return;
    setError(null);
    setStarting(true);
    try {
      const result = await startGemBet(stakeGems);
      setBet(result);
      showToast("Aposta iniciada! Mantenha o streak por 7 dias.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a aposta agora.");
    } finally {
      setStarting(false);
    }
  };

  const stakeGems = parseInt(stake, 10);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[typeTokens.displayLg, styles.headerTitle]}>Double or Nothing</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.diceBadge}>
            <Icon name="dice" size={40} color={colors.onTertiaryContainer} />
          </View>
          <Text style={[typeTokens.bodyLg, styles.muted]}>
            Aposte gemas e comprometa-se a manter sua sequência por 7 dias. Bateu a meta, dobra. Perdeu a
            sequência, perde a aposta.
          </Text>
        </View>

        {bet === undefined && <Text style={[typeTokens.bodySm, styles.muted]}>Carregando…</Text>}

        {bet && (
          <Card padding="lg" style={styles.progressCard}>
            <Icon name="streak" size={28} color={colors.tertiary} />
            <Text style={[typeTokens.questionLg, styles.progressTitle]}>
              {bet.days_completed} / {bet.days_required} dias
            </Text>
            <Text style={[typeTokens.bodyMd, styles.muted]}>
              {bet.stake_gems} gemas em jogo — complete a sequência pra ganhar {bet.stake_gems * 2} gemas.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (bet.days_completed / bet.days_required) * 100)}%` },
                ]}
              />
            </View>
          </Card>
        )}

        {bet === null && (
          <Card padding="lg" style={styles.startCard}>
            <Text style={[typeTokens.questionLg, styles.startTitle]}>Iniciar aposta</Text>
            <Text style={[typeTokens.bodySm, styles.muted]}>
              Mínimo de {MIN_STAKE} gemas. Você tem {gamification.gems} gemas.
            </Text>
            <TextInput
              style={styles.input}
              value={stake}
              onChangeText={setStake}
              keyboardType="number-pad"
              accessibilityLabel="Quantidade de gemas apostadas"
            />
            {error && <Text style={[typeTokens.bodySm, styles.error]}>{error}</Text>}
            <Button
              variant="primary"
              fullWidth
              disabled={starting || stakeGems < MIN_STAKE || stakeGems > gamification.gems}
              onPress={handleStart}
              icon={<Icon name="dice" size={18} color={colors.onPrimary} />}
            >
              {starting ? "Iniciando…" : "Apostar"}
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    headerTitle: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: "700",
    },
    hero: {
      alignItems: "center",
      gap: spacing.xs,
    },
    diceBadge: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: colors.tertiaryContainer,
      borderWidth: 2,
      borderColor: colors.tertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    muted: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    progressCard: {
      alignItems: "center",
      gap: spacing.xs,
      borderColor: colors.tertiary,
    },
    progressTitle: {
      color: colors.onSurface,
    },
    progressTrack: {
      width: "100%",
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceVariant,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.tertiary,
      borderRadius: 4,
    },
    startCard: {
      gap: spacing.xs,
    },
    startTitle: {
      color: colors.onSurface,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.onSurface,
    },
    error: {
      color: colors.error,
    },
  });
