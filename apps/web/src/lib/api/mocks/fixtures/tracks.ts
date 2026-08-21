import type { Track } from "@/types/api";

export const mockTracks: Track[] = [
  {
    id: "track-fundamentos",
    title: "Fundamentos de Arquitetura",
    topic: "fundamentos",
    origin: "curated",
  },
  {
    id: "track-historia",
    title: "História da Arquitetura",
    topic: "historia",
    origin: "curated",
    description: "Grécia e Roma Antiga",
  },
  {
    id: "track-urbanismo",
    title: "Urbanismo",
    topic: "urbanismo",
    origin: "curated",
  },
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
  // As duas trilhas abaixo (topics já com hasContent:true em themes.ts) são as únicas com
  // conteúdo real seedado no backend hoje (Construções Sustentáveis, Maquetes — ver
  // Docs/PENDENCIAS_MOBILE.md/PENDENCIAS_IA.md) — achado ao investigar "Trilhas Recomendadas
  // sempre vazia" (21/08/2026): os 7 topics acima são todos hasContent:false, então nenhuma
  // trilha jamais passava no filtro da vitrine. Adicionadas aqui pra vitrine ter pelo menos
  // algo real pra mostrar, em vez de reativar os 7 topics ainda sem conteúdo de verdade.
  {
    id: "track-construcoes-sustentaveis",
    title: "Construções Sustentáveis",
    topic: "construcoes_sustentaveis",
    origin: "curated",
  },
  {
    id: "track-maquetes",
    title: "Maquetes",
    topic: "maquetes",
    origin: "curated",
  },
];
