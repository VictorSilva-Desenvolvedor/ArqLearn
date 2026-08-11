"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isLessonDownloaded, toggleLessonDownload } from "@/lib/offline/downloadedLessons";

// localStorage é estado externo mutável — useSyncExternalStore evita tanto o mismatch de
// hidratação (getServerSnapshot sempre "não baixado", igual ao servidor) quanto o
// setState-dentro-de-effect que useState+useEffect exigiria pra sincronizar isso.
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyAll(): void {
  for (const listener of listeners) listener();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useLessonDownload(lessonId: string) {
  const downloaded = useSyncExternalStore(
    subscribe,
    () => isLessonDownloaded(lessonId),
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    toggleLessonDownload(lessonId);
    notifyAll();
  }, [lessonId]);

  return { downloaded, toggle };
}
