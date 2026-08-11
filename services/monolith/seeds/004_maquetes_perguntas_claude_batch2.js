// Quarta leva de perguntas pra trilha "Maquetes" (track_s02_maquetes) — segunda rodada de autoria
// direta (Claude), complementando 002 (Gemini/Groq) e 003 (primeira leva Claude) nas mesmas 4
// unidades. Mesmo texto-fonte (Docs/ignorar/, 4 PDFs "Unidade 1-4").
//
// Motivação: depois da deduplicação de quase-duplicatas (29 perguntas removidas, todas na
// dificuldade "easy"), a distribuição ficou mais pesada em "medium"/"hard" do que o alvo
// 55/30/12/3 informado pelo usuário. Cada fato usado aqui foi conferido por busca direta no banco
// (regex sobre `prompt`) pra garantir que é genuinamente novo — não repete nenhuma pergunta já
// aprovada nas rodadas anteriores.
//
// Diferente de 002, as lições já existem — este script só ADICIONA perguntas a question_ids via
// $addToSet, sem sobrescrever nada.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/004_maquetes_perguntas_claude_batch2.js
// (idempotente: upsert por _id nas perguntas, $addToSet evita duplicar id em question_ids.)

const database = db.getSiblingDB("arqlearn");
const now = new Date();

function addQuestions(lessonId, questions) {
  const ids = [];
  questions.forEach((q, index) => {
    const _id = `${lessonId}_q_claude_b2_${String(index + 1).padStart(2, "0")}`;
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
    page: 4,
    difficulty: "easy",
    prompt:
      "Segundo o texto, por que é importante verificar a escala das peças vendidas em lojas de Hobbies antes de utilizá-las em uma maquete de arquitetura?",
    options: [
      "Porque essas lojas usam escalas próprias do universo de miniaturas (como 1:6, 1:12 ou 1:87), diferentes das usuais entre arquitetos",
      "Porque essas lojas só vendem peças na escala natural 1:1",
      "Porque as peças de lojas de Hobbies não podem ser coladas com cola PVA",
      "Porque a escala das peças de Hobbies é sempre idêntica à do projeto arquitetônico",
    ],
    correct_answer:
      "Porque essas lojas usam escalas próprias do universo de miniaturas (como 1:6, 1:12 ou 1:87), diferentes das usuais entre arquitetos",
    explanation:
      "O texto explica que lojas de Hobbies usam escalas próprias do universo das miniaturas (1:6, 1:12, 1:24, 1:4, 1:64, 1:87), por isso é preciso conferir se são equivalentes à escala da maquete.",
  },
  {
    page: 11,
    difficulty: "easy",
    prompt:
      "Segundo o texto, quais são os dois tipos principais de perspectivas utilizados para representar objetos tridimensionais em desenhos bidimensionais?",
    options: [
      "Cônicas (com ponto de fuga) e axonométricas (oblíquas e ortogonais)",
      "Isométricas e dimétricas apenas",
      "Militares e cavaleiras apenas",
      "Analógicas e digitais",
    ],
    correct_answer: "Cônicas (com ponto de fuga) e axonométricas (oblíquas e ortogonais)",
    explanation:
      "O texto lista dois tipos principais de perspectivas: cônicas (com ponto de fuga) e axonométricas, subdivididas em oblíquas (militar e cavaleira) e ortogonal (isométrica e dimétrica).",
  },
  {
    page: 11,
    difficulty: "medium",
    prompt:
      "Um estudante modela uma maquete digital no SketchUp e deseja gerar imagens finais com aparência fotorrealista, com iluminação e sombras realistas. Segundo o texto, qual recurso ele deve utilizar?",
    options: [
      "O plug-in de renderização V-Ray",
      "A ferramenta de exportação .STL",
      "O software Pepakura Designer",
      "A fresadora CNC",
    ],
    correct_answer: "O plug-in de renderização V-Ray",
    explanation:
      "O texto indica que, por meio do plug-in de renderização V-Ray, é possível realizar imagens realistas e com aspectos profissionais a partir de modelos feitos no SketchUp.",
  },
  {
    page: 21,
    difficulty: "impossible",
    prompt:
      "Heydarian et al. (2015), citados no texto, compararam uma sala comercial real com seu equivalente em Ambiente Virtual Imersivo. Qual foi o resultado observado nessa avaliação?",
    options: [
      "Um grau de semelhança muito grande, com forte senso de presencialidade por parte dos entrevistados",
      "Uma rejeição total do ambiente virtual pelos participantes",
      "Diferenças significativas de percepção espacial entre os dois ambientes",
      "A impossibilidade de reproduzir salas comerciais em RV",
    ],
    correct_answer: "Um grau de semelhança muito grande, com forte senso de presencialidade por parte dos entrevistados",
    explanation:
      "O texto cita que Heydarian et al. (2015) identificaram um grau de semelhança muito grande na avaliação comparativa entre a sala real e seu paralelo virtual, observando forte senso de presencialidade por parte dos entrevistados.",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 2 — Instrumentos e materiais para maquetes
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u2", [
  {
    page: 5,
    difficulty: "easy",
    prompt: "Segundo o texto, quais são os instrumentos básicos de desenho utilizados na execução de maquetes?",
    options: [
      "Lápis bem apontado (ou lapiseira), borracha, esquadros, compasso, curva francesa, escalímetro e régua metálica",
      "Apenas tesoura e cola branca",
      "Exclusivamente ferramentas elétricas de corte",
      "Softwares de modelagem tridimensional",
    ],
    correct_answer:
      "Lápis bem apontado (ou lapiseira), borracha, esquadros, compasso, curva francesa, escalímetro e régua metálica",
    explanation:
      "O texto lista os instrumentos básicos de desenho: lápis bem apontado ou lapiseiras de grafite fino, borracha, esquadros, compasso, curva francesa e escalímetro, régua metálica, estiletes e base de corte.",
  },
  {
    page: 12,
    difficulty: "easy",
    prompt:
      "Segundo o texto, quais são as duas siglas citadas para as placas de poliestireno utilizadas em maquetes, sendo o poliestireno expandido (EPS) a mais usual?",
    options: [
      "XPS (extrudado) e EPS (expandido)",
      "MDF e PVA",
      "ABS e PLA",
      "PVC e PET",
    ],
    correct_answer: "XPS (extrudado) e EPS (expandido)",
    explanation:
      "O texto cita as placas de XPS (poliestireno extrudado) e, mais usual, EPS (poliestireno expandido), ambas com diferentes densidades, formando o que comumente se chama de espuma.",
  },
  {
    page: 12,
    difficulty: "easy",
    prompt: "Como funciona a chamada cola-quente utilizada na confecção de maquetes, segundo o texto?",
    options: [
      "É um bastão de plástico que, aquecido em uma pistola, fica pastoso para aplicação e endurece novamente ao esfriar, fixando as peças",
      "É uma cola líquida que precisa de 24 horas para secar completamente",
      "É uma fita adesiva de dupla face resistente a altas temperaturas",
      "É um spray que substitui a necessidade de qualquer outro tipo de fixação",
    ],
    correct_answer:
      "É um bastão de plástico que, aquecido em uma pistola, fica pastoso para aplicação e endurece novamente ao esfriar, fixando as peças",
    explanation:
      "O texto descreve a cola-quente como uma espécie de plástico em bastão que, aquecido no interior de uma pistola, muda para o estado pastoso e, após secar sobre os materiais, endurece novamente, garantindo a fixação.",
  },
  {
    page: 21,
    difficulty: "medium",
    prompt:
      "Por que o texto recomenda cortar arames com alicates, evitando o uso de tesouras para essa função?",
    options: [
      "Porque cortar arames com tesouras desalinha o instrumento, podendo fazê-lo perder sua utilidade",
      "Porque tesouras não conseguem cortar nenhum tipo de metal",
      "Porque arames só podem ser cortados com estiletes de precisão",
      "Porque o uso de tesouras em arames é proibido por normas de segurança",
    ],
    correct_answer: "Porque cortar arames com tesouras desalinha o instrumento, podendo fazê-lo perder sua utilidade",
    explanation:
      "O texto afirma que arames são cortados com alicates, e que utilizar tesouras para cortá-los desalinha o instrumento, podendo fazê-lo perder sua utilidade.",
  },
  {
    page: 21,
    difficulty: "impossible",
    prompt: "Segundo o texto (MILLS, 2007), como deve ser trabalhado o corte de lâminas de plástico em maquetes?",
    options: [
      "Elas não são cortadas, mas riscadas com uma lâmina bem afiada e depois quebradas ao se apoiar o risco sobre uma borda dura",
      "São cortadas normalmente com tesoura em um único movimento",
      "Devem ser aquecidas antes de qualquer corte",
      "São sempre cortadas com cortadora a laser, nunca manualmente",
    ],
    correct_answer:
      "Elas não são cortadas, mas riscadas com uma lâmina bem afiada e depois quebradas ao se apoiar o risco sobre uma borda dura",
    explanation:
      "O texto, citando Mills (2007, p. 38), explica que lâminas de plástico não são cortadas, apenas riscadas com uma lâmina bem afiada; depois, a linha marcada é apoiada sobre uma borda dura e o plástico se quebra ao forçá-lo para baixo em ambos os lados.",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 3 — Tipos e técnicas de maquetes arquitetônicas
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u3", [
  {
    page: 3,
    difficulty: "easy",
    prompt:
      "Segundo o texto, as maquetes preliminares, que constituem a fase inicial das maquetes de estudo, são comparadas a quê?",
    options: [
      "Croquis ou desenhos tridimensionais",
      "Plantas baixas cotadas",
      "Memoriais descritivos",
      "Maquetes eletrônicas renderizadas",
    ],
    correct_answer: "Croquis ou desenhos tridimensionais",
    explanation:
      "O texto define as maquetes preliminares como a fase inicial das maquetes de estudo, comparando-as a croquis ou desenhos tridimensionais.",
  },
  {
    page: 12,
    difficulty: "easy",
    prompt:
      "Segundo o texto, por que o papel dobrado é útil para simular a resistência a cargas e esforços em elementos de uma maquete estrutural?",
    options: [
      "Porque as dobras no papel podem representar reforços estruturais presentes em materiais reais, como concreto e metal",
      "Porque o papel dobrado é impermeável",
      "Porque substitui totalmente a necessidade de cálculo estrutural profissional",
      "Porque o papel dobrado nunca se deforma sob peso",
    ],
    correct_answer:
      "Porque as dobras no papel podem representar reforços estruturais presentes em materiais reais, como concreto e metal",
    explanation:
      "O texto explica que, ao simular e entender a resistência a cargas e esforços, as dobras no papel podem representar reforços estruturais em materiais reais, como concreto e metal.",
  },
  {
    page: 12,
    difficulty: "medium",
    prompt:
      "Segundo o texto, qual é a limitação das análises de comportamento físico de geometrias realizadas com o auxílio de maquetes, se comparadas ao universo dos cálculos estruturais profissionais?",
    options: [
      "Essas análises são empíricas, enquanto os cálculos estruturais garantem estabilidade e segurança por meio de dimensionamentos e especificações",
      "As maquetes não podem representar nenhum tipo de estrutura",
      "Maquetes estruturais só podem ser feitas em escala 1:1",
      "Não há nenhuma limitação — os resultados são idênticos aos do cálculo estrutural",
    ],
    correct_answer:
      "Essas análises são empíricas, enquanto os cálculos estruturais garantem estabilidade e segurança por meio de dimensionamentos e especificações",
    explanation:
      "O texto alerta que as análises feitas com maquetes são empíricas quando comparadas ao universo dos cálculos estruturais, que garantem a estabilidade e a segurança das edificações por meio de dimensionamentos e especificações dos materiais.",
  },
  {
    page: 21,
    difficulty: "impossible",
    prompt:
      "O texto cita o trabalho de qual arquiteto como exemplo e inspiração de maquetes monocromáticas, por sua característica projetual de optar por uma arquitetura monocromática?",
    options: ["Richard Meier", "Frank Gehry", "Le Corbusier", "Oscar Niemeyer"],
    correct_answer: "Richard Meier",
    explanation:
      "O texto cita o trabalho do arquiteto Richard Meier, que possui diversos projetos de caráter institucional e tem como característica projetual a opção por uma arquitetura monocromática.",
  },
]);

// ---------------------------------------------------------------------------
// Unidade 4 — Finalização e apresentação de maquetes
// ---------------------------------------------------------------------------
addQuestions("lesson_maquetes_u4", [
  {
    page: 11,
    difficulty: "easy",
    prompt:
      "Segundo o texto, qual é o material mais comum utilizado como matéria-prima na impressão 3D por adição, derretido e depositado em camadas?",
    options: [
      "PLA (plástico de poliácido láctico)",
      "MDF (fibras de madeira aglomeradas)",
      "EPS (poliestireno expandido)",
      "Papel Kraft",
    ],
    correct_answer: "PLA (plástico de poliácido láctico)",
    explanation:
      "O texto explica que, na fabricação digital por adição, os materiais mais comuns utilizados como matéria-prima são os plásticos conhecidos como PLA (plástico de poliácido láctico).",
  },
  {
    page: 11,
    difficulty: "easy",
    prompt:
      "Segundo o texto, quais materiais inusitados podem ser utilizados para criar texturas de áreas verdes e paisagismo de arbustos em uma maquete?",
    options: [
      "Serragem ou erva-mate para áreas verdes, e fios de cobre ou alumínio para arbustos",
      "Apenas tinta verde sobre EPS",
      "Papel crepom colorido exclusivamente",
      "Gesso pigmentado de verde",
    ],
    correct_answer: "Serragem ou erva-mate para áreas verdes, e fios de cobre ou alumínio para arbustos",
    explanation:
      "O texto cita materiais inusitados como serragem ou erva-mate para áreas verdes, e fios de cobre ou alumínio para paisagismo de arbustos e estruturas de amarração em geral.",
  },
  {
    page: 21,
    difficulty: "impossible",
    prompt:
      "Segundo Grozdanic (2017), citado no texto, qual é a diferença entre Realidade Virtual (RV) e Realidade Aumentada (RA)?",
    options: [
      "A RV cria ambientes virtuais gerados e controlados digitalmente, enquanto a RA fornece elementos para sobrepô-los ao mundo real",
      "A RV é usada apenas em jogos, enquanto a RA é exclusiva da arquitetura",
      "A RA substitui totalmente o ambiente real, enquanto a RV apenas o complementa",
      "Não há diferença prática entre RV e RA, são termos sinônimos",
    ],
    correct_answer:
      "A RV cria ambientes virtuais gerados e controlados digitalmente, enquanto a RA fornece elementos para sobrepô-los ao mundo real",
    explanation:
      "O texto, citando Grozdanic (2017), define que a RV cria ambientes virtuais gerados e controlados digitalmente, enquanto a RA fornece elementos para sobrepô-la ao mundo real.",
  },
]);

print("Segunda leva de perguntas autorais (Claude) adicionada às 4 lições de Maquetes.");
