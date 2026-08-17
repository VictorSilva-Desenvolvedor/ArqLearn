import { isResourceReal } from "../config";
import { apiFetch, ApiError } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockUploadSummaries } from "../mocks/fixtures/uploadSummaries";
import { mockChatAnswerFor, mockChatHistory } from "../mocks/fixtures/chatMessages";
import type { ChatAnswer, ChatMessage, Paginated, UploadSummary } from "@/types/api";

// Espelha apps/web/src/lib/api/resources/materials.ts — sem o parâmetro opcional accessToken de
// getUploadSummary do web (existe lá só pra Server Component; RN não tem SSR, sempre usa o
// provider global de token de lib/api/http.ts, mesmo padrão de todo resource file do mobile).
export async function getUploadSummary(uploadId: string): Promise<UploadSummary> {
  if (isResourceReal("materials")) {
    return apiFetch<UploadSummary>(`/v1/uploads/${uploadId}/summary`);
  }
  const summary = mockUploadSummaries[uploadId];
  if (!summary) {
    throw new ApiError(404, {
      error_code: "UPLOAD_NOT_FOUND",
      message: `Upload ${uploadId} não encontrado.`,
      trace_id: "mock-trace",
    });
  }
  return mockDelay(summary);
}

export async function listChatHistory(uploadId: string): Promise<Paginated<ChatMessage>> {
  if (isResourceReal("materials")) {
    return apiFetch<Paginated<ChatMessage>>(`/v1/uploads/${uploadId}/chat`);
  }
  return mockDelay({ data: mockChatHistory[uploadId] ?? [], next_cursor: null });
}

let chatMessageCounter = 0;

export async function sendChatMessage(uploadId: string, message: string): Promise<ChatAnswer> {
  if (isResourceReal("materials")) {
    return apiFetch<ChatAnswer>(`/v1/uploads/${uploadId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }
  chatMessageCounter += 1;
  const { answer, source_excerpt, source_ref } = mockChatAnswerFor(message);
  return mockDelay(
    {
      message_id: `mock-chat-${chatMessageCounter}`,
      answer,
      source_excerpt,
      source_ref,
      created_at: new Date().toISOString(),
    },
    500,
  );
}
