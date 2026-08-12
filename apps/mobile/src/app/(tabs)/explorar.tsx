import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { themeCatalog } from "@/lib/api/mocks/fixtures/themes";
import { colors, spacing, type } from "@/theme/tokens";

export default function ExplorarScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Icon name="explore" size={48} color={colors.outline} />
        <Text style={[type.headlineMd, styles.title]}>Explorar trilhas</Text>
        <Text style={[type.bodyMd, styles.caption]}>
          Busca e upload de material em construção.
        </Text>
      </View>
      <View style={styles.infiniteModeSection}>
        <Text style={[type.questionSm, styles.sectionTitle]}>Modo Infinito</Text>
        <Text style={[type.bodySm, styles.sectionCaption]}>
          Escolha um tema e pratique sem limites com perguntas de dificuldade elevada.
        </Text>
        <ScrollView contentContainerStyle={styles.topicList}>
          {themeCatalog.map((theme) => (
            <Pressable
              key={theme.topic}
              onPress={() => router.push(`/infinito/${theme.topic}/sessao` as never)}
            >
              <Card padding="sm" radius="md" style={styles.topicCard}>
                <Text style={[type.bodyMd, styles.topicLabel]} numberOfLines={1}>
                  {theme.label}
                </Text>
                <Icon name="chevronRight" size={20} color={colors.outline} />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    marginTop: 8,
  },
  caption: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  infiniteModeSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  sectionCaption: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  topicList: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  topicLabel: {
    flex: 1,
    color: colors.onSurface,
  },
});
