// Spec §9 (Responsive behavior > Mobile): "Show offline/downloaded lesson state when applicable."
// Isto é só a preferência do usuário (quer ter esta lição disponível offline) — não existe cache
// real de conteúdo (Service Worker, IndexedDB de perguntas) ainda, só o estado de intenção
// persistido localmente. Diferente de XP/streak/gamificação, "baixado" é puramente um dado do
// dispositivo, então não há problema nenhum em guardar isso 100% no cliente.
const STORAGE_KEY = "arqlearn_downloaded_lessons";

function readAll(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeAll(ids: Set<string>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export function isLessonDownloaded(lessonId: string): boolean {
  return readAll().has(lessonId);
}

export function toggleLessonDownload(lessonId: string): boolean {
  const ids = readAll();
  const next = !ids.has(lessonId);
  if (next) {
    ids.add(lessonId);
  } else {
    ids.delete(lessonId);
  }
  writeAll(ids);
  return next;
}
