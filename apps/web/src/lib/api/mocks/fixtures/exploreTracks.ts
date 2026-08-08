import type { Track } from "@/types/api";

// Metadados de exibição (dificuldade/duração) não fazem parte do contrato de Track — o spec
// não tem esses campos nem um endpoint de "trilhas recomendadas" dedicado; aqui é conteúdo do
// cliente sobre as trilhas já listadas por GET /v1/tracks, igual ao achievementCatalog.
export interface RecommendedTrack {
  track: Track;
  difficulty: "Básico" | "Intermediário" | "Avançado";
  durationMinutes: number;
  icon: string;
}

export const mockRecommendedTracks: RecommendedTrack[] = [
  {
    track: {
      id: "track-sistemas-construtivos",
      title: "Sistemas Construtivos",
      topic: "sistemas_construtivos",
      origin: "curated",
    },
    difficulty: "Intermediário",
    durationMinutes: 45,
    icon: "foundation",
  },
  {
    track: {
      id: "track-arquitetura-moderna-br",
      title: "Arquitetura Moderna Brasileira",
      topic: "arquitetura_moderna",
      origin: "curated",
    },
    difficulty: "Básico",
    durationMinutes: 30,
    icon: "villa",
  },
  {
    track: {
      id: "track-conforto-termico",
      title: "Conforto Térmico",
      topic: "conforto_termico",
      origin: "curated",
    },
    difficulty: "Avançado",
    durationMinutes: 60,
    icon: "thermostat",
  },
];
