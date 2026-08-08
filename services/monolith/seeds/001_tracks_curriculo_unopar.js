// Seed de trilhas (temas) a partir da grade curricular oficial de Arquitetura e Urbanismo
// (Universidade Pitágoras Unopar/Anhanguera, EAD, 10 semestres) fornecida pelo usuário em
// Docs/ignorar/ — pasta git-ignorada, o PDF da grade não é versionado; só os nomes das
// disciplinas (fato, não conteúdo protegido) viram dado aqui.
//
// Cria só a estrutura de tema (Track) — "units" fica vazio de propósito. Nenhuma lição ou
// pergunta é criada por este script; isso é passo seguinte, separado.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/001_tracks_curriculo_unopar.js
// (a app se conecta usando MONGODB_DATABASE=arqlearn, não o db da connection string — este
// script troca de banco explicitamente pelo mesmo motivo.)
//
// Disciplinas puramente administrativas da grade (Estágio Curricular I/II, Trabalho Final de
// Graduação I/II, Projeto de Extensão I-IV) foram deixadas de fora — não são corpo de
// conhecimento quizável, são avaliadas por supervisão/entrega, não por domínio de conteúdo.

const database = db.getSiblingDB("arqlearn");

const disciplinas = [
  // 1º semestre
  { semestre: 1, horas: 60, titulo: "Arquitetura Brasileira", topico: "arquitetura_brasileira" },
  { semestre: 1, horas: 60, titulo: "Construções Sustentáveis", topico: "construcoes_sustentaveis" },
  { semestre: 1, horas: 60, titulo: "Expressão e Representação — Oficinas", topico: "expressao_representacao" },
  { semestre: 1, horas: 60, titulo: "Fundamentos de Topografia", topico: "fundamentos_topografia" },
  {
    semestre: 1,
    horas: 60,
    titulo: "História e Teoria da Arquitetura, Urbanismo e Paisagismo",
    topico: "historia_teoria_arquitetura",
  },

  // 2º semestre
  {
    semestre: 2,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura Residencial de Baixa Complexidade",
    topico: "projeto_residencial_baixa_complexidade",
  },
  { semestre: 2, horas: 60, titulo: "Conforto Ambiental — Térmico", topico: "conforto_termico" },
  { semestre: 2, horas: 60, titulo: "Desenho de Arquitetura e Urbanismo", topico: "desenho_arquitetura_urbanismo" },
  { semestre: 2, horas: 60, titulo: "Geometria Descritiva Aplicada à Arquitetura", topico: "geometria_descritiva" },
  { semestre: 2, horas: 60, titulo: "Maquetes", topico: "maquetes" },

  // 3º semestre
  {
    semestre: 3,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura Cultural",
    topico: "projeto_arquitetura_cultural",
  },
  { semestre: 3, horas: 60, titulo: "Conforto Ambiental — Acústico e Lumínico", topico: "conforto_acustico_luminico" },
  {
    semestre: 3,
    horas: 60,
    titulo: "História e Teoria da Arquitetura — Do Pré-Modernismo ao Desconstrutivismo",
    topico: "historia_arquitetura_moderna_desconstrutivismo",
  },
  {
    semestre: 3,
    horas: 60,
    titulo: "Informática Aplicada à Arquitetura e Urbanismo — Perspectivas",
    topico: "informatica_perspectivas",
  },
  {
    semestre: 3,
    horas: 60,
    titulo: "Informática Aplicada à Arquitetura e Urbanismo — Projeções Ortogonais",
    topico: "informatica_projecoes_ortogonais",
  },

  // 4º semestre
  {
    semestre: 4,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura Residencial de Alta Complexidade",
    topico: "projeto_residencial_alta_complexidade",
  },
  { semestre: 4, horas: 60, titulo: "Ergonomia e Desenho de Móveis", topico: "ergonomia_desenho_moveis" },
  { semestre: 4, horas: 60, titulo: "Fundamentos de Resistência dos Materiais", topico: "resistencia_materiais" },
  { semestre: 4, horas: 60, titulo: "Instalações Elétricas de Baixa Tensão", topico: "instalacoes_eletricas" },
  {
    semestre: 4,
    horas: 60,
    titulo: "Materiais, Acabamentos e Revestimentos",
    topico: "materiais_acabamentos_revestimentos",
  },

  // 5º semestre
  {
    semestre: 5,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura de Uso Misto em Modelagem BIM",
    topico: "projeto_uso_misto_bim",
  },
  {
    semestre: 5,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura para Espaços Terciários",
    topico: "projeto_espacos_terciarios",
  },
  { semestre: 5, horas: 60, titulo: "Atelier de Projeto de Paisagismo", topico: "projeto_paisagismo" },
  {
    semestre: 5,
    horas: 60,
    titulo: "Projeto de Design de Interiores Comerciais e Serviços",
    topico: "design_interiores_comerciais",
  },

  // 6º semestre
  {
    semestre: 6,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura Educacional",
    topico: "projeto_arquitetura_educacional",
  },
  { semestre: 6, horas: 60, titulo: "Infraestrutura Urbana", topico: "infraestrutura_urbana" },
  { semestre: 6, horas: 60, titulo: "Instalações Hidrossanitárias", topico: "instalacoes_hidrossanitarias" },
  { semestre: 6, horas: 60, titulo: "Sistemas Estruturais — Concreto", topico: "sistemas_estruturais_concreto" },
  { semestre: 6, horas: 60, titulo: "Urbanismo de Baixa Complexidade", topico: "urbanismo_baixa_complexidade" },

  // 7º semestre
  {
    semestre: 7,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura Hospitalar",
    topico: "projeto_arquitetura_hospitalar",
  },
  {
    semestre: 7,
    horas: 60,
    titulo: "Sistemas Estruturais — Madeira e Aço",
    topico: "sistemas_estruturais_madeira_aco",
  },
  {
    semestre: 7,
    horas: 60,
    titulo: "Técnicas Retrospectivas, Restauração e Patrimônio Histórico",
    topico: "restauracao_patrimonio_historico",
  },
  { semestre: 7, horas: 60, titulo: "Urbanismo de Alta Complexidade", topico: "urbanismo_alta_complexidade" },

  // 8º semestre
  {
    semestre: 8,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura — Estação Rodoviária",
    topico: "projeto_estacao_rodoviaria",
  },
  { semestre: 8, horas: 60, titulo: "Planejamento Urbano e Regional", topico: "planejamento_urbano_regional" },
  { semestre: 8, horas: 60, titulo: "Tecnologia da Construção Civil", topico: "tecnologia_construcao_civil" },

  // 9º semestre
  {
    semestre: 9,
    horas: 60,
    titulo: "Atelier de Projeto de Arquitetura de Interiores",
    topico: "projeto_arquitetura_interiores",
  },
  { semestre: 9, horas: 60, titulo: "Prática Profissional em Arquitetura", topico: "pratica_profissional_arquitetura" },
  {
    semestre: 9,
    horas: 60,
    titulo: "Responsabilidade Social e Ambiental",
    topico: "responsabilidade_social_ambiental",
  },

  // 10º semestre
  { semestre: 10, horas: 60, titulo: "Ecologia Urbana", topico: "ecologia_urbana" },
  { semestre: 10, horas: 60, titulo: "Estudos Sociais e Econômicos", topico: "estudos_sociais_economicos" },
  { semestre: 10, horas: 60, titulo: "Estética e História da Arte", topico: "estetica_historia_arte" },
  { semestre: 10, horas: 60, titulo: "Sintaxe e Linguagem Visual", topico: "sintaxe_linguagem_visual" },
  { semestre: 10, horas: 60, titulo: "Sociedade Brasileira e Cidadania", topico: "sociedade_brasileira_cidadania" },
];

const now = new Date();
let inserted = 0;
let skipped = 0;

disciplinas.forEach((d) => {
  const semestreFmt = String(d.semestre).padStart(2, "0");
  const _id = `track_s${semestreFmt}_${d.topico}`;

  // upsert por _id: script idempotente, seguro rodar de novo sem duplicar.
  const result = database.tracks.updateOne(
    { _id },
    {
      $setOnInsert: {
        _id,
        title: d.titulo,
        topic: d.topico,
        origin: "curated",
        author_id: null,
        tenant_id: null,
        units: [],
        description: `${d.semestre}º semestre · ${d.horas}h — grade curricular de referência (Arquitetura e Urbanismo).`,
        created_at: now,
        updated_at: now,
      },
    },
    { upsert: true },
  );

  if (result.upsertedCount > 0) inserted += 1;
  else skipped += 1;
});

print(`Trilhas inseridas: ${inserted}, já existentes (puladas): ${skipped}, total processado: ${disciplinas.length}`);
