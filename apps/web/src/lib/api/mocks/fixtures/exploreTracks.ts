import { mockTracks } from "./tracks";
import { getThemeByTopic } from "./themes";
import type { Track } from "@/types/api";

// Metadados de exibição (dificuldade/duração) não fazem parte do contrato de Track — o spec
// não tem esses campos nem um endpoint de "trilhas recomendadas" dedicado; aqui é conteúdo do
// cliente sobre as trilhas já listadas por GET /v1/tracks, igual ao achievementCatalog. Reusa os
// mesmos registros/ids de mockTracks (tracks.ts) — é a mesma trilha, só numa vitrine diferente.
export interface RecommendedTrack {
  track: Track;
  difficulty: "Básico" | "Intermediário" | "Avançado";
  durationMinutes: number;
  icon: string;
  // Espelha themes.ts (hasContent) pro mesmo topic — dificuldade/duração acima são só decoração;
  // isto aqui decide se o card mostra essa decoração normal ou o selo "Em construção" (nenhuma
  // trilha real por trás ainda, ver themes.ts pro porquê).
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
    icon: "foundation",
  },
  {
    track: trackById("track-historia"),
    difficulty: "Básico",
    durationMinutes: 35,
    icon: "account_balance",
  },
  {
    track: trackById("track-urbanismo"),
    difficulty: "Intermediário",
    durationMinutes: 50,
    icon: "location_city",
  },
  {
    track: trackById("track-sistemas-construtivos"),
    difficulty: "Intermediário",
    durationMinutes: 45,
    icon: "handyman",
  },
  {
    track: trackById("track-arquitetura-moderna-br"),
    difficulty: "Básico",
    durationMinutes: 30,
    icon: "villa",
  },
  {
    track: trackById("track-conforto-termico"),
    difficulty: "Avançado",
    durationMinutes: 60,
    icon: "thermostat",
  },
  {
    track: trackById("track-estruturas"),
    difficulty: "Avançado",
    durationMinutes: 55,
    icon: "architecture",
  },
  // Únicas duas com hasContent:true hoje — ver comentário em tracks.ts sobre a vitrine estar
  // sempre vazia antes desta entrega (21/08/2026).
  {
    track: trackById("track-construcoes-sustentaveis"),
    difficulty: "Intermediário",
    durationMinutes: 40,
    icon: "eco",
  },
  {
    track: trackById("track-maquetes"),
    difficulty: "Básico",
    durationMinutes: 35,
    icon: "view_in_ar",
  },
];

export const mockRecommendedTracks: RecommendedTrack[] = recommendedTracksBase.map((entry) => ({
  ...entry,
  hasContent: getThemeByTopic(entry.track.topic).hasContent,
}));
