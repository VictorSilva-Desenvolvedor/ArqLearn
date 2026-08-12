import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { StatPill } from "@/components/ui/StatPill";
import { useAuth } from "@/hooks/useAuth";
import { colors, type } from "@/theme/tokens";

export function TopAppBar() {
  const router = useRouter();
  const { user, gamification } = useAuth();

  // Web mostra a pílula de stats inline no header em telas largas e move para uma segunda
  // faixa abaixo em mobile (`md:hidden`) — aqui só existe a variante mobile.
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Icon name="logo" size={28} color={colors.primary} />
          <Text style={[type.displayLg, styles.brandText]}>ArqLearn</Text>
        </View>
        <Pressable style={styles.profile} onPress={() => router.push("/perfil" as never)}>
          <Text style={[type.labelCaps, { color: colors.primary }]}>{gamification.xp_total} XP</Text>
          <Avatar name={user.name} size={32} />
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <StatPill tone="secondary" icon="streak" value={gamification.streak_current} />
        <StatPill tone="error" icon="hearts" value={gamification.hearts_current} />
        <StatPill tone="primary" icon="gems" value={gamification.gems} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surfaceBright,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceGray,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingVertical: 8,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
