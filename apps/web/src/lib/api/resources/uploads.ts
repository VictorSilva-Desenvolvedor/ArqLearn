import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockUploads } from "../mocks/fixtures/uploads";
import { mockReviewQuestions, reviewQuestionMock } from "../mocks/fixtures/reviewQuestions";
import {
  completeUploadMock,
  getUploadStatusMock,
  registerUploadMock,
} from "../mocks/fixtures/uploadProcessing";
import type {
  Paginated,
  QuestionReviewAction,
  ReviewQuestion,
  ReviewQuestionEditedFields,
  UploadedContent,
  UploadFileType,
} from "@/types/api";

export interface InitiateUploadPayload {
  filename: string;
  content_type: string;
  size_bytes: number;
}

export interface InitiateUploadResponse {
  upload_id: string;
  upload_url: string;
  storage_key: string;
}

// Flag própria ("uploads-list"), separada de "uploads" (initiateUpload/completeUpload/
// getUploadStatus) — essas três ficam mockadas até o R2 ser habilitado (Docs/PENDENCIAS_IA.md #1,
// senão a UX de upload começa e nunca termina de verdade), mas a listagem em si não depende do R2
// pra nada, só lê o Postgres — pode ser real desde já (API Spec §7, v1.10).
export async function listMyUploads(): Promise<UploadedContent[]> {
  if (isResourceReal("uploads-list")) {
    const { data } = await apiFetch<Paginated<UploadedContent>>("/v1/uploads");
    return data;
  }
  return mockDelay(mockUploads);
}

// API Spec §3.4: "size_bytes... máx. 2 GB"; §Erros: UPLOAD_TOO_LARGE (413) "Arquivo excede 2 GB".
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export async function initiateUpload(payload: InitiateUploadPayload): Promise<InitiateUploadResponse> {
  if (isResourceReal("uploads")) {
    return apiFetch<InitiateUploadResponse>("/v1/uploads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  if (payload.size_bytes > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, {
      error_code: "UPLOAD_TOO_LARGE",
      message: "Arquivo excede o limite de 2 GB.",
      trace_id: "mock-trace",
    });
  }
  const uploadId = `upload-${Date.now()}`;
  registerUploadMock(uploadId, payload.filename, fileTypeFromMime(payload.content_type), payload.size_bytes);
  return mockDelay(
    {
      upload_id: uploadId,
      upload_url: "about:blank",
      storage_key: `mock/${payload.filename}`,
    },
    200,
  );
}

export interface CompleteUploadResponse {
  status: "processing";
}

export async function completeUpload(uploadId: string): Promise<CompleteUploadResponse> {
  if (isResourceReal("uploads")) {
    return apiFetch<CompleteUploadResponse>(`/v1/uploads/${uploadId}/complete`, { method: "POST" });
  }
  return mockDelay(completeUploadMock(uploadId), 150);
}

export async function getUploadStatus(uploadId: string): Promise<UploadedContent> {
  if (isResourceReal("uploads")) {
    return apiFetch<UploadedContent>(`/v1/uploads/${uploadId}`);
  }
  const status = getUploadStatusMock(uploadId);
  if (!status) {
    throw new ApiError(404, {
      error_code: "TRACK_NOT_FOUND",
      message: `Upload ${uploadId} não encontrado.`,
      trace_id: "mock-trace",
    });
  }
  return mockDelay(status, 200);
}

export async function listUploadQuestions(uploadId: string): Promise<Paginated<ReviewQuestion>> {
  if (isResourceReal("ingestion")) {
    return apiFetch<Paginated<ReviewQuestion>>(`/v1/uploads/${uploadId}/questions`);
  }
  return mockDelay({ data: mockReviewQuestions[uploadId] ?? [], next_cursor: null });
}

export async function reviewUploadQuestion(
  uploadId: string,
  questionId: string,
  action: QuestionReviewAction,
  editedFields?: ReviewQuestionEditedFields,
): Promise<ReviewQuestion> {
  if (isResourceReal("ingestion")) {
    return apiFetch<ReviewQuestion>(`/v1/uploads/${uploadId}/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, edited_fields: editedFields }),
    });
  }
  return mockDelay(reviewQuestionMock(uploadId, questionId, action, editedFields), 250);
}

export function fileTypeFromMime(contentType: string): UploadFileType {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.includes("wordprocessingml")) return "docx";
  if (contentType.includes("presentationml")) return "pptx";
  return "pdf";
}
