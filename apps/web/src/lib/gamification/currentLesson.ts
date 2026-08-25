import { listTracks } from "@/lib/api/resources/tracks";
import { listTrackLessons } from "@/lib/api/resources/lessons";

// Spec: "A streak-risk notification should deep-link directly to the suggested lesson." O
// contrato de notificações (API Spec §9) não devolve lesson_id nenhum — só {id, type, message,
// read, created_at} — então a "lição sugerida" é derivada do mesmo jeito que a Home decide qual
// nó vira "current": a primeira lição em andamento, na primeira trilha que tiver uma.
// Falha silenciosa é proposital: isto enriquece uma notificação com um link, não é o conteúdo da
// tela. Uma trilha sem lições (404 em listTrackLessons) derrubava a página inteira de
// Notificações no error boundary — o Promise.all rejeitava e nenhuma notificação era exibida.
export async function findCurrentLessonHref(accessToken?: string): Promise<string | null> {
  try {
    const { data: tracks } = await listTracks({}, accessToken);
    const lessonsPerTrack = await Promise.all(
      tracks.map((track) => listTrackLessons(track.id, accessToken).catch(() => ({ data: [] }))),
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
