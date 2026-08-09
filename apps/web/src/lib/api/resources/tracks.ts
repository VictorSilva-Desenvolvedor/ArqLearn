import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockTracks } from "../mocks/fixtures/tracks";
import type { Paginated, Track } from "@/types/api";

export interface ListTracksParams {
  topic?: string;
  origin?: string;
  limit?: number;
  cursor?: string;
}

// accessToken (opcional) é pra chamadas server-side (ver lib/supabase/server.ts#getServerAccessToken)
// — chamadas client-side omitem e caem no provider de lib/api/http.ts.
export async function listTracks(
  params: ListTracksParams = {},
  accessToken?: string,
): Promise<Paginated<Track>> {
  if (isResourceReal("tracks")) {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {}),
    ).toString();
    return apiFetch<Paginated<Track>>(`/v1/tracks${qs ? `?${qs}` : ""}`, undefined, accessToken);
  }

  const filtered = mockTracks.filter((track) => {
    if (params.topic && track.topic !== params.topic) return false;
    if (params.origin && track.origin !== params.origin) return false;
    return true;
  });
  return mockDelay({ data: filtered, next_cursor: null });
}
