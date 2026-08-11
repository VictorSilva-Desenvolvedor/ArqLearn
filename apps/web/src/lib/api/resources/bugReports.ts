import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  createBugReportMock,
  listBugReportsMock,
  resolveBugReportMock,
} from "../mocks/fixtures/bugReports";
import type { BugReport, BugReportStatus, BugReportType, DeviceType, ResolveBugReportResult } from "@/types/api";

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

export interface ListBugReportsResult {
  data: BugReport[];
  next_cursor: string | null;
}

export interface ListBugReportsFilters {
  status?: BugReportStatus;
  type?: BugReportType;
}

// Admin-only (API Spec §14).
export async function listBugReports(filters: ListBugReportsFilters = {}): Promise<ListBugReportsResult> {
  if (isResourceReal("bug-reports")) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    const query = params.toString();
    return apiFetch<ListBugReportsResult>(`/v1/bug-reports${query ? `?${query}` : ""}`);
  }
  return mockDelay(listBugReportsMock(filters.status, filters.type), 300);
}

export async function resolveBugReport(id: string): Promise<ResolveBugReportResult> {
  if (isResourceReal("bug-reports")) {
    return apiFetch<ResolveBugReportResult>(`/v1/bug-reports/${id}/resolve`, { method: "POST" });
  }
  return mockDelay(resolveBugReportMock(id), 400);
}
