import * as DocumentPicker from "expo-document-picker";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, type } from "@/theme/tokens";
import type { DocumentPickerAsset } from "expo-document-picker";

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/*",
  "video/*",
];

interface UploadPromptCardProps {
  onFileSelected: (file: DocumentPickerAsset) => void;
}

// Espelha apps/web/src/components/features/explore/UploadPromptCard.tsx — o RN não tem um <input
// type="file"> equivalente, então o seletor é o picker nativo do sistema
// (expo-document-picker, mesmo pacote citado como pendência em Docs/PENDENCIAS_MOBILE.md #5).
export function UploadPromptCard({ onFileSelected }: UploadPromptCardProps) {
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MIME_TYPES,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset) onFileSelected(asset);
  };

  return (
    <Card radius="xl" style={styles.card}>
      <View style={styles.info}>
        <Icon name="uploadFile" size={32} color={colors.primary} />
        <View style={styles.textBlock}>
          <Text style={[type.questionSm, styles.title]}>Upload de Material</Text>
          <Text style={[type.bodySm, styles.caption]}>
            Envie PDFs, apresentações, imagens ou vídeos e gere exercícios automaticamente.
          </Text>
          <Text style={[type.bodySm, styles.limit]}>Tamanho máximo: 2 GB</Text>
        </View>
      </View>
      <Button variant="primary" onPress={pickFile}>
        Novo Upload
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  caption: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  limit: {
    color: colors.outline,
    marginTop: 4,
  },
});
