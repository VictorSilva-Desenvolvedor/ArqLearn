import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InfiniteModePromptCard } from "@/components/features/explore/InfiniteModePromptCard";
import { SearchBar } from "@/components/features/explore/SearchBar";
import { TrackCard } from "@/components/features/explore/TrackCard";
import { UploadedContentItem } from "@/components/features/explore/UploadedContentItem";
import { UploadPromptCard } from "@/components/features/explore/UploadPromptCard";
import { useTheme } from "@/hooks/useTheme";
import { ApiError } from "@/lib/api/http";
import { mockRecommendedTracks } from "@/lib/api/mocks/fixtures/exploreTracks";
import {
  completeUpload,
  fileTypeFromMime,
  getUploadStatus,
  initiateUpload,
  listMyUploads,
} from "@/lib/api/resources/uploads";
import { colors, spacing, type } from "@/theme/tokens";
import type { DocumentPickerAsset } from "expo-document-picker";
import type { UploadedContent, UploadStatus } from "@/types/api";

const TERMINAL_STATUSES: UploadStatus[] = ["ready_for_review", "published", "failed"];
const POLL_INTERVAL_MS = 700;

// Espelha apps/web/src/app/(shell)/explorar/page.tsx.
export default function ExplorarScreen() {
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadedContent[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { theme } = useTheme();
  const activePolls = useRef(new Set<string>());

  useEffect(() => {
    listMyUploads().then(setUploads);
    const polls = activePolls.current;
    return () => polls.clear();
  }, []);

  const filteredTracks = useMemo(() => {
    const matches = mockRecommendedTracks.filter((item) =>
      item.track.title.toLowerCase().includes(query.toLowerCase()),
    );
    // Tema selecionado (ThemeSelector no TopAppBar) vem primeiro e ganha o badge "Selecionado".
    return [...matches].sort((a, b) => {
      if (a.track.topic === theme.topic) return -1;
      if (b.track.topic === theme.topic) return 1;
      return 0;
    });
  }, [query, theme.topic]);

  const filteredUploads = useMemo(
    () => uploads.filter((item) => item.filename.toLowerCase().includes(query.toLowerCase())),
    [uploads, query],
  );

  const pollStatus = (uploadId: string) => {
    if (activePolls.current.has(uploadId)) return;
    activePolls.current.add(uploadId);

    const tick = async () => {
      if (!activePolls.current.has(uploadId)) return;
      const status = await getUploadStatus(uploadId);
      setUploads((current) => current.map((item) => (item.id === uploadId ? status : item)));

      if (TERMINAL_STATUSES.includes(status.status)) {
        activePolls.current.delete(uploadId);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    void tick();
  };

  const handleFileSelected = async (file: DocumentPickerAsset) => {
    setUploadError(null);
    const contentType = file.mimeType ?? "application/octet-stream";
    const sizeBytes = file.size ?? 0;
    let upload_id: string;
    try {
      ({ upload_id } = await initiateUpload({
        filename: file.name,
        content_type: contentType,
        size_bytes: sizeBytes,
      }));
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Não foi possível iniciar o upload.");
      return;
    }

    const pendingItem: UploadedContent = {
      id: upload_id,
      filename: file.name,
      file_type: fileTypeFromMime(contentType),
      status: "received",
      size_bytes: sizeBytes,
      progress_percent: 0,
      created_at: new Date().toISOString(),
    };
    setUploads((current) => [pendingItem, ...current]);

    await completeUpload(upload_id);
    pollStatus(upload_id);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SearchBar value={query} onChange={setQuery} />

        <View style={styles.uploadBlock}>
          <UploadPromptCard onFileSelected={handleFileSelected} />
          {uploadError && <Text style={[type.bodySm, styles.uploadError]}>{uploadError}</Text>}
        </View>

        <InfiniteModePromptCard topic={theme.topic} themeLabel={theme.label} />

        <View style={styles.section}>
          <Text style={[type.headlineMd, styles.sectionTitle]}>Trilhas Recomendadas</Text>
          <View style={styles.trackGrid}>
            {filteredTracks.map((item) => (
              <View key={item.track.id} style={styles.trackCell}>
                <TrackCard {...item} isSelectedTheme={item.track.topic === theme.topic} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.headlineMd, styles.sectionTitle]}>Meus Materiais</Text>
          <View style={styles.list}>
            {filteredUploads.map((item) => (
              <UploadedContentItem key={item.id} item={item} />
            ))}
            {filteredUploads.length === 0 && (
              <Text style={[type.bodySm, styles.empty]}>Nenhum material encontrado.</Text>
            )}
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
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  uploadBlock: {
    gap: spacing.xs,
  },
  uploadError: {
    color: colors.error,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.onSurface,
  },
  trackGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs / 2,
  },
  trackCell: {
    width: "50%",
    paddingHorizontal: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.xs,
  },
  empty: {
    color: colors.onSurfaceVariant,
  },
});
