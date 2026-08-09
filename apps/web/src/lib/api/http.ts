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

// accessToken explícito é pra Server Components (Home/Liga/Perfil, ver
// lib/supabase/server.ts#getServerAccessToken) — o provider acima é um estado global de módulo,
// seguro só no browser (uma aba = uma sessão). No servidor, múltiplas requisições de usuários
// diferentes compartilhariam esse mesmo módulo, então cada Server Component busca o token da
// própria requisição (via cookies()) e passa aqui explicitamente em vez de depender do provider.
export async function apiFetch<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const token = accessToken ?? getAccessToken();
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
