import { listTracks } from "@/lib/api/resources/tracks";
import { listTrackLessons } from "@/lib/api/resources/lessons";

// Spec: notificação de streak em risco tem "deep-link direto pra lição sugerida". O contrato de
// notificações (API Spec §9) não devolve lesson_id nenhum — só {id, type, message, read,
// created_at} — então a "lição sugerida" é derivada do mesmo jeito que a Home decide qual nó vira
// "current": a primeira lição em andamento, na primeira trilha que tiver uma. Espelha
// apps/web/src/lib/gamification/currentLesson.ts.
// Falha silenciosa é proposital, mesmo motivo do web: uma trilha sem lições (404 em
// listTrackLessons) rejeitava o Promise.all e virava unhandled rejection no meio do carregamento
// da tela de Notificações.
export async function findCurrentLessonHref(): Promise<string | null> {
  try {
    const { data: tracks } = await listTracks();
    const lessonsPerTrack = await Promise.all(
      tracks.map((track) => listTrackLessons(track.id).catch(() => ({ data: [] }))),
    );

    for (let i = 0; i < tracks.length; i++) {
      const current = lessonsPerTrack[i].data.find(
        (entry) => entry.progress_status === "in_progress",
      );
      if (current) return `/trilhas/${tracks[i].id}/${current.lesson.id}/sessao`;
    }
    return null;
  } catch {
    return null;
  }
}
