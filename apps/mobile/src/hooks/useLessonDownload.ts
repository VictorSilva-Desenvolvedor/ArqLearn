import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ensureHydrated, isLessonDownloaded, toggleLessonDownload } from "@/lib/offline/downloadedLessons";

// AsyncStorage é estado externo mutável — useSyncExternalStore evita setState-dentro-de-effect
// pra sincronizar isso. Espelha apps/web/src/hooks/useLessonDownload.ts; sem a preocupação de
// hidratação SSR do web (não existe aqui), mas com uma preocupação equivalente: o cache em
// memória de lib/offline/downloadedLessons.ts só é confiável depois de hidratar do
// AsyncStorage uma vez (assíncrono) — ensureHydrated dispara isso e notifica os listeners.
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAll(): void {
  for (const listener of listeners) listener();
}

export function useLessonDownload(lessonId: string) {
  useEffect(() => {
    ensureHydrated(notifyAll);
  }, []);

  // Sem terceiro argumento (getServerSnapshot) — não existe SSR/hidratação no RN, então não há
  // mismatch a evitar; o snapshot do cliente já é a única fonte.
  const downloaded = useSyncExternalStore(subscribe, () => isLessonDownloaded(lessonId));

  const toggle = useCallback(() => {
    toggleLessonDownload(lessonId);
    notifyAll();
  }, [lessonId]);

  return { downloaded, toggle };
}
