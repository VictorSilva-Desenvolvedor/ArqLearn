import type { UploadedContent, UploadFileType } from "@/types/api";

// Simula o pipeline assíncrono de ingestão (Ingestion Service, ainda 501 no backend real) do
// lado do cliente: POST .../complete marca "processing" e dá a largada num cronômetro; GET
// .../{id} deriva status/progress_percent a partir do tempo decorrido, igual a um polling real
// contra um worker faria.
const PROCESSING_DURATION_MS = 6000;

interface MockUploadRecord {
  content: UploadedContent;
  processingStartedAt: number | null;
}

const records = new Map<string, MockUploadRecord>();

export function registerUploadMock(
  uploadId: string,
  filename: string,
  fileType: UploadFileType,
  sizeBytes: number,
): void {
  records.set(uploadId, {
    content: {
      id: uploadId,
      filename,
      file_type: fileType,
      status: "received",
      size_bytes: sizeBytes,
      created_at: new Date().toISOString(),
    },
    processingStartedAt: null,
  });
}

export function completeUploadMock(uploadId: string): { status: "processing" } {
  const record = records.get(uploadId);
  if (record) {
    record.processingStartedAt = Date.now();
    record.content.status = "processing";
  }
  return { status: "processing" };
}

export function getUploadStatusMock(uploadId: string): UploadedContent | null {
  const record = records.get(uploadId);
  if (!record) return null;

  if (!record.processingStartedAt) {
    return { ...record.content, progress_percent: 0 };
  }

  const elapsed = Date.now() - record.processingStartedAt;
  if (elapsed >= PROCESSING_DURATION_MS) {
    record.content.status = "ready_for_review";
    return { ...record.content, progress_percent: 100 };
  }

  const progress = Math.round((elapsed / PROCESSING_DURATION_MS) * 100);
  return { ...record.content, status: "processing", progress_percent: progress };
}
