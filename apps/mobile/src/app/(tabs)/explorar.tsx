import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { listMyUploads } from "@/lib/api/resources/uploads";
import { themeCatalog } from "@/lib/api/mocks/fixtures/themes";
import { formatBytes } from "@/lib/utils/format";
import { colors, spacing, type } from "@/theme/tokens";
import type { UploadedContent, UploadFileType, UploadStatus } from "@/types/api";

const fileTypeIcon: Record<UploadFileType, IconName> = {
  pdf: "filePdf",
  docx: "fileDoc",
  pptx: "filePpt",
  image: "fileImage",
  video: "fileVideo",
};

const statusPresentation: Record<UploadStatus, { label: string; tone: BadgeTone }> = {
  received: { label: "Recebido", tone: "neutral" },
  processing: { label: "Processando", tone: "secondary" },
  ready_for_review: { label: "Pronto para revisão", tone: "primary" },
  published: { label: "Publicado", tone: "tertiary" },
  failed: { label: "Falhou", tone: "error" },
};

// Resumo Inteligente só existe pra upload já processado — nas demais fases o item ainda não tem
// conteúdo gerado pra abrir.
const SUMMARIZABLE_STATUSES: UploadStatus[] = ["ready_for_review", "published"];

export default function ExplorarScreen() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadedContent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyUploads().then((result) => {
      if (!cancelled) setUploads(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="explore" size={48} color={colors.outline} />
          <Text style={[type.headlineMd, styles.title]}>Explorar trilhas</Text>
          <Text style={[type.bodyMd, styles.caption]}>
            Busca e upload de material em construção.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[type.questionSm, styles.sectionTitle]}>Modo Infinito</Text>
          <Text style={[type.bodySm, styles.sectionCaption]}>
            Escolha um tema e pratique sem limites com perguntas de dificuldade elevada.
          </Text>
          <View style={styles.list}>
            {themeCatalog.map((theme) => (
              <Pressable
                key={theme.topic}
                onPress={() => router.push(`/infinito/${theme.topic}/sessao` as never)}
              >
                <Card padding="sm" radius="md" style={styles.rowCard}>
                  <Text style={[type.bodyMd, styles.rowLabel]} numberOfLines={1}>
                    {theme.label}
                  </Text>
                  <Icon name="chevronRight" size={20} color={colors.outline} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.questionSm, styles.sectionTitle]}>Meus Materiais</Text>
          <Text style={[type.bodySm, styles.sectionCaption]}>
            Resumo inteligente e chat sobre os materiais que você já enviou.
          </Text>
          <View style={styles.list}>
            {uploads?.map((item) => {
              const canOpen = SUMMARIZABLE_STATUSES.includes(item.status);
              const status = statusPresentation[item.status];
              const card = (
                <Card padding="sm" radius="md" style={styles.rowCard}>
                  <Icon name={fileTypeIcon[item.file_type]} size={24} color={colors.onSurfaceVariant} />
                  <View style={styles.uploadInfo}>
                    <Text style={[type.bodyMd, styles.rowLabel]} numberOfLines={1}>
                      {item.filename}
                    </Text>
                    <Text style={[type.bodySm, styles.uploadSize]}>{formatBytes(item.size_bytes)}</Text>
                  </View>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {canOpen && <Icon name="chevronRight" size={20} color={colors.outline} />}
                </Card>
              );
              return canOpen ? (
                <Pressable key={item.id} onPress={() => router.push(`/materiais/${item.id}/resumo` as never)}>
                  {card}
                </Pressable>
              ) : (
                <View key={item.id}>{card}</View>
              );
            })}
          </View>
        </View>
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
    paddingBottom: spacing.lg,
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
  section: {
    paddingHorizontal: spacing.md,
    gap: 4,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  sectionCaption: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    color: colors.onSurface,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadSize: {
    color: colors.onSurfaceVariant,
  },
});
