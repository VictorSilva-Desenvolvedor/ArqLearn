// Lições + perguntas reais para a trilha "Maquetes" (track_s02_maquetes, criada em
// 001_tracks_curriculo_unopar.js), a partir do material fornecido pelo usuário em
// Docs/ignorar/ (4 PDFs "Unidade 1-4" — grade da disciplina Maquetes, Unopar/Anhanguera;
// pasta git-ignorada, os PDFs não são versionados).
//
// Geração segue ArqLearn_IA_Persona_System_Prompt.md §4 (regras para geração de perguntas):
// só medium/hard (pedido explícito do usuário — nada de "easy"), source_excerpt_ref por
// página, sem alucinar referência, uma resposta correta inequívoca por pergunta.
// review_status "pending" em todas — ainda não há filtro de review_status em
// internal/learning/session.go (Find por _id via question_ids, sem checar review_status),
// então isso NÃO bloqueia a pergunta de aparecer numa sessão real hoje; é só o valor
// semanticamente correto até esse filtro existir — ver nota no CLAUDE.md.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/002_maquetes_licoes_perguntas.js
// (rodar depois do 001; idempotente via upsert por _id, como o anterior.)

const database = db.getSiblingDB("arqlearn");
const now = new Date();
const TRACK_ID = "track_s02_maquetes";

function upsertQuestions(lessonId, questions) {
  questions.forEach((q, index) => {
    const _id = `${lessonId}_q${String(index + 1).padStart(2, "0")}`;
    database.questions.updateOne(
      { _id },
      {
        $setOnInsert: {
          _id,
          lesson_id: lessonId,
          type: "multiple_choice",
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          source_upload_id: null,
          source_excerpt_ref: { page: q.page },
          review_status: "pending",
          created_at: now,
          updated_at: now,
        },
      },
      { upsert: true },
    );
  });
  return questions.map((_, index) => `${lessonId}_q${String(index + 1).padStart(2, "0")}`);
}

function upsertLesson(_id, title, questionIds) {
  database.lessons.updateOne(
    { _id },
    {
      $setOnInsert: {
        _id,
        track_id: TRACK_ID,
        title,
        difficulty: "medium",
        question_ids: questionIds,
        estimated_minutes: 8,
        created_at: now,
        updated_at: now,
      },
    },
    { upsert: true },
  );
}

// ---------------------------------------------------------------------------
// Unidade 1 — Introdução às maquetes (5361376d-...pdf)
// ---------------------------------------------------------------------------
const u1Questions = [
  {
    page: 3,
    difficulty: "medium",
    prompt:
      "Antes de iniciar a confecção de uma maquete, o texto recomenda planejar três aspectos: Utilização, Representação e Execução. Qual alternativa descreve corretamente a dimensão \"Execução\"?",
    options: [
      "Para que o objeto irá servir",
      "Como o objeto deverá ficar ao final de sua execução",
      "Como a maquete será produzida fisicamente para atender às demandas de utilização e representação",
      "Qual material será usado exclusivamente para venda imobiliária",
    ],
    correct_answer: "Como a maquete será produzida fisicamente para atender às demandas de utilização e representação",
    explanation:
      "O texto define \"Execução\" como como a maquete será produzida fisicamente para alcançar as demandas de utilização (a) e representação (b) já definidas.",
  },
  {
    page: 3,
    difficulty: "medium",
    prompt: "Por que a adoção da escala natural (1:1) é desaconselhada para a maioria das maquetes, segundo o texto?",
    options: [
      "Porque encarece demais o transporte do modelo até o cliente",
      "Porque pode passar ao cliente a falsa impressão de que a maquete é um protótipo utilizável, gerando frustração",
      "Porque nenhum material suporta ser cortado em tamanho real",
      "Porque a legislação de obras proíbe modelos em escala 1:1",
    ],
    correct_answer:
      "Porque pode passar ao cliente a falsa impressão de que a maquete é um protótipo utilizável, gerando frustração",
    explanation:
      "O texto explica que a escala natural pode imputar na cabeça do cliente que a maquete é um protótipo, gerando a vontade de testá-la como tal — o que ela não suporta.",
  },
  {
    page: 15,
    difficulty: "medium",
    prompt:
      "Um estudante quer produzir rapidamente uma maquete de estudo volumétrico, com baixo custo e tolerância a erros de corte. Segundo o texto, quais materiais são mais indicados?",
    options: [
      "Acrílico e MDF, pela durabilidade e acabamento",
      "Papéis específicos, compostos de papel e espuma, e madeiras macias como a balsa",
      "Chapas metálicas, pela resistência a erros de corte",
      "PVC e vidro, por serem baratos e fáceis de encontrar",
    ],
    correct_answer: "Papéis específicos, compostos de papel e espuma, e madeiras macias como a balsa",
    explanation:
      "O texto indica materiais fáceis de cortar e colar à mão para maquetes de estudo rápidas — papéis, espuma e madeiras macias como a balsa — justamente pelo baixo custo e pela margem para erros.",
  },
  {
    page: 7,
    difficulty: "hard",
    prompt:
      "Um arquiteto precisa apresentar ao cliente uma maquete que mostre o edifício e seu entorno imediato (o quarteirão/lote), sem necessidade de detalhamento de mobiliário. Combinando as faixas de escala descritas no texto, qual escala é mais adequada?",
    options: ["1:5000", "1:200", "1:50", "1:5"],
    correct_answer: "1:200",
    explanation:
      "O texto situa a escala urbanística geral em 1:1000-1:5000, mas o foco na quadra/lote de intervenção fica entre 1:500 e 1:100 — 1:200 é a única opção dentro dessa faixa intermediária.",
  },
  {
    page: 12,
    difficulty: "hard",
    prompt:
      "Segundo o texto, o que caracterizou o período em que as maquetes tiveram um \"papel secundário\" na história da arquitetura, antes de sua retomada por Antoni Gaudí no século XIX?",
    options: [
      "A ascensão da Bauhaus e de Le Corbusier, que passaram a valorizar mais os desenhos",
      "A maior valorização dos desenhos (plantas, cortes, elevações) pelas escolas de Belas Artes",
      "A proibição do uso de maquetes em concursos de fachada no Renascimento",
      "A invenção da impressora 3D, que substituiu a necessidade de modelos físicos",
    ],
    correct_answer: "A maior valorização dos desenhos (plantas, cortes, elevações) pelas escolas de Belas Artes",
    explanation:
      "O texto narra que, com o tempo, as maquetes passaram a ter papel secundário porque as escolas de Belas Artes davam mais importância aos desenhos — só no século XIX, com Gaudí, e nos anos 1920, com Bauhaus/Le Corbusier, elas retomaram força.",
  },
];

// ---------------------------------------------------------------------------
// Unidade 2 — Instrumentos e materiais para maquetes (4e5f4077-...pdf)
// ---------------------------------------------------------------------------
const u2Questions = [
  {
    page: 10,
    difficulty: "medium",
    prompt:
      "Você precisa representar uma curva de nível com 1 metro de espessura real em uma maquete na escala 1:500. Segundo o critério apresentado no texto, qual deve ser a espessura da placa medida na régua?",
    options: ["5mm", "2mm", "10mm", "1cm"],
    correct_answer: "2mm",
    explanation:
      "O texto dá o exemplo direto: uma espessura real de 1 metro deve medir 5mm na escala 1:200 e 2mm na escala 1:500.",
  },
  {
    page: 21,
    difficulty: "medium",
    prompt:
      "Qual é a diferença entre a conexão de acabamento em \"meia-esquadria\" e em \"topo\", segundo o texto?",
    options: [
      "Meia-esquadria usa cola quente; topo usa cola branca",
      "Na meia-esquadria as peças se encaixam a 45°; no acabamento em topo há sobreposição de faces, com uma face menor para se articular ao tamanho do projeto real",
      "Meia-esquadria é usada só em maquetes eletrônicas",
      "Topo é usado apenas para representar vegetação",
    ],
    correct_answer:
      "Na meia-esquadria as peças se encaixam a 45°; no acabamento em topo há sobreposição de faces, com uma face menor para se articular ao tamanho do projeto real",
    explanation:
      "O texto descreve a meia-esquadria como encaixe a 45° e o acabamento em topo como sobreposição de faces, em que uma face é menor para o molde se articular ao projeto real.",
  },
  {
    page: 2,
    difficulty: "medium",
    prompt:
      "Segundo Knoll e Hechinger (2005), citados no texto, a organização do espaço de trabalho para produção de maquetes deve prever três zonas distintas. Quais são elas?",
    options: [
      "Escritório, oficina e showroom",
      "Preparo/corte/manuseio de peças; montagem e acabamentos; instrumentos e ferramentas",
      "Desenho técnico, modelagem digital e impressão 3D",
      "Recepção de clientes, produção e estoque",
    ],
    correct_answer: "Preparo/corte/manuseio de peças; montagem e acabamentos; instrumentos e ferramentas",
    explanation:
      "O texto cita Knoll e Hechinger (2005): uma zona para preparo, corte e manuseio de peças; outra para montagem e acabamentos, de limpeza instantânea; e uma última para instrumentos e ferramentas.",
  },
  {
    page: 21,
    difficulty: "hard",
    prompt:
      "Para produzir uma peça de maquete com uma curva suave, a técnica mais indicada, segundo o texto, é:",
    options: [
      "Cortar a peça reta e depois lixar até obter a curva",
      "Selecionar um material mais mole e realizar vincos com uma passada leve de estilete, curvando o material progressivamente",
      "Usar exclusivamente MDF pela sua rigidez estrutural",
      "Aquecer o material com pistola de cola quente até amolecer",
    ],
    correct_answer:
      "Selecionar um material mais mole e realizar vincos com uma passada leve de estilete, curvando o material progressivamente",
    explanation:
      "O texto indica que, para conexões em curva, o método mais usado é escolher materiais mais moles e fazer vincos com uma passada leve de estilete, seguida da curvatura do material.",
  },
  {
    page: 8,
    difficulty: "hard",
    prompt:
      "Um maquetista precisa produzir, em baixo custo e com tolerância a pequenos erros, o volume de estudo preliminar de um pavilhão simples, sem necessidade de detalhes finos. Combinando as diretrizes do texto sobre materiais, corte e colagem, qual conjunto de escolhas é o mais coerente?",
    options: [
      "Acrílico e MDF, cortados com serra elétrica e colados com cola de contato",
      "Papel, espuma ou madeira balsa, cortados com estilete fino e colados com cola branca PVA",
      "Chapas metálicas, cortadas e soldadas com ferro de solda",
      "Vidro real, cortado com cortador de vidro",
    ],
    correct_answer: "Papel, espuma ou madeira balsa, cortados com estilete fino e colados com cola branca PVA",
    explanation:
      "O texto reserva acrílico/MDF/chapas metálicas para acabamentos mais técnicos e caros, e recomenda papel, espuma e balsa — cortados com estilete e colados com cola branca PVA — justamente para estudo rápido e barato.",
  },
];

// ---------------------------------------------------------------------------
// Unidade 3 — Tipos e técnicas de maquetes arquitetônicas (bd23963a-...pdf)
// ---------------------------------------------------------------------------
const u3Questions = [
  {
    page: 6,
    difficulty: "medium",
    prompt:
      "O que diferencia uma \"maquete volumétrica\" de uma \"maquete diagrama\", dentro da categoria de maquetes conceituais, segundo o texto?",
    options: [
      "A volumétrica não tem aberturas e mostra apenas a forma geral; a diagrama representa questões de ordem arquitetônica, como circulação ou relação formal, e não a forma final",
      "A volumétrica é sempre eletrônica; a diagrama é sempre física",
      "Não há diferença — os termos são sinônimos",
      "A maquete diagrama é usada apenas na fase de apresentação final ao cliente",
    ],
    correct_answer:
      "A volumétrica não tem aberturas e mostra apenas a forma geral; a diagrama representa questões de ordem arquitetônica, como circulação ou relação formal, e não a forma final",
    explanation:
      "O texto define a maquete volumétrica como a mais simples, sem aberturas, e a maquete diagrama como representação de questões de ordem arquitetônica (circulação, relação formal, atribuição no terreno), não da forma definitiva.",
  },
  {
    page: 18,
    difficulty: "medium",
    prompt:
      "Um edifício de 15 andares, com pé-direito de 3 metros cada, terá sua altura total representada em uma maquete na escala 1:100. Aplicando o mesmo raciocínio do texto (20 andares x 3m = 60m reais, que na escala 1:50 viram 1,20m), qual será a altura aproximada da maquete?",
    options: ["45cm", "90cm", "4,5cm", "1,20m"],
    correct_answer: "45cm",
    explanation:
      "15 andares x 3m = 45m de altura real; na escala 1:100, 45m ÷ 100 = 0,45m, ou seja, 45cm — mesmo raciocínio do exemplo do texto com o prédio de 20 andares.",
  },
  {
    page: 17,
    difficulty: "medium",
    prompt:
      "Por que maquetes monocromáticas (em um único tom/material) são frequentemente escolhidas para representar uma arquitetura de caráter conceitual, segundo o texto?",
    options: [
      "Porque são sempre a opção mais barata disponível",
      "Porque destacam as formas e composições na leitura visual, sem a distração de cores e materiais diversos",
      "Porque é uma exigência de norma técnica brasileira",
      "Porque só existe material colorido para maquetes de apresentação final",
    ],
    correct_answer: "Porque destacam as formas e composições na leitura visual, sem a distração de cores e materiais diversos",
    explanation:
      "O texto associa maquetes monocromáticas a uma arquitetura conceitual, na qual formas e composições ganham destaque na leitura visual.",
  },
  {
    page: 12,
    difficulty: "hard",
    prompt:
      "Um arquiteto precisa demonstrar como vigas e pilares se conectam em um nó estrutural específico do projeto, em grande detalhe. Segundo a classificação do texto, que tipo de maquete secundária e faixa de escala são mais adequados?",
    options: [
      "Maquete de estrutura (ou trama), na escala 1:50",
      "Maquete de detalhe ou conexão, em escala entre 1:25 e 1:5",
      "Maquete de contexto, na escala 1:1000",
      "Maquete de sítio, sem escala definida",
    ],
    correct_answer: "Maquete de detalhe ou conexão, em escala entre 1:25 e 1:5",
    explanation:
      "O texto reserva a maquete de estrutura/trama (escala maior, 1:50) para o sistema estrutural como um todo, e a maquete de detalhe ou conexão (1:25 a 1:5) para detalhes de conexões construtivas específicas.",
  },
  {
    page: 3,
    difficulty: "hard",
    prompt:
      "Considerando a tabela de níveis de elaboração de Knoll e Hechinger (2003), em qual nível se enquadra a \"maquete de trabalho\", e o que a caracteriza?",
    options: [
      "1º Nível – Pré-Projeto, correspondendo ao Esboço de Idealização, sem necessidade de estudos especializados",
      "2º Nível – Projeto, correspondendo ao Projeto de Construção; nessa fase as condições já estão previamente estabelecidas, embora a estrutura ainda possa sofrer alterações",
      "3º Nível – Execução, exigindo materiais que reproduzam com precisão o impacto visual das cores e superfícies",
      "Não se relaciona a nenhum nível, pois maquetes de trabalho são sempre secundárias",
    ],
    correct_answer:
      "2º Nível – Projeto, correspondendo ao Projeto de Construção; nessa fase as condições já estão previamente estabelecidas, embora a estrutura ainda possa sofrer alterações",
    explanation:
      "O Quadro 1 associa a maquete de trabalho ao 2º Nível (Projeto/Projeto de Construção); o texto complementa que, nessa fase, as condições já são previamente estabelecidas, embora a estrutura ou o conjunto ainda possam sofrer alterações.",
  },
];

// ---------------------------------------------------------------------------
// Unidade 4 — Finalização e apresentação de maquetes (b6f63a2a-...pdf)
// ---------------------------------------------------------------------------
const u4Questions = [
  {
    page: 13,
    difficulty: "medium",
    prompt:
      "Segundo o texto, por que o EPS (isopor) e o PVC não devem ser cortados em uma cortadora a laser?",
    options: [
      "Porque são materiais caros demais para justificar o uso da máquina",
      "Porque o EPS representa risco de incêndio (material inflamável) e o PVC libera gases tóxicos que a máquina não consegue exaurir adequadamente",
      "Porque nenhum dos dois pode ser cortado por nenhum processo de fabricação digital",
      "Porque os dois se distorcem sob a luz do laser sem se cortarem",
    ],
    correct_answer:
      "Porque o EPS representa risco de incêndio (material inflamável) e o PVC libera gases tóxicos que a máquina não consegue exaurir adequadamente",
    explanation:
      "O texto exclui explicitamente o EPS por representar risco (material inflamável/libera gases tóxicos) e o PVC porque a maioria das máquinas comercializadas não realiza a exaustão adequada de seus gases.",
  },
  {
    page: 19,
    difficulty: "medium",
    prompt:
      "O Modulor, desenvolvido por Le Corbusier, apresenta duas versões de figura humana. Quais são suas alturas, e em que princípio matemático ambas se baseiam?",
    options: [
      "1,70m e 1,80m, baseadas no sistema métrico decimal",
      "1,75m (versão azul) e 1,83m (versão vermelha), baseadas na proporção áurea",
      "1,60m e 1,90m, baseadas em uma média estatística europeia",
      "Apenas uma versão, de 1,75m, sem base matemática definida",
    ],
    correct_answer: "1,75m (versão azul) e 1,83m (versão vermelha), baseadas na proporção áurea",
    explanation:
      "O texto descreve o Modulor com duas versões — azul (1,75m) e vermelha (1,83m) — ambas baseadas na proporção áurea.",
  },
  {
    page: 20,
    difficulty: "medium",
    prompt:
      "Para a apresentação comercial de um empreendimento em lançamento, quais informações o texto indica como relevantes para identificar a maquete? E o que se soma a essa lista no caso de uma maquete acadêmica?",
    options: [
      "Comercial: nome do empreendimento, endereço, nome do autor da maquete e escala gráfica; Acadêmica soma, entre outros, RA, semestre cursando, nome do curso e do professor",
      "Comercial e acadêmica usam exatamente a mesma lista de informações, sem diferença",
      "Comercial: apenas o preço do imóvel; Acadêmica: apenas a nota do aluno",
      "Nenhuma identificação é necessária, pois a maquete já é autoexplicativa",
    ],
    correct_answer:
      "Comercial: nome do empreendimento, endereço, nome do autor da maquete e escala gráfica; Acadêmica soma, entre outros, RA, semestre cursando, nome do curso e do professor",
    explanation:
      "O texto lista, para apresentação comercial, nome do empreendimento/endereço/autor/escala gráfica; para fins acadêmicos, soma itens como nome do aluno, disciplina, professor, RA, semestre e curso.",
  },
  {
    page: 13,
    difficulty: "hard",
    prompt:
      "Comparando impressão 3D, fresadora CNC e cortadora a laser, qual afirmação está correta quanto à técnica de fabricação digital (adição ou subtração de material) e à dimensionalidade do corte?",
    options: [
      "As três trabalham por adição de material em três eixos",
      "A impressora 3D trabalha por adição; a CNC e a cortadora a laser trabalham por subtração, mas apenas a cortadora a laser é limitada a dois eixos (bidimensional)",
      "A cortadora a laser é a única capaz de trabalhar em três eixos, por isso substitui as demais",
      "A CNC e a impressora 3D usam exclusivamente filamento PLA como matéria-prima",
    ],
    correct_answer:
      "A impressora 3D trabalha por adição; a CNC e a cortadora a laser trabalham por subtração, mas apenas a cortadora a laser é limitada a dois eixos (bidimensional)",
    explanation:
      "O texto descreve a impressão 3D como fabricação por adição, a CNC como subtração (podendo gerar volumes 2D ou 3D conforme o maquinário) e a cortadora a laser como subtração limitada a dois eixos, portanto bidimensional.",
  },
  {
    page: 27,
    difficulty: "hard",
    prompt:
      "Uma aluna questiona se a escala humana padrão (baseada em um homem de aproximadamente 1,80m) representa adequadamente todos os usuários de um espaço. Segundo a resposta dada no texto, qual é a abordagem correta para essa limitação na humanização de uma maquete?",
    options: [
      "Ignorar a diversidade, pois a escala humana já é um padrão internacional fixo e não deve ser alterada",
      "Elaborar figuras humanas que representem a diversidade de usuários — mulheres, crianças, gestantes, idosos, pessoas com cadeira de rodas ou bengalas — considerando suas proporções e capacidades de deslocamento",
      "Utilizar exclusivamente o Modulor de Le Corbusier, que já contempla toda a diversidade humana",
      "Eliminar a escala humana da maquete para evitar interpretações equivocadas",
    ],
    correct_answer:
      "Elaborar figuras humanas que representem a diversidade de usuários — mulheres, crianças, gestantes, idosos, pessoas com cadeira de rodas ou bengalas — considerando suas proporções e capacidades de deslocamento",
    explanation:
      "O texto responde à pergunta da aluna afirmando que se pode elaborar figuras humanas que representem mulheres, crianças, idosos, cadeirantes, gestantes etc., para refletir o desenho universal e a acessibilidade.",
  },
];

const units = [
  { key: "u1", title: "Unidade 1 — Introdução às maquetes", questions: u1Questions },
  { key: "u2", title: "Unidade 2 — Instrumentos e materiais para maquetes", questions: u2Questions },
  { key: "u3", title: "Unidade 3 — Tipos e técnicas de maquetes arquitetônicas", questions: u3Questions },
  { key: "u4", title: "Unidade 4 — Finalização e apresentação de maquetes", questions: u4Questions },
];

const trackUnits = [];
units.forEach((unit, index) => {
  const lessonId = `lesson_maquetes_${unit.key}`;
  const questionIds = upsertQuestions(lessonId, unit.questions);
  upsertLesson(lessonId, unit.title, questionIds);
  trackUnits.push({
    id: `unit_maquetes_${unit.key}`,
    title: unit.title,
    order: index + 1,
    lesson_ids: [lessonId],
  });
});

const trackResult = database.tracks.updateOne(
  { _id: TRACK_ID },
  { $set: { units: trackUnits, updated_at: now } },
);

print(`Lições/perguntas processadas: ${units.length} lições, ${units.reduce((n, u) => n + u.questions.length, 0)} perguntas.`);
print(`Track ${TRACK_ID} atualizado: matched=${trackResult.matchedCount}, modified=${trackResult.modifiedCount}.`);
