import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "@/lib/utils/format";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { UploadedContent, UploadFileType, UploadStatus } from "@/types/api";

const fileTypeIcon: Record<UploadFileType, IconName> = {
  pdf: "filePdf",
  docx: "fileDoc",
  pptx: "filePpt",
  image: "fileImage",
  video: "fileVideo",
};

const statusLabel: Record<UploadStatus, { label: string; tone: BadgeTone }> = {
  received: { label: "Recebido", tone: "neutral" },
  processing: { label: "Processando", tone: "secondary" },
  ready_for_review: { label: "Pronto para revisão", tone: "primary" },
  published: { label: "Publicado", tone: "tertiary" },
  failed: { label: "Falhou", tone: "error" },
};

// Spec (Upload Material): 4 estágios NOMEADOS — Recebido / Extraindo conteúdo / Gerando
// perguntas / Pronto para revisão — não um "Processando" genérico do início ao fim.
function processingStageLabel(progressPercent: number): string {
  return progressPercent < 50 ? "Extraindo conteúdo" : "Gerando perguntas";
}

// Resumo Inteligente só existe para uploads já processados (ready_for_review/published).
const SUMMARIZABLE_STATUSES: UploadStatus[] = ["ready_for_review", "published"];

// Espelha apps/web/src/components/features/explore/UploadedContentItem.tsx.
export function UploadedContentItem({ item }: { item: UploadedContent }) {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const canOpenSummary = SUMMARIZABLE_STATUSES.includes(item.status);
  const showProgress = item.status === "processing" && typeof item.progress_percent === "number";
  const status =
    item.status === "processing" && showProgress
      ? { label: processingStageLabel(item.progress_percent ?? 0), tone: statusLabel.processing.tone }
      : statusLabel[item.status];

  const content = (
    <Card padding="sm" radius="md" style={styles.card}>
      <View style={styles.row}>
        <Icon name={fileTypeIcon[item.file_type]} size={24} color={colors.onSurfaceVariant} />
        {/* O nome do arquivo é o que identifica a linha, mas dividia a largura com um badge de
            texto longo ("Pronto para revisão") e sobrava quase nada pra ele numa largura de
            telefone. Badge desce pra segunda linha, junto do tamanho. Mesma correção no web
            (auditoria de 25/08/2026). */}
        <View style={styles.info}>
          <Text style={[type.bodyMd, styles.filename]} numberOfLines={1}>
            {item.filename}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[type.bodySm, styles.size]}>{formatBytes(item.size_bytes)}</Text>
            <Badge tone={status.tone}>{status.label}</Badge>
          </View>
        </View>
        {canOpenSummary && <Icon name="chevronRight" size={20} color={colors.onSurfaceVariant} />}
      </View>
      {showProgress && (
        <View style={styles.progressRow}>
          <ProgressBar value={item.progress_percent ?? 0} max={100} variant="thin" tone="secondary" style={styles.progressBar} />
          <Text style={[type.labelCaps, styles.progressValue]}>{item.progress_percent}%</Text>
        </View>
      )}
    </Card>
  );

  if (!canOpenSummary) return content;

  return (
    <Pressable
      onPress={() => router.push(`/materiais/${item.id}/resumo` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${item.filename}, ${status.label}`}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      gap: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    info: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    filename: {
      color: colors.onSurface,
    },
    size: {
      color: colors.onSurfaceVariant,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingLeft: 32,
    },
    progressBar: {
      flex: 1,
    },
    progressValue: {
      color: colors.onSurfaceVariant,
      width: 40,
      textAlign: "right",
    },
  });
