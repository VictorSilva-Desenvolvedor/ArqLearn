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

// Anexa o Authorization header a partir da sessão mockada. Quando a auth real (Supabase)
// entrar, este é o único lugar a trocar por um token de sessão de verdade.
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
