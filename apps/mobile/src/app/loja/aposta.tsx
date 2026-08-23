import { useCallback, useEffect, useState } from "react";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  // `.catch` não é opcional: sem ele a promise rejeitada (401, backend fora do ar, timeout do
  // apiFetch) só virava unhandled rejection e `bet` ficava `undefined` pra sempre — a tela
  // travava em "Carregando…" sem mensagem nem saída. Reproduzido ao vivo na auditoria. `load` é
  // um callback (e não só um efeito) porque o RN não tem `window.location.reload()` — o botão
  // "Tentar de novo" precisa re-chamar a mesma busca.
  const load = useCallback(async () => {
    setLoadError(null);
    setBet(undefined);
    try {
      setBet(await getActiveGemBet());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Não foi possível carregar sua aposta agora.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Único parse do input, compartilhado entre o `disabled` do botão e o handler — antes o botão
  // usava `stakeGems < MIN_STAKE`, que com o campo vazio dá NaN e toda comparação com NaN é
  // `false`: o botão ficava HABILITADO e o toque caía no `return` silencioso do handler (achado
  // ao vivo na auditoria — "Apostar" tocável que não fazia nada).
  const stakeGems = parseInt(stake, 10);
  const stakeIsValid = Number.isFinite(stakeGems) && stakeGems >= MIN_STAKE && stakeGems <= gamification.gems;

  const handleStart = async () => {
    if (starting || !stakeIsValid) return;
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

        {bet === undefined && !loadError && <Text style={[typeTokens.bodySm, styles.muted]}>Carregando…</Text>}

        {loadError && (
          <Card padding="lg" style={styles.loadErrorCard}>
            <Icon name="error" size={28} color={colors.error} />
            <Text style={[typeTokens.bodyMd, styles.loadErrorText]}>{loadError}</Text>
            <Button variant="ghost" onPress={load} icon={<Icon name="replay" size={18} color={colors.primary} />}>
              Tentar de novo
            </Button>
          </Card>
        )}

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
              disabled={starting || !stakeIsValid}
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
    loadErrorCard: {
      alignItems: "center",
      gap: spacing.xs,
    },
    loadErrorText: {
      color: colors.onSurface,
      textAlign: "center",
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
