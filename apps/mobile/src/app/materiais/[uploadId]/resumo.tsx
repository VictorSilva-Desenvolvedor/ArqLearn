import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { ArchitectTipCallout } from "@/components/features/materialSummary/ArchitectTipCallout";
import { DiagramCard } from "@/components/features/materialSummary/DiagramCard";
import { KeyPointsChecklist } from "@/components/features/materialSummary/KeyPointsChecklist";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { getUploadSummary } from "@/lib/api/resources/materials";
import { colors, spacing, type } from "@/theme/tokens";
import type { UploadSummary } from "@/types/api";

// Espelha apps/web/src/app/(lesson)/materiais/[uploadId]/resumo/page.tsx — o web é Server
// Component (busca a sinopse antes de renderizar); RN não tem SSR, então aqui existe um estado de
// carregamento explícito que o web não precisa.
export default function MaterialSummaryScreen() {
  const router = useRouter();
  const { uploadId } = useLocalSearchParams<{ uploadId: string }>();
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUploadSummary(uploadId).then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  if (!summary) {
    return <LoadingBlueprint variant="fullscreen" size={160} label="Carregando resumo…" />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <SummaryHeader title={summary.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.bodyLg, styles.synopsis]}>{summary.synopsis}</Text>
        <DiagramCard caption={`Diagrama técnico — ${summary.title}`} />
        <KeyPointsChecklist points={summary.key_points} />
        {summary.architect_tip && <ArchitectTipCallout tip={summary.architect_tip} />}
        <Button variant="primary" fullWidth onPress={() => router.push(`/materiais/${uploadId}/chat`)}>
          Tirar Dúvidas
        </Button>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  synopsis: {
    color: colors.onSurfaceVariant,
  },
});
