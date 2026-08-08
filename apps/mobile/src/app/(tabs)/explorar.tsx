import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";

export default function ExplorarScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.center}>
        <Icon name="explore" size={48} color={colors.outline} />
        <Text style={[type.headlineMd, styles.title]}>Explorar trilhas</Text>
        <Text style={[type.bodyMd, styles.caption]}>
          Busca e upload de material em construção.
        </Text>
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
