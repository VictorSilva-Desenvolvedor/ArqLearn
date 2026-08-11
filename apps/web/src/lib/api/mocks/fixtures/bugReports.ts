import { ApiError } from "../../http";
import { mockUser } from "./user";
import type { BugReport, BugReportStatus, BugReportType, ResolveBugReportResult } from "@/types/api";
import type { CreateBugReportPayload } from "../../resources/bugReports";

// Recompensa depende do tipo (API Spec §14, v1.15) — mesma constante do backend
// (services/monolith/internal/bugreports), duplicada aqui só como stand-in de mock.
const BUG_FIXED_GEMS_REWARD = 10;
const SUGGESTION_IMPLEMENTED_GEMS_REWARD = 50;

// Estado em memória do lado do cliente — mesmo padrão de infiniteModeSessions.ts. Semeado com 3
// relatos de exemplo (bug aberto, bug corrigido, sugestão aberta) pra a tela de admin não nascer
// vazia em mock.
const reports: BugReport[] = [
  {
    id: "bug-seed-1",
    user_id: mockUser.id,
    reporter_name: mockUser.name,
    reporter_email: mockUser.email,
    type: "bug",
    description: "O botão \"Continuar\" do Modo Infinito às vezes fica sem resposta depois de errar uma pergunta de múltipla escolha.",
    device_model: "iPhone 13",
    device_type: "mobile",
    status: "open",
    created_at: "2026-08-08T14:32:00Z",
    resolved_at: null,
  },
  {
    id: "bug-seed-2",
    user_id: mockUser.id,
    reporter_name: mockUser.name,
    reporter_email: mockUser.email,
    type: "bug",
    description: "A barra de XP do dia não zerava depois da meia-noite — continuava mostrando o valor do dia anterior até eu recarregar a página.",
    device_model: "Dell XPS 13, Chrome",
    device_type: "desktop",
    status: "fixed",
    created_at: "2026-08-05T09:10:00Z",
    resolved_at: "2026-08-06T11:00:00Z",
  },
  {
    id: "bug-seed-3",
    user_id: mockUser.id,
    reporter_name: mockUser.name,
    reporter_email: mockUser.email,
    type: "suggestion",
    description: "Seria ótimo ter um modo escuro de verdade — hoje só existe o tema claro, e à noite o brilho incomoda.",
    status: "open",
    created_at: "2026-08-07T20:15:00Z",
    resolved_at: null,
  },
];
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
  reports.unshift(report);
  return { id: report.id, status: report.status, created_at: report.created_at };
}

export function listBugReportsMock(
  status?: BugReportStatus,
  type?: BugReportType,
): { data: BugReport[]; next_cursor: null } {
  const data = reports.filter((r) => (status ? r.status === status : true) && (type ? r.type === type : true));
  return { data: [...data], next_cursor: null };
}

export function resolveBugReportMock(id: string): ResolveBugReportResult {
  const report = reports.find((r) => r.id === id);
  if (!report) {
    throw new ApiError(404, {
      error_code: "BUG_REPORT_NOT_FOUND",
      message: `Relato de bug ${id} não encontrado.`,
      trace_id: "mock-trace",
    });
  }
  if (report.status === "fixed") {
    throw new ApiError(409, {
      error_code: "BUG_REPORT_ALREADY_RESOLVED",
      message: "Este relato já foi marcado como corrigido.",
      trace_id: "mock-trace",
    });
  }
  report.status = "fixed";
  report.resolved_at = new Date().toISOString();
  const gemsAwarded = report.type === "suggestion" ? SUGGESTION_IMPLEMENTED_GEMS_REWARD : BUG_FIXED_GEMS_REWARD;
  return {
    id: report.id,
    status: report.status,
    gems_awarded: gemsAwarded,
    // Mock não tem acesso ao estado de gems de outra sessão/conta — devolve só o prêmio; quem
    // chama (tela de admin) não depende de reporter_gems_total pra nada visualmente crítico.
    reporter_gems_total: gemsAwarded,
  };
}
