import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { BugReportForm } from "@/components/features/help/BugReportForm";
import { HelpFaqSection } from "@/components/features/help/HelpFaqSection";
import { colors, spacing, type } from "@/theme/tokens";

// Espelha apps/web/src/app/(shell)/ajuda/page.tsx.
export default function AjudaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <View style={styles.headerText}>
            <Text style={[type.displayLg, styles.title]}>Ajuda e Bugs</Text>
            <Text style={[type.bodySm, styles.caption]}>
              Explicações rápidas sobre como o ArqLearn funciona, e um jeito fácil de nos avisar
              quando algo dá errado.
            </Text>
          </View>
        </View>
        <HelpFaqSection />
        <BugReportForm />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  caption: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
