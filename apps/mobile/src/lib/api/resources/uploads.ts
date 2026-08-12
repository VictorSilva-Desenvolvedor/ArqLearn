import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockUploads } from "../mocks/fixtures/uploads";
import type { Paginated, UploadedContent, UploadFileType } from "@/types/api";

// Porte parcial de apps/web/src/lib/api/resources/uploads.ts — só a listagem (não depende do R2
// pra nada, só lê o Postgres, API Spec §7 v1.10) e o helper puro de tipo de arquivo. O fluxo de
// upload de verdade (initiateUpload/completeUpload/getUploadStatus, seletor de arquivo,
// polling de status) fica pra Fase 4 (Explorar real) — decisão registrada em
// Docs/PENDENCIAS_MOBILE.md, mesma lógica que já deixou ThemeContext/AllDonePrompt pra lá na
// Fase 2. listUploadQuestions/reviewUploadQuestion (revisão de professor) também não entram —
// fora de escopo do app mobile.
export async function listMyUploads(): Promise<UploadedContent[]> {
  if (isResourceReal("uploads-list")) {
    const { data } = await apiFetch<Paginated<UploadedContent>>("/v1/uploads");
    return data;
  }
  return mockDelay(mockUploads);
}

export function fileTypeFromMime(contentType: string): UploadFileType {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.includes("wordprocessingml")) return "docx";
  if (contentType.includes("presentationml")) return "pptx";
  return "pdf";
}
