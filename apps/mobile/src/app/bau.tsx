import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { useAuth } from "@/hooks/useAuth";
import {
  getDailyChestStatus,
  getWeeklyChestStatus,
  openDailyChest,
  openWeeklyChest,
} from "@/lib/api/resources/gamification";
import { resetDailyChestVip, resetWeeklyChestVip } from "@/lib/api/resources/vip";
import { ApiError } from "@/lib/api/http";
import { radius, spacing, type as typeTokens } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { ChestOpenResult, ChestRewardType } from "@/types/api";

const HEARTS_MAX = 5;

const REWARD_ICON: Record<ChestRewardType, IconName> = {
  gems: "gems",
  streak_freeze: "freeze",
  hearts_refill: "hearts",
};

const REWARD_LABEL: Record<ChestRewardType, string> = {
  gems: "Gemas",
  streak_freeze: "Bloqueio de Ofensiva",
  hearts_refill: "Vidas Restauradas",
};

type ChestType = "diario" | "semanal";

const CHEST_COPY: Record<ChestType, { eyebrow: string; titulo: string; unavailable: string }> = {
  diario: {
    eyebrow: "Baú Diário",
    titulo: "Você ganhou um Baú de Projeto!",
    unavailable: "Acerte mais perguntas hoje pra liberar seu próximo Baú Diário.",
  },
  semanal: {
    eyebrow: "Baú Semanal",
    titulo: "Você ganhou um Baú Semanal!",
    unavailable: "Acerte mais perguntas nos próximos dias pra liberar seu próximo Baú Semanal — o ciclo só reinicia quando 7 dias se passarem.",
  },
};

// Tela de transição do Baú Diário/Semanal (a pedido do usuário, v1.18/v1.19) — fechado -> "Abrir
// Baú" (chama a API de verdade) -> "Recompensas Coletadas!" com a recompensa real determinada
// pelo servidor. `?tipo=diario|semanal` (default diario) decide qual dos dois baús esta instância
// da tela representa — mesmo shell visual, endpoints e textos diferentes. Espelha
// apps/web/src/app/(lesson)/bau/page.tsx. Mesmo padrão visual da tela de conquista
// (trilhas/[trackId]/[lessonId]/conquista.tsx), mas credita via chamada de API real em vez de
// crédito local — não há como simular a recompensa (é sorteada no servidor).
export default function DailyChestScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { tipo: tipoParam } = useLocalSearchParams<{ tipo?: string }>();
  const tipo: ChestType = tipoParam === "semanal" ? "semanal" : "diario";
  const copy = CHEST_COPY[tipo];
  const { gamification, updateGamification, adjustStreakFreezes } = useAuth();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<ChestOpenResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    const statusPromise = tipo === "semanal" ? getWeeklyChestStatus() : getDailyChestStatus();
    statusPromise.then((status) => {
      if (cancelled) return;
      setAvailable(status.available);
      setClaimed(tipo === "semanal" ? "claimed_this_cycle" in status && status.claimed_this_cycle : "claimed_today" in status && status.claimed_today);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  // Benefício VIP: resetar o baú já reivindicado libera uma nova abertura na hora (a pedido do
  // usuário, ver services/monolith/internal/gamification/vip.go handleResetDailyChest/
  // handleResetWeeklyChest) — só faz sentido oferecer quando já foi aberto (não quando ainda
  // faltam perguntas pra liberar o primeiro).
  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    setError(null);
    try {
      await (tipo === "semanal" ? resetWeeklyChestVip() : resetDailyChestVip());
      setAvailable(true);
      setClaimed(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resetar o baú agora.");
    } finally {
      setResetting(false);
    }
  };

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const result = await (tipo === "semanal" ? openWeeklyChest() : openDailyChest());
      setReward(result);
      updateGamification({
        gems: result.gems,
        ...(result.reward_type === "hearts_refill" ? { hearts_current: HEARTS_MAX } : {}),
      });
      if (result.reward_type === "streak_freeze") {
        adjustStreakFreezes(1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível abrir o baú agora.");
    } finally {
      setOpening(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <LoadingBlueprint variant="inline" size={96} />
      </SafeAreaView>
    );
  }

  if (!available && !reward) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <View style={styles.lockedBadge}>
            <Icon name="lock" size={48} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[typeTokens.labelCaps, styles.eyebrow]}>{copy.eyebrow}</Text>
            <Text style={[typeTokens.headlineMd, styles.title]}>Nenhum Baú disponível</Text>
            <Text style={[typeTokens.bodyMd, styles.description]}>{copy.unavailable}</Text>
          </View>
          {error && <Text style={[typeTokens.bodySm, styles.error]}>{error}</Text>}
          {claimed && gamification.is_vip && (
            <Button
              variant="gamification"
              fullWidth
              disabled={resetting}
              onPress={handleReset}
              icon={<Icon name="replay" size={18} color={colors.onSecondaryContainer} />}
            >
              {resetting ? "Resetando…" : "Resetar Baú (VIP)"}
            </Button>
          )}
          <Button variant="primary" fullWidth onPress={() => router.push("/")}>
            Voltar ao Mapa
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        {reward ? (
          <>
            <View style={styles.badge}>
              <View style={styles.badgeIconCounterRotate}>
                <Icon name={REWARD_ICON[reward.reward_type]} size={48} color={colors.onSecondary} />
              </View>
            </View>
            <View style={styles.textBlock}>
              <Text style={[typeTokens.labelCaps, styles.eyebrow]}>{copy.eyebrow}</Text>
              <Text style={[typeTokens.headlineMd, styles.title]}>Recompensas Coletadas!</Text>
              <Text style={[typeTokens.bodyMd, styles.description]}>
                {reward.reward_type === "gems"
                  ? `Você ganhou +${reward.gems_earned} gemas!`
                  : `Você ganhou: ${REWARD_LABEL[reward.reward_type]}`}
              </Text>
            </View>
            <View style={styles.rewardChip}>
              <Icon name={REWARD_ICON[reward.reward_type]} size={20} color={colors.secondary} />
              <Text style={[typeTokens.statsNum, styles.rewardText]}>
                {reward.reward_type === "gems" ? `+${reward.gems_earned} gemas` : REWARD_LABEL[reward.reward_type]}
              </Text>
            </View>
            <Button variant="primary" fullWidth onPress={() => router.push("/")}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <View style={styles.closedBadge}>
              <Icon name="chest" size={48} color={colors.secondary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[typeTokens.labelCaps, styles.eyebrow]}>{copy.eyebrow}</Text>
              <Text style={[typeTokens.headlineMd, styles.title]}>{copy.titulo}</Text>
              <Text style={[typeTokens.bodyMd, styles.description]}>Abra pra revelar sua recompensa.</Text>
            </View>
            {error && <Text style={[typeTokens.bodySm, styles.error]}>{error}</Text>}
            <Button
              variant="primary"
              fullWidth
              disabled={opening}
              onPress={handleOpen}
              icon={<Icon name="lockOpen" size={18} color={colors.onPrimary} />}
            >
              {opening ? "Abrindo…" : "Abrir Baú"}
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      backgroundColor: colors.background,
    },
    content: {
      width: "100%",
      maxWidth: 448,
      alignItems: "center",
      gap: spacing.lg,
    },
    badge: {
      width: 112,
      height: 112,
      borderRadius: radius.xl,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: "45deg" }],
    },
    badgeIconCounterRotate: {
      transform: [{ rotate: "-45deg" }],
    },
    closedBadge: {
      width: 112,
      height: 112,
      borderRadius: radius.xl,
      backgroundColor: colors.secondaryContainer,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    lockedBadge: {
      width: 112,
      height: 112,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      alignItems: "center",
    },
    eyebrow: {
      color: colors.secondary,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    description: {
      color: colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: "center",
    },
    rewardChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rewardText: {
      color: colors.secondary,
    },
    error: {
      color: colors.errorRed,
    },
  });
