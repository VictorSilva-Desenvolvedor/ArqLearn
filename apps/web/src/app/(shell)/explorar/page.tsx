"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listMyUploads,
  initiateUpload,
  completeUpload,
  getUploadStatus,
  fileTypeFromMime,
} from "@/lib/api/resources/uploads";
import { ApiError } from "@/lib/api/http";
import { mockRecommendedTracks } from "@/lib/api/mocks/fixtures/exploreTracks";
import { getReviewSummary } from "@/lib/api/resources/review";
import { SearchBar } from "@/components/features/explore/SearchBar";
import { UploadPromptCard } from "@/components/features/explore/UploadPromptCard";
import { InfiniteModePromptCard } from "@/components/features/explore/InfiniteModePromptCard";
import { ReviewPromptCard } from "@/components/features/explore/ReviewPromptCard";
import { TrackCard } from "@/components/features/explore/TrackCard";
import { UploadedContentItem } from "@/components/features/explore/UploadedContentItem";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import type { UploadedContent, UploadStatus } from "@/types/api";

const TERMINAL_STATUSES: UploadStatus[] = ["ready_for_review", "published", "failed"];
const POLL_INTERVAL_MS = 700;

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadedContent[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const { theme, setTopic } = useTheme();
  const { showToast } = useToast();
  const activePolls = useRef(new Set<string>());

  useEffect(() => {
    listMyUploads().then(setUploads);
    const polls = activePolls.current;
    return () => polls.clear();
  }, []);

  useEffect(() => {
    getReviewSummary().then((summary) => setReviewDueCount(summary.due_count));
  }, []);

  const filteredTracks = useMemo(() => {
    // Só trilhas disponíveis (hasContent) — "Trilhas Recomendadas" é pra estudar agora, não uma
    // vitrine do que ainda está em construção (essa lista fica no ThemeSelector do TopAppBar).
    const matches = mockRecommendedTracks.filter(
      (item) =>
        item.hasContent && item.track.title.toLowerCase().includes(query.toLowerCase()),
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
    tick();
  };

  const handleFileSelected = async (file: File) => {
    setUploadError(null);
    let upload_id: string;
    try {
      ({ upload_id } = await initiateUpload({
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
      }));
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Não foi possível iniciar o upload.");
      return;
    }

    const pendingItem: UploadedContent = {
      id: upload_id,
      filename: file.name,
      file_type: fileTypeFromMime(file.type),
      status: "received",
      size_bytes: file.size,
      progress_percent: 0,
      created_at: new Date().toISOString(),
    };
    setUploads((current) => [pendingItem, ...current]);

    await completeUpload(upload_id);
    pollStatus(upload_id);
  };

  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-section">
      <SearchBar value={query} onChange={setQuery} />
      <div className="flex flex-col gap-sm">
        <UploadPromptCard onFileSelected={handleFileSelected} />
        {uploadError && (
          <p className="font-body-sm text-body-sm text-error bg-error-container rounded-md px-md py-sm">
            {uploadError}
          </p>
        )}
      </div>
      <InfiniteModePromptCard topic={theme.topic} themeLabel={theme.label} hasContent={theme.hasContent} />
      <ReviewPromptCard dueCount={reviewDueCount} />

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Trilhas Recomendadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {filteredTracks.map((item) => (
            <TrackCard
              key={item.track.id}
              {...item}
              isSelectedTheme={item.track.topic === theme.topic}
              onSelect={() => {
                // Entra de fato na trilha (Home passa a mostrar o mapa dela) — antes isso só
                // selecionava o tema e deixava o aluno na mesma tela de Explorar, reproduzindo o
                // ThemeSelector do TopAppBar sem levar a lugar nenhum.
                setTopic(item.track.topic);
                showToast(`Tema "${item.track.title}" selecionado`, "success");
                router.push("/");
              }}
            />
          ))}
        </div>
        {/* "Meus Materiais" já dizia "Nenhum material encontrado" quando a busca não casava, mas
            esta seção sumia sem explicação nenhuma — um título seguido de nada (auditoria de
            25/08/2026). */}
        {filteredTracks.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Nenhuma trilha corresponde a “{query}”.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Meus Materiais</h2>
        <div className="flex flex-col gap-sm">
          {filteredUploads.map((item) => (
            <UploadedContentItem key={item.id} item={item} />
          ))}
          {filteredUploads.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Nenhum material encontrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
