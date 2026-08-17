import type { IconName } from "@/components/ui/Icon";

// Catálogo de temas/tópicos disponíveis para o aluno escolher como "conteúdo principal" do
// app — reúne os 7 temas "de vitrine" originais (mapa/trilhas recomendadas/Modo Infinito
// hand-authored, mas hoje sem trilha real correspondente no backend — ver hasContent abaixo) com
// as disciplinas reais da grade curricular de Arquitetura e Urbanismo. Espelha
// apps/web/src/lib/api/mocks/fixtures/themes.ts — `icon` aqui é IconName (RN), não a string livre
// de Material Symbols do web (ver mapeamento themeXxx em components/ui/Icon.tsx).
//
// `ThemeTopic` não é mais uma union literal fechada — com quase 50 entradas isso vira ruído;
// o catálogo abaixo é a fonte de verdade, não o tipo.
export type ThemeTopic = string;

export interface ThemeDefinition {
  topic: ThemeTopic;
  label: string;
  icon: IconName;
  /** Semestre da grade curricular (1-10). Ausente nos 7 temas "de vitrine" originais. */
  semester?: number;
  /**
   * true só nos temas com Mapa/Trilhas Recomendadas/Modo Infinito com conteúdo de verdade já
   * escrito à mão. As disciplinas novas da grade entram como selecionáveis, mas mostram um
   * estado "conteúdo em preparação" em vez de reaproveitar (e mentir) o conteúdo de outro tema.
   */
  hasContent: boolean;
}

// hasContent:false nos 7 — nenhum desses 7 tópicos "de vitrine" corresponde a uma trilha real no
// backend hoje (conferido direto no Mongo, mesma checagem de
// apps/web/.../fixtures/themes.ts — ver comentário lá pro detalhe completo).
const featuredThemes: ThemeDefinition[] = [
  { topic: "fundamentos", label: "Fundamentos de Arquitetura", icon: "themeFoundation", hasContent: false },
  { topic: "historia", label: "História da Arquitetura", icon: "accountBalance", hasContent: false },
  { topic: "urbanismo", label: "Urbanismo", icon: "locationCity", hasContent: false },
  { topic: "sistemas_construtivos", label: "Sistemas Construtivos", icon: "themeHandyman", hasContent: false },
  { topic: "arquitetura_moderna", label: "Arquitetura Moderna Brasileira", icon: "themeVilla", hasContent: false },
  { topic: "conforto_termico", label: "Conforto Térmico", icon: "themeThermostat", hasContent: false },
  { topic: "estruturas", label: "Sistemas Estruturais", icon: "themeArchitecture", hasContent: false },
];

// Disciplinas reais da grade curricular — grupadas por semestre, na ordem do documento fonte.
const curriculumThemes: ThemeDefinition[] = [
  // 1º semestre
  { topic: "arquitetura_brasileira", label: "Arquitetura Brasileira", icon: "themeFlag", semester: 1, hasContent: false },
  { topic: "construcoes_sustentaveis", label: "Construções Sustentáveis", icon: "themeEco", semester: 1, hasContent: true },
  { topic: "expressao_representacao_oficinas", label: "Expressão e Representação - Oficinas", icon: "themeDraw", semester: 1, hasContent: false },
  { topic: "fundamentos_topografia", label: "Fundamentos de Topografia", icon: "themeTerrain", semester: 1, hasContent: false },
  // 2º semestre
  { topic: "atelier_residencial_baixa", label: "Atelier de Projeto de Arquitetura Residencial de Baixa Complexidade", icon: "themeHome", semester: 2, hasContent: false },
  { topic: "desenho_arquitetura_urbanismo", label: "Desenho de Arquitetura e Urbanismo", icon: "themeArchitecture", semester: 2, hasContent: true },
  { topic: "geometria_descritiva", label: "Geometria Descritiva Aplicada à Arquitetura", icon: "themeShapeLine", semester: 2, hasContent: false },
  { topic: "maquetes", label: "Maquetes", icon: "themeViewInAr", semester: 2, hasContent: true },
  // 3º semestre
  { topic: "projeto_arquitetura_cultural", label: "Atelier de Projeto de Arquitetura Cultural", icon: "themeTheaterComedy", semester: 3, hasContent: true },
  { topic: "conforto_acustico_luminico", label: "Conforto Ambiental - Acústico e Lumínico", icon: "themeLightMode", semester: 3, hasContent: false },
  { topic: "historia_pre_modernismo_desconstrutivismo", label: "História e Teoria da Arquitetura - do Pré-Modernismo ao Desconstrutivismo", icon: "themeMuseum", semester: 3, hasContent: false },
  { topic: "informatica_perspectivas", label: "Informática Aplicada à Arquitetura e Urbanismo - Perspectivas", icon: "theme3dRotation", semester: 3, hasContent: false },
  { topic: "informatica_projecoes_ortogonais", label: "Informática Aplicada à Arquitetura e Urbanismo - Projeções Ortogonais", icon: "themeGridOn", semester: 3, hasContent: true },
  // 4º semestre
  { topic: "atelier_residencial_alta", label: "Atelier de Projeto de Arquitetura Residencial de Alta Complexidade", icon: "themeVilla", semester: 4, hasContent: false },
  { topic: "ergonomia_desenho_moveis", label: "Ergonomia e Desenho de Móveis", icon: "themeChair", semester: 4, hasContent: false },
  { topic: "resistencia_materiais", label: "Fundamentos de Resistência dos Materiais", icon: "themeScience", semester: 4, hasContent: false },
  { topic: "instalacoes_eletricas", label: "Instalações Elétricas de Baixa Tensão", icon: "bolt", semester: 4, hasContent: false },
  { topic: "materiais_acabamentos_revestimentos", label: "Materiais, Acabamentos e Revestimentos", icon: "themeTexture", semester: 4, hasContent: false },
  // 5º semestre
  { topic: "atelier_uso_misto_bim", label: "Atelier de Projeto de Arquitetura de Uso Misto em Modelagem BIM", icon: "themeDomain", semester: 5, hasContent: false },
  { topic: "atelier_espacos_terciarios", label: "Atelier de Projeto de Arquitetura para Espaços Terciários", icon: "themeStore", semester: 5, hasContent: false },
  { topic: "atelier_paisagismo", label: "Atelier de Projeto de Paisagismo", icon: "themePark", semester: 5, hasContent: false },
  { topic: "design_interiores_comerciais", label: "Projeto de Design de Interiores Comerciais e Serviços", icon: "themeChairAlt", semester: 5, hasContent: false },
  // 6º semestre
  { topic: "atelier_educacional", label: "Atelier de Projeto de Arquitetura Educacional", icon: "school", semester: 6, hasContent: false },
  { topic: "infraestrutura_urbana", label: "Infraestrutura Urbana", icon: "construction", semester: 6, hasContent: false },
  { topic: "instalacoes_hidrossanitarias", label: "Instalações Hidrossanitárias", icon: "themePlumbing", semester: 6, hasContent: false },
  { topic: "sistemas_estruturais_concreto", label: "Sistemas Estruturais - Concreto", icon: "themeFoundation", semester: 6, hasContent: false },
  { topic: "urbanismo_baixa_complexidade", label: "Urbanismo de Baixa Complexidade", icon: "locationCity", semester: 6, hasContent: false },
  // 7º semestre
  { topic: "atelier_hospitalar", label: "Atelier de Projeto de Arquitetura Hospitalar", icon: "themeLocalHospital", semester: 7, hasContent: false },
  { topic: "sistemas_estruturais_madeira_aco", label: "Sistemas Estruturais - Madeira e Aço", icon: "themeCarpenter", semester: 7, hasContent: false },
  { topic: "tecnicas_retrospectivas_patrimonio", label: "Técnicas Retrospectivas, Restauração e Patrimônio Histórico", icon: "themeHistoryEdu", semester: 7, hasContent: false },
  { topic: "urbanismo_alta_complexidade", label: "Urbanismo de Alta Complexidade", icon: "locationCity", semester: 7, hasContent: false },
  // 8º semestre
  { topic: "atelier_estacao_rodoviaria", label: "Atelier de Projeto de Arquitetura Estação Rodoviária", icon: "themeDirectionsBus", semester: 8, hasContent: false },
  { topic: "planejamento_urbano_regional", label: "Planejamento Urbano e Regional", icon: "themeMap", semester: 8, hasContent: false },
  { topic: "tecnologia_construcao_civil", label: "Tecnologia da Construção Civil", icon: "themeEngineering", semester: 8, hasContent: false },
  // 9º semestre
  { topic: "atelier_interiores", label: "Atelier de Projeto de Arquitetura de Interiores", icon: "themeWeekend", semester: 9, hasContent: false },
  { topic: "pratica_profissional", label: "Prática Profissional em Arquitetura", icon: "themeWork", semester: 9, hasContent: false },
  { topic: "responsabilidade_social_ambiental", label: "Responsabilidade Social e Ambiental", icon: "themeDiversity3", semester: 9, hasContent: false },
  // 10º semestre
  { topic: "ecologia_urbana", label: "Ecologia Urbana", icon: "themeForest", semester: 10, hasContent: false },
  { topic: "estudos_sociais_economicos", label: "Estudos Sociais e Econômicos", icon: "themeTrendingUp", semester: 10, hasContent: false },
  { topic: "estetica_historia_arte", label: "Estética e História da Arte", icon: "themePalette", semester: 10, hasContent: false },
  { topic: "sintaxe_linguagem_visual", label: "Sintaxe e Linguagem Visual", icon: "themeVisibility", semester: 10, hasContent: false },
  { topic: "sociedade_brasileira_cidadania", label: "Sociedade Brasileira e Cidadania", icon: "themeGroups", semester: 10, hasContent: false },
];

export const themeCatalog: ThemeDefinition[] = [...featuredThemes, ...curriculumThemes];

export const DEFAULT_THEME_TOPIC: ThemeTopic = "fundamentos";

export function getThemeByTopic(topic: string | null | undefined): ThemeDefinition {
  return themeCatalog.find((theme) => theme.topic === topic) ?? themeCatalog[0];
}

export function isValidThemeTopic(topic: string | null | undefined): boolean {
  return themeCatalog.some((theme) => theme.topic === topic);
}
