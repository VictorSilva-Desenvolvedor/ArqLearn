import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { StatPill } from "@/components/ui/StatPill";
import { useAuth } from "@/contexts/AuthContext";
import { colors, type } from "@/theme/tokens";

export default function PerfilScreen() {
  const { user, gamification } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.center}>
        <Avatar name={user.name} size={72} />
        <Text style={[type.headlineMd, styles.title]}>{user.name}</Text>
        <Text style={[type.bodySm, styles.caption]}>{user.email}</Text>
        <View style={styles.stats}>
          <StatPill tone="secondary" icon="streak" value={gamification.streak_current} />
          <StatPill tone="primary" icon="gems" value={gamification.gems} />
        </View>
        <Text style={[type.bodyMd, styles.caption]}>Nível {gamification.level} · {gamification.xp_total} XP</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    color: colors.onSurface,
    marginTop: 8,
  },
  caption: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
    marginBottom: 4,
  },
});
