import AsyncStorage from "@react-native-async-storage/async-storage";

// Espelha apps/web/src/lib/offline/downloadedLessons.ts (mesma chave/formato: array JSON de
// ids), trocando window.localStorage (síncrono) por AsyncStorage (assíncrono). Por isso, ao
// contrário do web, mantém um cache em memória hidratado uma vez do AsyncStorage — é o que
// permite useLessonDownload continuar lendo um snapshot síncrono via useSyncExternalStore.
const STORAGE_KEY = "arqlearn_downloaded_lessons";

let cache = new Set<string>();
let hydrated = false;
let hydrating: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const ids = JSON.parse(raw) as string[];
          cache = new Set(ids);
        } catch {
          cache = new Set();
        }
      }
      hydrated = true;
    });
  }
  await hydrating;
}

function persist(): void {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache)));
}

export function ensureHydrated(onReady: () => void): void {
  if (hydrated) return;
  void hydrate().then(onReady);
}

export function isLessonDownloaded(lessonId: string): boolean {
  return cache.has(lessonId);
}

export function toggleLessonDownload(lessonId: string): void {
  if (cache.has(lessonId)) {
    cache.delete(lessonId);
  } else {
    cache.add(lessonId);
  }
  persist();
}
