import type { UploadedContent } from "@/types/api";

// Espelha apps/web/src/lib/api/mocks/fixtures/uploads.ts.
export const mockUploads: UploadedContent[] = [
  {
    id: "upload-nbr15575",
    filename: "Norma_de_Desempenho_NBR15575.pdf",
    file_type: "pdf",
    status: "ready_for_review",
    size_bytes: 4_200_000,
    created_at: "2026-07-20T14:00:00Z",
  },
  {
    id: "upload-planta-baixa",
    filename: "Planta_Baixa_Residencial.jpg",
    file_type: "image",
    status: "published",
    size_bytes: 1_800_000,
    created_at: "2026-07-15T09:30:00Z",
  },
];
