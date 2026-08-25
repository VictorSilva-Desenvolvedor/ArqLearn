import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ArchitectTipCallout } from "@/components/features/materialSummary/ArchitectTipCallout";
import { DiagramCard } from "@/components/features/materialSummary/DiagramCard";
import { KeyPointsChecklist } from "@/components/features/materialSummary/KeyPointsChecklist";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { getUploadSummary } from "@/lib/api/resources/materials";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { UploadSummary } from "@/types/api";

// Espelha apps/web/src/app/(lesson)/materiais/[uploadId]/resumo/page.tsx — o web é Server
// Component (busca a sinopse antes de renderizar); RN não tem SSR, então aqui existe um estado de
// carregamento explícito que o web não precisa.
export default function MaterialSummaryScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
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
        {/* Superfície opaca pela mesma razão do KeyPointsChecklist (auditoria de 25/08/2026,
            rodada 4): a sinopse é texto corrido de leitura sobre o fundo blueprint. */}
        <Card padding="md" radius="lg" bordered={false}>
          <Text style={[type.bodyLg, styles.synopsis]}>{summary.synopsis}</Text>
        </Card>
        <DiagramCard caption={`Diagrama técnico — ${summary.title}`} />
        <KeyPointsChecklist points={summary.key_points} />
        {summary.architect_tip && <ArchitectTipCallout tip={summary.architect_tip} />}
        <View style={styles.ctaBlock}>
          <Button
            variant="primary"
            fullWidth
            icon={<Icon name="forum" size={20} color={colors.onPrimary} />}
            onPress={() => router.push(`/materiais/${uploadId}/chat`)}
          >
            Tirar Dúvidas
          </Button>
          <Text style={[type.labelCaps, styles.ctaCaption]}>
            Converse com o assistente sobre este documento
          </Text>
        </View>
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    synopsis: {
      color: colors.onSurfaceVariant,
    },
    ctaBlock: {
      gap: spacing.xs,
    },
    ctaCaption: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
