// Controla, por recurso, se o client chama a API real ou usa mock. Mesmo padrão de
// apps/web/src/lib/api/config.ts — só troca o prefixo de env var (Expo usa EXPO_PUBLIC_, não
// NEXT_PUBLIC_).

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

const REAL_RESOURCES = new Set(
  (process.env.EXPO_PUBLIC_API_REAL_RESOURCES ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean),
);

export function isResourceReal(resource: string): boolean {
  return REAL_RESOURCES.has(resource);
}
