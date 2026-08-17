import { mockTracks } from "./tracks";
import { getThemeByTopic } from "./themes";
import type { IconName } from "@/components/ui/Icon";
import type { Track } from "@/types/api";

// Metadados de exibição (dificuldade/duração) não fazem parte do contrato de Track — o spec
// não tem esses campos nem um endpoint de "trilhas recomendadas" dedicado; aqui é conteúdo do
// cliente sobre as trilhas já listadas por GET /v1/tracks, igual ao achievementCatalog. Reusa os
// mesmos registros/ids de mockTracks (tracks.ts) — é a mesma trilha, só numa vitrine diferente.
// Espelha apps/web/src/lib/api/mocks/fixtures/exploreTracks.ts — `icon` aqui é IconName (RN).
export interface RecommendedTrack {
  track: Track;
  difficulty: "Básico" | "Intermediário" | "Avançado";
  durationMinutes: number;
  icon: IconName;
  // Espelha themes.ts (hasContent) pro mesmo topic — ver comentário lá pro porquê os 7 temas de
  // vitrine hoje não têm trilha real por trás.
  hasContent: boolean;
}

function trackById(id: string): Track {
  const track = mockTracks.find((t) => t.id === id);
  if (!track) throw new Error(`mockTracks não tem a trilha ${id}`);
  return track;
}

const recommendedTracksBase: Omit<RecommendedTrack, "hasContent">[] = [
  {
    track: trackById("track-fundamentos"),
    difficulty: "Básico",
    durationMinutes: 40,
    icon: "themeFoundation",
  },
  {
    track: trackById("track-historia"),
    difficulty: "Básico",
    durationMinutes: 35,
    icon: "accountBalance",
  },
  {
    track: trackById("track-urbanismo"),
    difficulty: "Intermediário",
    durationMinutes: 50,
    icon: "locationCity",
  },
  {
    track: trackById("track-sistemas-construtivos"),
    difficulty: "Intermediário",
    durationMinutes: 45,
    icon: "themeHandyman",
  },
  {
    track: trackById("track-arquitetura-moderna-br"),
    difficulty: "Básico",
    durationMinutes: 30,
    icon: "themeVilla",
  },
  {
    track: trackById("track-conforto-termico"),
    difficulty: "Avançado",
    durationMinutes: 60,
    icon: "themeThermostat",
  },
  {
    track: trackById("track-estruturas"),
    difficulty: "Avançado",
    durationMinutes: 55,
    icon: "themeArchitecture",
  },
];

export const mockRecommendedTracks: RecommendedTrack[] = recommendedTracksBase.map((entry) => ({
  ...entry,
  hasContent: getThemeByTopic(entry.track.topic).hasContent,
}));
