import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { createBugReportMock } from "../mocks/fixtures/bugReports";
import type { BugReportStatus, BugReportType, DeviceType } from "@/types/api";

// Espelha só submitBugReport de apps/web/src/lib/api/resources/bugReports.ts —
// listBugReports/resolveBugReport são admin-only, fora de escopo do mobile (mesma decisão já
// registrada pra listUploadQuestions/reviewUploadQuestion em resources/uploads.ts).
export interface CreateBugReportPayload {
  type: BugReportType;
  description: string;
  screenshot_base64?: string | null;
  device_model?: string | null;
  device_type?: DeviceType | null;
}

export interface CreateBugReportResult {
  id: string;
  status: BugReportStatus;
  created_at: string;
}

export async function submitBugReport(payload: CreateBugReportPayload): Promise<CreateBugReportResult> {
  if (isResourceReal("bug-reports")) {
    return apiFetch<CreateBugReportResult>("/v1/bug-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  return mockDelay(createBugReportMock(payload), 400);
}
