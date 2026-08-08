import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockUploads } from "../mocks/fixtures/uploads";
import { mockReviewQuestions, reviewQuestionMock } from "../mocks/fixtures/reviewQuestions";
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

// GET /v1/uploads (listagem) não existe no contrato — só GET /v1/uploads/{id}. Fica mock puro
// até o backend expor um endpoint de listagem para "Meus Materiais".
export async function listMyUploads(): Promise<UploadedContent[]> {
  return mockDelay(mockUploads);
}

export async function initiateUpload(payload: InitiateUploadPayload): Promise<InitiateUploadResponse> {
  if (isResourceReal("uploads")) {
    return apiFetch<InitiateUploadResponse>("/v1/uploads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  return mockDelay(
    {
      upload_id: `upload-${Date.now()}`,
      upload_url: "about:blank",
      storage_key: `mock/${payload.filename}`,
    },
    200,
  );
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
