import type { Track } from "@/types/api";

export const mockTracks: Track[] = [
  { id: "track-fundamentos", title: "Fundamentos de Arquitetura", topic: "fundamentos", origin: "curated" },
  {
    id: "track-historia",
    title: "História da Arquitetura",
    topic: "historia",
    origin: "curated",
    description: "Grécia e Roma Antiga",
  },
  { id: "track-urbanismo", title: "Urbanismo", topic: "urbanismo", origin: "curated" },
  {
    id: "track-sistemas-construtivos",
    title: "Sistemas Construtivos",
    topic: "sistemas_construtivos",
    origin: "curated",
  },
  {
    id: "track-arquitetura-moderna-br",
    title: "Arquitetura Moderna Brasileira",
    topic: "arquitetura_moderna",
    origin: "curated",
  },
  {
    id: "track-conforto-termico",
    title: "Conforto Térmico",
    topic: "conforto_termico",
    origin: "curated",
  },
  {
    id: "track-estruturas",
    title: "Sistemas Estruturais",
    topic: "estruturas",
    origin: "curated",
  },
];
