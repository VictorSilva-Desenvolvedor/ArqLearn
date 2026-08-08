"use client";

import { useEffect, useMemo, useState } from "react";
import { listMyUploads, initiateUpload, fileTypeFromMime } from "@/lib/api/resources/uploads";
import { mockRecommendedTracks } from "@/lib/api/mocks/fixtures/exploreTracks";
import { SearchBar } from "@/components/features/explore/SearchBar";
import { UploadPromptCard } from "@/components/features/explore/UploadPromptCard";
import { InfiniteModePromptCard } from "@/components/features/explore/InfiniteModePromptCard";
import { TrackCard } from "@/components/features/explore/TrackCard";
import { UploadedContentItem } from "@/components/features/explore/UploadedContentItem";
import type { UploadedContent } from "@/types/api";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadedContent[]>([]);

  useEffect(() => {
    listMyUploads().then(setUploads);
  }, []);

  const filteredTracks = useMemo(
    () =>
      mockRecommendedTracks.filter((item) =>
        item.track.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const filteredUploads = useMemo(
    () => uploads.filter((item) => item.filename.toLowerCase().includes(query.toLowerCase())),
    [uploads, query],
  );

  const handleFileSelected = async (file: File) => {
    const { upload_id } = await initiateUpload({
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
    });

    const pendingItem: UploadedContent = {
      id: upload_id,
      filename: file.name,
      file_type: fileTypeFromMime(file.type),
      status: "processing",
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    };
    setUploads((current) => [pendingItem, ...current]);

    // Simula o pipeline assíncrono de ingestão (Ingestion Service, ainda 501 no backend real).
    setTimeout(() => {
      setUploads((current) =>
        current.map((item) =>
          item.id === upload_id ? { ...item, status: "ready_for_review" } : item,
        ),
      );
    }, 2500);
  };

  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-section">
      <SearchBar value={query} onChange={setQuery} />
      <UploadPromptCard onFileSelected={handleFileSelected} />
      <InfiniteModePromptCard />

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Trilhas Recomendadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {filteredTracks.map((item) => (
            <TrackCard key={item.track.id} {...item} />
          ))}
        </div>
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
