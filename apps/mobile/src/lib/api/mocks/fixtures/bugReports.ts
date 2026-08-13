import { mockUser } from "./user";
import type { BugReport, BugReportStatus } from "@/types/api";
import type { CreateBugReportPayload } from "../../resources/bugReports";

// Espelha só a metade de criação de apps/web/src/lib/api/mocks/fixtures/bugReports.ts —
// listagem/resolução de relatos são admin-only (fora de escopo do mobile), então não há estado
// semeado nem array de relatos pra listar de volta aqui.
let counter = 0;

export function createBugReportMock(
  payload: CreateBugReportPayload,
): { id: string; status: BugReportStatus; created_at: string } {
  counter += 1;
  const now = new Date().toISOString();
  const report: BugReport = {
    id: `bug-mock-${counter}`,
    user_id: mockUser.id,
    reporter_name: mockUser.name,
    reporter_email: mockUser.email,
    type: payload.type,
    description: payload.description,
    screenshot_base64: payload.screenshot_base64 ?? undefined,
    device_model: payload.device_model ?? undefined,
    device_type: payload.device_type ?? undefined,
    status: "open",
    created_at: now,
    resolved_at: null,
  };
  return { id: report.id, status: report.status, created_at: report.created_at };
}
