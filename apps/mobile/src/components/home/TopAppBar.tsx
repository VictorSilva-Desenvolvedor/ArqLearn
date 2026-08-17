import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { StatPill } from "@/components/ui/StatPill";
import { NoHeartsDialog } from "@/components/features/gamification/NoHeartsDialog";
import { StreakDialog } from "@/components/features/gamification/StreakDialog";
import { useAuth } from "@/hooks/useAuth";
import { xpParaProximoNivel } from "@/lib/gamification/level";
import { colors, type } from "@/theme/tokens";
import { ThemeSelector } from "./ThemeSelector";

// Espelha apps/web/src/components/layout/TopAppBar.tsx — lá o streak/hearts do header abrem
// StreakDialog/NoHeartsDialog ao toque (gemas não, nem no web); aqui o mobile só tinha o
// NoHeartsDialog acoplado à tela de quiz (zerar vidas durante a sessão), nunca à barra do topo.
export function TopAppBar() {
  const router = useRouter();
  const { user, gamification } = useAuth();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const [heartsDialogOpen, setHeartsDialogOpen] = useState(false);
  const xpFaltam = xpParaProximoNivel(gamification.level, gamification.xp_total);

  // Web mostra a pílula de stats inline no header em telas largas e move para uma segunda
  // faixa abaixo em mobile (`md:hidden`) — aqui só existe a variante mobile.
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={[styles.row, styles.content]}>
        <View style={styles.brand}>
          <Icon name="logo" size={28} color={colors.primary} />
          <Text style={[type.displayLg, styles.brandText]}>ArqLearn</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon={<Icon name="notifications" size={22} color={colors.onSurfaceVariant} />}
            label="Notificações"
            onPress={() => router.push("/notificacoes" as never)}
          />
          <Pressable
            style={styles.profile}
            onPress={() => router.push("/perfil" as never)}
            accessibilityRole="button"
            accessibilityLabel={`Perfil. Nível ${gamification.level}, ${xpFaltam} XP para o próximo.`}
          >
            <Text style={[type.labelCaps, styles.levelLine]} numberOfLines={1}>
              <Text style={styles.levelText}>Nível {gamification.level}</Text>
              <Text style={styles.levelCaption}> · {xpFaltam} XP p/ próx.</Text>
            </Text>
            <Avatar name={user.name} size={32} />
          </Pressable>
        </View>
      </View>
      <View style={styles.themeRow}>
        {/* content: mesmo maxWidth 448/center que index.tsx e LearningMap.tsx já aplicam ao
            corpo da Home — sem isso, no iPad (ios.supportsTablet: true) o header ficava mais
            largo que o conteúdo abaixo dele (achado de /impeccable audit, 2026-08-17). */}
        <View style={styles.content}>
          <ThemeSelector />
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statsRowInner, styles.content]}>
          {/* hitSlop: a pílula em si (ícone 18px + statsNum) mede ~28px de altura, abaixo do
              mínimo de toque 44pt(iOS)/48dp(Android) — hitSlop estende a área de toque sem mudar
              o visual. */}
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={() => setStreakDialogOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sequência: ${gamification.streak_current} dias`}
          >
            <StatPill tone="secondary" icon="streak" value={gamification.streak_current} />
          </Pressable>
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={() => setHeartsDialogOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Vidas: ${gamification.hearts_current}`}
          >
            <StatPill tone="error" icon="hearts" value={gamification.hearts_current} />
          </Pressable>
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={() => router.push("/loja" as never)}
            accessibilityRole="button"
            accessibilityLabel={`Gemas: ${gamification.gems}`}
          >
            {/* Moeda de recompensa — camada de gamificação, mesmo job de streak (não navegação). */}
            <StatPill tone="secondary" icon="gems" value={gamification.gems} />
          </Pressable>
        </View>
      </View>
      <StreakDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
      <NoHeartsDialog open={heartsDialogOpen} onOpenChange={setHeartsDialogOpen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surfaceBright,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
  },
  // Mesmo limite de apps/mobile/src/app/(tabs)/index.tsx e LearningMap.tsx — centraliza e trava
  // a largura em telas grandes (iPad) em vez de esticar full-width.
  content: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    color: colors.primary,
    fontWeight: "700",
  },
  themeRow: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGray,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingVertical: 6,
  },
  statsRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceGray,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingVertical: 8,
  },
  statsRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelLine: {
    maxWidth: 180,
  },
  levelText: {
    color: colors.primary,
    fontWeight: "700",
  },
  levelCaption: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
});
