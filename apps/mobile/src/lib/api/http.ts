import { API_BASE_URL } from "./config";
import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  error_code: string;
  trace_id: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.error_code = body.error_code;
    this.trace_id = body.trace_id;
    this.details = body.details;
  }
}

// Anexa o Authorization header a partir da sessão ativa. AuthContext chama
// setAccessTokenProvider sempre que a sessão Supabase muda, então apiFetch nunca precisa de
// prop-drilling do token. Mesmo padrão de apps/web/src/lib/api/http.ts — mobile não tem Server
// Components/SSR, então (diferente do web) não existe parâmetro de accessToken explícito aqui:
// uma única sessão por app, sempre lida deste provider global.
let getAccessToken: () => string | null = () => null;

export function setAccessTokenProvider(provider: () => string | null): void {
  getAccessToken = provider;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
