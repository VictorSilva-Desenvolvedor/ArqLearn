// Terceira fonte de perguntas pra trilha "Maquetes" (track_s02_maquetes) — autoria direta (Claude),
// complementando as geradas via Gemini/Groq (cmd/generate-questions -provider=gemini|groq
// -difficulty=easy) nas mesmas 4 unidades. Mesmo texto-fonte de 002_maquetes_licoes_perguntas.js
// (Docs/ignorar/, 4 PDFs "Unidade 1-4"), lido diretamente pelo Claude nesta sessão.
//
// Diferente de 002 (que cria as lições do zero via $setOnInsert), as lições já existem — este
// script só ADICIONA perguntas a question_ids via $addToSet, sem sobrescrever nada.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/003_maquetes_perguntas_claude.js
// (idempotente: upsert por _id nas perguntas, $addToSet evita duplicar id em question_ids.)

const database = db.getSiblingDB("arqlearn");
const now = new Date();

function addQuestions(lessonId, questions) {
  const ids = [];
  questions.forEach((q, index) => {
    const _id = `${lessonId}_q_claude_${String(index + 1).padStart(2, "0")}`;
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
          confidence: "high",
          source_upload_id: null,
          source_excerpt_ref: { page: q.page },
          review_status: "approved",
          created_at: now,
          updated_at: now,
        },
      },
      { upsert: true },
    );
    ids.push(_id);
  });
  database.lessons.updateOne(
    { _id: lessonId },
    { $addToSet: { question_ids: { $each: ids } }, $set: { updated_at: now } },
  );
  return ids;
}

// ---------------------------------------------------------------------------
// Unidade 1 — Introdução às maquetes
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u1", [
  {
    page: 2,
    difficulty: "easy",
    prompt: "Do ponto de vista dimensional, o que é uma maquete segundo o texto?",
    options: [
      "Um desenho técnico bidimensional do projeto",
      "Um modelo tridimensional, com largura, comprimento e altura",
      "Uma fotografia do projeto em escala reduzida",
      "Um relatório escrito descrevendo o projeto",
    ],
    correct_answer: "Um modelo tridimensional, com largura, comprimento e altura",
    explanation:
      "O texto define maquetes como modelos tridimensionais — representações físicas em três dimensões: largura, comprimento e altura.",
  },
  {
    page: 4,
    difficulty: "easy",
    prompt:
      "Segundo o texto, artistas e artesãos costumam vender peças prontas para inserir em maquetes em lojas conhecidas por qual nome, que usam escalas diferentes das usuais entre arquitetos (como 1:6, 1:12 ou 1:87)?",
    options: ["Lojas de Hobbies", "Papelarias", "Lojas de material de construção", "Ateliês de escultura"],
    correct_answer: "Lojas de Hobbies",
    explanation:
      "O texto explica que quem compra miniaturas prontas em lojas de Hobbies precisa verificar se a escala da peça é equivalente à escala da maquete, já que essas lojas usam escalas próprias do universo de miniaturas (1:6, 1:12, 1:24, 1:4, 1:64, 1:87).",
  },
  {
    page: 5,
    difficulty: "medium",
    prompt:
      "Um arquiteto precisa apresentar uma maquete de um lote de grande extensão, priorizando o entendimento do entorno urbano como um todo, sem detalhar individualmente cada edificação. Considerando as faixas de escala descritas no texto, qual delas é a mais adequada para esse objetivo?",
    options: ["1:1000 a 1:5000", "1:20", "1:2", "Escala natural 1:1"],
    correct_answer: "1:1000 a 1:5000",
    explanation:
      "O texto indica que maquetes de cunho urbanístico costumam adotar escalas entre 1:1000 e 1:5000 — voltadas ao entendimento geral da área, e não ao detalhamento individual de cada edificação, que exigiria escalas menores (mais próximas de 1).",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 2 — Instrumentos e materiais para maquetes
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u2", [
  {
    page: 5,
    difficulty: "easy",
    prompt: "Qual instrumento o texto também chama de \"bisturi de maquetes\", indicado para cortes bem precisos e pequenas incisões?",
    options: ["Estilete de precisão", "Alicate de bico fino", "Compasso", "Escalímetro"],
    correct_answer: "Estilete de precisão",
    explanation:
      "O texto descreve o estilete de precisão, também chamado de bisturi de maquetes, como o instrumento indicado para cortes bem precisos e pequenas incisões.",
  },
  {
    page: 5,
    difficulty: "easy",
    prompt:
      "Segundo o texto, qual material de régua deve ser evitado como apoio lateral ao cortar com estilete, por ser facilmente cortado pela própria lâmina?",
    options: ["Régua de acrílico", "Régua de metal", "Régua de madeira maciça", "Régua de aço inoxidável"],
    correct_answer: "Régua de acrílico",
    explanation:
      "O texto recomenda instrumentos-guia como réguas de metais, justamente porque as réguas de acrílico são facilmente cortadas pelas lâminas dos estiletes.",
  },
  {
    page: 10,
    difficulty: "medium",
    prompt:
      "Um estudante precisa cortar uma placa de material espesso para uma maquete. Segundo as recomendações do texto sobre a relação entre espessura do material e ferramenta de corte, qual é o cuidado correto?",
    options: [
      "Usar ferramentas de lâminas maiores, evitando tesouras e estiletes de precisão nesse caso",
      "Usar sempre o estilete de precisão, independentemente da espessura do material",
      "Usar apenas tesouras pequenas, que garantem mais controle em qualquer espessura",
      "A espessura do material não influencia a escolha da ferramenta de corte",
    ],
    correct_answer: "Usar ferramentas de lâminas maiores, evitando tesouras e estiletes de precisão nesse caso",
    explanation:
      "O texto afirma que materiais espessos geralmente devem ser cortados com ferramentas de lâminas maiores, não devendo ser cortados com tesouras nem com estiletes de precisão.",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 3 — Tipos e técnicas de maquetes arquitetônicas
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u3", [
  {
    page: 1,
    difficulty: "easy",
    prompt:
      "Segundo Ching (2013), citado no texto, qual é a sequência correta dos elementos primários que compõem as formas, do mais simples ao mais complexo?",
    options: [
      "Ponto, reta, plano e volume",
      "Volume, plano, reta e ponto",
      "Reta, ponto, volume e plano",
      "Plano, volume, ponto e reta",
    ],
    correct_answer: "Ponto, reta, plano e volume",
    explanation:
      "O texto explica que, para Ching, o ponto é uma posição no espaço; a reta é uma extensão do ponto; o plano é a extensão da reta; e planos articulados podem formar um volume.",
  },
  {
    page: 4,
    difficulty: "easy",
    prompt: "Segundo Mills (2007), citado no texto, em quantos grupos distintos podem ser consideradas as maquetes de estudo?",
    options: [
      "Dois — maquetes primárias e maquetes secundárias",
      "Três — topográficas, de edificações e específicas",
      "Quatro — idealização, trabalho, execução e apresentação",
      "Cinco",
    ],
    correct_answer: "Dois — maquetes primárias e maquetes secundárias",
    explanation:
      "O texto indica que, segundo Mills (2007), as maquetes de estudo podem ser consideradas pertencentes a dois grupos distintos: maquetes primárias e maquetes secundárias — uma classificação diferente da divisão em três grupos proposta por Knoll e Hechinger (2003).",
  },
  {
    page: 8,
    difficulty: "medium",
    prompt:
      "Uma equipe de projeto precisa estudar o terreno de intervenção — incluindo desníveis, platôs e arrimos — para decidir onde locar o edifício, antes de detalhar a edificação em si. Qual tipo de maquete secundária, descrita no texto, atende diretamente a esse objetivo?",
    options: ["Maquete de sítio ou de terreno", "Maquete de contexto", "Maquete de urbanismo", "Maquete de execução"],
    correct_answer: "Maquete de sítio ou de terreno",
    explanation:
      "O texto define a maquete de sítio (ou de terreno) como aquela feita para estudar o terreno e realizar a locação do edifício, incluindo o entendimento do desnível para criação de platôs, arrimos e taludes.",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 4 — Finalização e apresentação de maquetes
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u4", [
  {
    page: 3,
    difficulty: "easy",
    prompt:
      "Qual material o texto recomenda para representar telhados em maquetes, colado sobre uma base rígida, pela alta resistência e baixo custo?",
    options: ["Papel microondulado sobre papelão", "Tecido sobre isopor", "Massa corrida sobre madeira", "Papel kraft sobre acrílico"],
    correct_answer: "Papel microondulado sobre papelão",
    explanation:
      "O texto sugere empregar papel microondulado colado sobre um material rígido, recomendando o papelão pela alta resistência e baixo custo.",
  },
  {
    page: 7,
    difficulty: "easy",
    prompt:
      "Qual é o nome do laboratório de fabricação digital, idealizado e criado primeiramente pelo MIT (Massachusetts Institute of Technology), citado no texto como espaço de equipamentos como impressoras 3D e cortadoras a laser?",
    options: ["FabLab", "BIM", "CAD", "Ateliê Maker"],
    correct_answer: "FabLab",
    explanation:
      "O texto cita os laboratórios de fabricação digital — FabLab — idealizados e criados primeiramente pelo MIT nos Estados Unidos.",
  },
  {
    page: 4,
    difficulty: "medium",
    prompt:
      "Um maquetista quer inserir iluminação interna em uma maquete residencial usando mini LEDs movidos a pilha. Segundo as recomendações de segurança do texto, qual cuidado é indispensável nessa instalação?",
    options: [
      "Fixar os LEDs com fita isolante, mantê-los longe de materiais inflamáveis e acendê-los só por breves períodos",
      "Usar apenas lâmpadas incandescentes de alta potência, que são mais seguras",
      "Colar os LEDs diretamente sobre o EPS, sem qualquer isolamento",
      "Deixar os LEDs ligados continuamente por vários dias para testar o efeito de luz",
    ],
    correct_answer: "Fixar os LEDs com fita isolante, mantê-los longe de materiais inflamáveis e acendê-los só por breves períodos",
    explanation:
      "O texto recomenda fixar os LEDs cuidadosamente ao modelo com fitas isolantes, longe de materiais inflamáveis, e acesos por breves períodos, evitando o risco de superaquecimento e incêndio.",
  },
]);

print("Perguntas autorais (Claude) adicionadas às 4 lições de Maquetes.");
