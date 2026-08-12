// Catálogo de temas/tópicos disponíveis para o aluno escolher como "conteúdo principal" do
// app — reúne os 7 temas "de vitrine" já com conteúdo completo (mapa/trilhas recomendadas/Modo
// Infinito hand-authored) com as disciplinas reais da grade curricular de Arquitetura e
// Urbanismo. Espelha apps/web/src/lib/api/mocks/fixtures/themes.ts.
//
// `ThemeTopic` não é mais uma union literal fechada — com quase 50 entradas isso vira ruído;
// o catálogo abaixo é a fonte de verdade, não o tipo.
export type ThemeTopic = string;

export interface ThemeDefinition {
  topic: ThemeTopic;
  label: string;
  icon: string;
  /** Semestre da grade curricular (1-10). Ausente nos 7 temas "de vitrine" originais. */
  semester?: number;
  /**
   * true só nos temas com Mapa/Trilhas Recomendadas/Modo Infinito com conteúdo de verdade já
   * escrito à mão. As disciplinas novas da grade entram como selecionáveis, mas mostram um
   * estado "conteúdo em preparação" em vez de reaproveitar (e mentir) o conteúdo de outro tema.
   */
  hasContent: boolean;
}

const featuredThemes: ThemeDefinition[] = [
  { topic: "fundamentos", label: "Fundamentos de Arquitetura", icon: "foundation", hasContent: true },
  { topic: "historia", label: "História da Arquitetura", icon: "account_balance", hasContent: true },
  { topic: "urbanismo", label: "Urbanismo", icon: "location_city", hasContent: true },
  { topic: "sistemas_construtivos", label: "Sistemas Construtivos", icon: "handyman", hasContent: true },
  { topic: "arquitetura_moderna", label: "Arquitetura Moderna Brasileira", icon: "villa", hasContent: true },
  { topic: "conforto_termico", label: "Conforto Térmico", icon: "thermostat", hasContent: true },
  { topic: "estruturas", label: "Sistemas Estruturais", icon: "architecture", hasContent: true },
];

// Disciplinas reais da grade curricular — grupadas por semestre, na ordem do documento fonte.
const curriculumThemes: ThemeDefinition[] = [
  // 1º semestre
  { topic: "arquitetura_brasileira", label: "Arquitetura Brasileira", icon: "flag", semester: 1, hasContent: false },
  { topic: "construcoes_sustentaveis", label: "Construções Sustentáveis", icon: "eco", semester: 1, hasContent: true },
  { topic: "expressao_representacao_oficinas", label: "Expressão e Representação - Oficinas", icon: "draw", semester: 1, hasContent: false },
  { topic: "fundamentos_topografia", label: "Fundamentos de Topografia", icon: "terrain", semester: 1, hasContent: false },
  // 2º semestre
  { topic: "atelier_residencial_baixa", label: "Atelier de Projeto de Arquitetura Residencial de Baixa Complexidade", icon: "home", semester: 2, hasContent: false },
  { topic: "desenho_arquitetura_urbanismo", label: "Desenho de Arquitetura e Urbanismo", icon: "architecture", semester: 2, hasContent: true },
  { topic: "geometria_descritiva", label: "Geometria Descritiva Aplicada à Arquitetura", icon: "shape_line", semester: 2, hasContent: false },
  { topic: "maquetes", label: "Maquetes", icon: "view_in_ar", semester: 2, hasContent: true },
  // 3º semestre
  { topic: "projeto_arquitetura_cultural", label: "Atelier de Projeto de Arquitetura Cultural", icon: "theater_comedy", semester: 3, hasContent: true },
  { topic: "conforto_acustico_luminico", label: "Conforto Ambiental - Acústico e Lumínico", icon: "light_mode", semester: 3, hasContent: false },
  { topic: "historia_pre_modernismo_desconstrutivismo", label: "História e Teoria da Arquitetura - do Pré-Modernismo ao Desconstrutivismo", icon: "museum", semester: 3, hasContent: false },
  { topic: "informatica_perspectivas", label: "Informática Aplicada à Arquitetura e Urbanismo - Perspectivas", icon: "3d_rotation", semester: 3, hasContent: false },
  { topic: "informatica_projecoes_ortogonais", label: "Informática Aplicada à Arquitetura e Urbanismo - Projeções Ortogonais", icon: "grid_on", semester: 3, hasContent: true },
  // 4º semestre
  { topic: "atelier_residencial_alta", label: "Atelier de Projeto de Arquitetura Residencial de Alta Complexidade", icon: "villa", semester: 4, hasContent: false },
  { topic: "ergonomia_desenho_moveis", label: "Ergonomia e Desenho de Móveis", icon: "chair", semester: 4, hasContent: false },
  { topic: "resistencia_materiais", label: "Fundamentos de Resistência dos Materiais", icon: "science", semester: 4, hasContent: false },
  { topic: "instalacoes_eletricas", label: "Instalações Elétricas de Baixa Tensão", icon: "bolt", semester: 4, hasContent: false },
  { topic: "materiais_acabamentos_revestimentos", label: "Materiais, Acabamentos e Revestimentos", icon: "texture", semester: 4, hasContent: false },
  // 5º semestre
  { topic: "atelier_uso_misto_bim", label: "Atelier de Projeto de Arquitetura de Uso Misto em Modelagem BIM", icon: "domain", semester: 5, hasContent: false },
  { topic: "atelier_espacos_terciarios", label: "Atelier de Projeto de Arquitetura para Espaços Terciários", icon: "store", semester: 5, hasContent: false },
  { topic: "atelier_paisagismo", label: "Atelier de Projeto de Paisagismo", icon: "park", semester: 5, hasContent: false },
  { topic: "design_interiores_comerciais", label: "Projeto de Design de Interiores Comerciais e Serviços", icon: "chair_alt", semester: 5, hasContent: false },
  // 6º semestre
  { topic: "atelier_educacional", label: "Atelier de Projeto de Arquitetura Educacional", icon: "school", semester: 6, hasContent: false },
  { topic: "infraestrutura_urbana", label: "Infraestrutura Urbana", icon: "construction", semester: 6, hasContent: false },
  { topic: "instalacoes_hidrossanitarias", label: "Instalações Hidrossanitárias", icon: "plumbing", semester: 6, hasContent: false },
  { topic: "sistemas_estruturais_concreto", label: "Sistemas Estruturais - Concreto", icon: "foundation", semester: 6, hasContent: false },
  { topic: "urbanismo_baixa_complexidade", label: "Urbanismo de Baixa Complexidade", icon: "location_city", semester: 6, hasContent: false },
  // 7º semestre
  { topic: "atelier_hospitalar", label: "Atelier de Projeto de Arquitetura Hospitalar", icon: "local_hospital", semester: 7, hasContent: false },
  { topic: "sistemas_estruturais_madeira_aco", label: "Sistemas Estruturais - Madeira e Aço", icon: "carpenter", semester: 7, hasContent: false },
  { topic: "tecnicas_retrospectivas_patrimonio", label: "Técnicas Retrospectivas, Restauração e Patrimônio Histórico", icon: "history_edu", semester: 7, hasContent: false },
  { topic: "urbanismo_alta_complexidade", label: "Urbanismo de Alta Complexidade", icon: "location_city", semester: 7, hasContent: false },
  // 8º semestre
  { topic: "atelier_estacao_rodoviaria", label: "Atelier de Projeto de Arquitetura Estação Rodoviária", icon: "directions_bus", semester: 8, hasContent: false },
  { topic: "planejamento_urbano_regional", label: "Planejamento Urbano e Regional", icon: "map", semester: 8, hasContent: false },
  { topic: "tecnologia_construcao_civil", label: "Tecnologia da Construção Civil", icon: "engineering", semester: 8, hasContent: false },
  // 9º semestre
  { topic: "atelier_interiores", label: "Atelier de Projeto de Arquitetura de Interiores", icon: "weekend", semester: 9, hasContent: false },
  { topic: "pratica_profissional", label: "Prática Profissional em Arquitetura", icon: "work", semester: 9, hasContent: false },
  { topic: "responsabilidade_social_ambiental", label: "Responsabilidade Social e Ambiental", icon: "diversity_3", semester: 9, hasContent: false },
  // 10º semestre
  { topic: "ecologia_urbana", label: "Ecologia Urbana", icon: "forest", semester: 10, hasContent: false },
  { topic: "estudos_sociais_economicos", label: "Estudos Sociais e Econômicos", icon: "trending_up", semester: 10, hasContent: false },
  { topic: "estetica_historia_arte", label: "Estética e História da Arte", icon: "palette", semester: 10, hasContent: false },
  { topic: "sintaxe_linguagem_visual", label: "Sintaxe e Linguagem Visual", icon: "visibility", semester: 10, hasContent: false },
  { topic: "sociedade_brasileira_cidadania", label: "Sociedade Brasileira e Cidadania", icon: "groups", semester: 10, hasContent: false },
];

export const themeCatalog: ThemeDefinition[] = [...featuredThemes, ...curriculumThemes];

export const DEFAULT_THEME_TOPIC: ThemeTopic = "fundamentos";

export function getThemeByTopic(topic: string | null | undefined): ThemeDefinition {
  return themeCatalog.find((theme) => theme.topic === topic) ?? themeCatalog[0];
}

export function isValidThemeTopic(topic: string | null | undefined): boolean {
  return themeCatalog.some((theme) => theme.topic === topic);
}
