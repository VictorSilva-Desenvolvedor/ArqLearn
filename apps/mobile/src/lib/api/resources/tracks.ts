import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import { mockTracks } from "../mocks/fixtures/tracks";
import type { Paginated, Track } from "@/types/api";

export async function listTracks(): Promise<Paginated<Track>> {
  if (isResourceReal("tracks")) {
    return apiFetch<Paginated<Track>>("/v1/tracks");
  }
  return mockDelay({ data: mockTracks, next_cursor: null });
}
