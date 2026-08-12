import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { colors, type } from "@/theme/tokens";

export default function LigaScreen() {
  const { gamification } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.center}>
        <Icon name="league" size={48} color={colors.outline} />
        <Text style={[type.headlineMd, styles.title]}>Liga Semanal</Text>
        {gamification.league_tier && <Badge tone="secondary">{gamification.league_tier}</Badge>}
        <Text style={[type.bodyMd, styles.caption]}>Ranking e promoção/rebaixamento em construção.</Text>
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
});
