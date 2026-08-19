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
// Espelha apps/mobile/src/lib/api/http.ts (achado ao vivo: request preso numa troca de rede no
// device de teste, sem timeout `fetch()` nunca resolve nem rejeita). 20s é generoso o bastante
// pro "explique melhor" (chamada ao Groq).
const REQUEST_TIMEOUT_MS = 20_000;

export async function apiFetch<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const token = accessToken ?? getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, {
        error_code: "REQUEST_TIMEOUT",
        message: "A conexão demorou demais. Verifique sua internet e tente de novo.",
        trace_id: "client-timeout",
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
