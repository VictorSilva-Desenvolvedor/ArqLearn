// Controla, por recurso, se o client chama a API real ou usa mock.
// Vazio por padrão: toda a fase de auth mockada não produz um JWT real, então mesmo os
// recursos já implementados no backend (users, tracks, lessons) ficam mockados aqui.
// Trocar depois é só popular NEXT_PUBLIC_API_REAL_RESOURCES, sem tocar em componentes.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const REAL_RESOURCES = new Set(
  (process.env.NEXT_PUBLIC_API_REAL_RESOURCES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isResourceReal(resource: string): boolean {
  return REAL_RESOURCES.has(resource);
}
