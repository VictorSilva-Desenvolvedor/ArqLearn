// Primeira lição + perguntas reais para 4 disciplinas do currículo (trilhas já criadas em
// 001_tracks_curriculo_unopar.js, ainda sem lição nenhuma), a partir do material fornecido pelo
// usuário em Docs/DocsFaculdade/ (apostilas por disciplina; pasta git-ignorada, não versionada —
// ver .gitignore).
//
// Diferente de 002 (Maquetes), as perguntas aqui foram escritas diretamente a partir do texto
// extraído dos PDFs (pdftotext), sem passar pelo AI Content Pipeline (Gemini) — mesmo espírito de
// "trilha curada", só que com um humano+IA de sessão de chat como fonte da geração em vez do
// pipeline automatizado. Segue as mesmas regras do Persona Prompt §4: só medium/hard, uma
// resposta correta inequívoca, source_excerpt_ref por página real (nunca alucinado), nada fora do
// que o trecho-fonte sustenta.
//
// Cobertura parcial de propósito (Unidade 1 de cada disciplina — ou Unidade 2 quando a Unidade 1
// é PDF escaneado sem texto extraível, caso de Informática/Projeções Ortogonais). As unidades
// restantes ficam como pendência — ver Docs/PENDENCIAS_IA.md.
//
// review_status "pending" em todas — mesma regra de 002, precisa rodar cmd/review-questions (ou
// aprovação manual equivalente) antes de aparecer numa sessão real.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/003_novas_materias_licoes_perguntas.js
// (idempotente via upsert por _id, como os anteriores; seguro rodar de novo.)

const database = db.getSiblingDB("arqlearn");
const now = new Date();

function upsertQuestions(lessonId, questions) {
  return questions.map((q, index) => {
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
    return _id;
  });
}

function upsertLesson(_id, trackId, title, questionIds) {
  database.lessons.updateOne(
    { _id },
    {
      $setOnInsert: {
        _id,
        track_id: trackId,
        title,
        difficulty: "medium",
        question_ids: questionIds,
        estimated_minutes: 8,
        created_at: now,
      },
      $set: { updated_at: now },
    },
    { upsert: true },
  );
}

// Adiciona a lição a track.units só se ainda não estiver referenciada em nenhuma unit — idempotente
// e seguro rodar de novo ou junto de futuras unidades da mesma trilha (não usa $set sobrescrevendo
// o array inteiro, ao contrário de 002, justamente pra permitir adição incremental sem clobber).
function ensureLessonInTrackUnits(trackId, lessonId, unitTitle) {
  const track = database.tracks.findOne({ _id: trackId }, { units: 1 });
  if (!track) {
    print(`AVISO: trilha ${trackId} não encontrada — rode 001_tracks_curriculo_unopar.js antes.`);
    return;
  }
  const units = track.units || [];
  const alreadyThere = units.some((u) => (u.lesson_ids || []).includes(lessonId));
  if (alreadyThere) return;

  const newUnit = {
    id: `unit_${lessonId}`,
    title: unitTitle,
    order: units.length + 1,
    lesson_ids: [lessonId],
  };
  database.tracks.updateOne(
    { _id: trackId },
    { $push: { units: newUnit }, $set: { updated_at: now } },
  );
}

// ---------------------------------------------------------------------------
// Construções Sustentáveis — Unidade 1 (páginas 4-7 da apostila)
// ---------------------------------------------------------------------------
const construcoesSustentaveis = {
  trackId: "track_s01_construcoes_sustentaveis",
  lessonId: "lesson_construcoes_sustentaveis_u1",
  unitTitle: "Unidade 1",
  questions: [
    {
      page: 4,
      difficulty: "medium",
      prompt:
        'O que caracteriza a "água servida" (águas cinzas) em oposição à "água fecal", segundo o texto?',
      options: [
        "Água servida inclui restos de alimentos e dejetos humanos, água fecal não",
        "Água servida é proveniente de lavatórios e máquinas de lavar e não inclui restos de alimentos ou dejetos humanos; água fecal inclui esses resíduos",
        "Não há distinção técnica entre os dois termos, são sinônimos",
        "Água fecal é usada exclusivamente para irrigação de jardins",
      ],
      correct_answer:
        "Água servida é proveniente de lavatórios e máquinas de lavar e não inclui restos de alimentos ou dejetos humanos; água fecal inclui esses resíduos",
      explanation:
        "O texto define água servida (proveniente de lavatórios, máquinas de lavar etc.) como aquela que não inclui restos de alimentos ou dejetos humanos — o que caracteriza a água fecal.",
    },
    {
      page: 4,
      difficulty: "hard",
      prompt:
        "Segundo o texto, quais condições são necessárias para que um sistema de reúso de água servida seja viável técnica e economicamente?",
      options: [
        "Espaço suficiente para infraestrutura independente (tubulação e tanques) e consumo suficiente de água potável para gerar volume adequado de água servida",
        "Apenas a aprovação do CAU e um projeto assinado por engenheiro sanitarista",
        "Uso exclusivo de água de chuva, sem necessidade de tubulação separada",
        "Redução total do consumo de água potável a zero",
      ],
      correct_answer:
        "Espaço suficiente para infraestrutura independente (tubulação e tanques) e consumo suficiente de água potável para gerar volume adequado de água servida",
      explanation:
        "O texto afirma que a viabilidade técnica exige espaço para tubulação independente e tanques de tratamento, e a viabilidade econômica exige consumo suficiente de água potável para gerar volume adequado de água servida.",
    },
    {
      page: 5,
      difficulty: "medium",
      prompt:
        "De acordo com Keeler e Burke (2010), citados no texto, qual prática de manejo de águas pluviais consiste em filtrar a água da chuva através de plantas, em vez do solo?",
      options: ["Infiltração", "Biofiltragem", "Detenção", "Sedimentação"],
      correct_answer: "Biofiltragem",
      explanation:
        'O texto explica que "a biofiltragem faz com que a água da chuva seja filtrada através de plantas em vez do solo", diferenciando-a da infiltração (que usa o solo).',
    },
    {
      page: 5,
      difficulty: "hard",
      prompt:
        "Por que o texto indica que solos com taxas de infiltração muito altas são problemáticos para a prática de infiltração de água pluvial?",
      options: [
        "Porque encarecem a obra",
        "Porque liberam a água da chuva diretamente no lençol freático sem filtrar os poluentes antes do contato",
        "Porque impedem completamente a absorção da água",
        "Porque exigem bacias de detenção obrigatórias",
      ],
      correct_answer:
        "Porque liberam a água da chuva diretamente no lençol freático sem filtrar os poluentes antes do contato",
      explanation:
        "O texto afirma que solos com taxas de infiltração altas liberam a água diretamente no lençol freático sem filtragem prévia dos poluentes — o extremo oposto (taxas muito baixas) sequer absorve a água.",
    },
    {
      page: 6,
      difficulty: "medium",
      prompt:
        "Segundo o texto, por que a instalação de sistemas de reúso de água costuma ser mais vantajosa em obras novas do que em edificações já em uso?",
      options: [
        "Porque edificações em uso não podem ter espaço para reservatórios",
        "Porque a implantação em edifícios existentes geralmente exige quebra de pisos e paredes, gerando desconforto aos usuários, enquanto em obras novas a relação custo-benefício costuma ser vantajosa",
        "Porque a legislação proíbe reúso de água em prédios antigos",
        "Porque água de chuva só pode ser captada em telhados novos",
      ],
      correct_answer:
        "Porque a implantação em edifícios existentes geralmente exige quebra de pisos e paredes, gerando desconforto aos usuários, enquanto em obras novas a relação custo-benefício costuma ser vantajosa",
      explanation:
        'O texto diz que a implantação em edificações em uso "requer a quebra de pisos e de paredes... o que gera desconforto aos usuários", enquanto em obras novas "a relação custo-benefício... comumente é vantajosa".',
    },
    {
      page: 7,
      difficulty: "hard",
      prompt:
        'Segundo Keeler e Burke (2010), como o texto define "projeto de baixo impacto" em relação ao manejo de águas pluviais?',
      options: [
        "Um projeto que elimina totalmente o uso de água potável",
        "Aquele que inclui o manejo das águas pluviais no planejamento e projeto urbano, promovendo uma abordagem completa baseada em bacias de drenagem",
        "Um projeto que usa exclusivamente grelhas plásticas",
        "Um projeto que reduz o número de pavimentos da edificação",
      ],
      correct_answer:
        "Aquele que inclui o manejo das águas pluviais no planejamento e projeto urbano, promovendo uma abordagem completa baseada em bacias de drenagem",
      explanation:
        'O texto define, citando Keeler e Burke (2010), que "o projeto de baixo impacto é aquele que inclui o manejo das águas pluviais no planejamento e projeto urbano, com a finalidade de promover uma abordagem completa, baseada em bacias de drenagem".',
    },
  ],
};

// ---------------------------------------------------------------------------
// Desenho de Arquitetura e Urbanismo — Unidade 1 (páginas 11-14 da apostila)
// ---------------------------------------------------------------------------
const desenhoArquiteturaUrbanismo = {
  trackId: "track_s02_desenho_arquitetura_urbanismo",
  lessonId: "lesson_desenho_arquitetura_urbanismo_u1",
  unitTitle: "Unidade 1",
  questions: [
    {
      page: 11,
      difficulty: "medium",
      prompt: "Qual é a função da platibanda em uma cobertura, segundo o texto?",
      options: [
        "Captar água da chuva para reúso",
        "É a continuação das paredes externas com o objetivo de esconder a cobertura, encobrindo as telhas",
        "Substituir a necessidade de calhas",
        "Proteger as terças de apoio contra chuva e entrada de animais",
      ],
      correct_answer:
        "É a continuação das paredes externas com o objetivo de esconder a cobertura, encobrindo as telhas",
      explanation:
        'O texto define platibanda como "a continuação das paredes externas, com o objetivo de esconder a cobertura", com as telhas ficando encobertas pela extensão da parede (a opção do terminal para beiral descreve outro elemento, citado antes no texto).',
    },
    {
      page: 11,
      difficulty: "hard",
      prompt:
        "Segundo Cardoso (2000), citado no texto, em que sentido deve se iniciar a colocação das telhas e por quê?",
      options: [
        "Da cumeeira para o beiral, no mesmo sentido dos ventos dominantes",
        "Do beiral para a cumeeira, no sentido oposto ao dos ventos dominantes na região",
        "De forma aleatória, sem relação com os ventos",
        "Sempre de leste para oeste, independentemente da região",
      ],
      correct_answer:
        "Do beiral para a cumeeira, no sentido oposto ao dos ventos dominantes na região",
      explanation:
        'O texto afirma que "a colocação das telhas geralmente se inicia do beiral para a cumeeira, no sentido oposto ao dos ventos dominantes na região".',
    },
    {
      page: 12,
      difficulty: "medium",
      prompt: "Por que o texto recomenda posicionar as telhas simultaneamente em todas as águas do telhado?",
      options: [
        "Para acelerar a obra",
        "Para que o peso das telhas seja distribuído uniformemente sobre a estrutura de madeira",
        "Para evitar o uso de escoras",
        "Porque é uma exigência da NBR 9050",
      ],
      correct_answer: "Para que o peso das telhas seja distribuído uniformemente sobre a estrutura de madeira",
      explanation:
        'O texto recomenda a colocação simultânea "para que o seu peso seja distribuído de uniformemente sobre a estrutura de madeira".',
    },
    {
      page: 13,
      difficulty: "hard",
      prompt: "Qual desvantagem o texto associa à telha cerâmica, além do alto custo e peso?",
      options: [
        "Baixo conforto termoacústico",
        "Necessidade de maior altura disponível para instalação do telhado, o que pode ser um problema com legislação que limite a altura final da construção",
        "Impossibilidade de uso em climas quentes",
        "Inclinação obrigatória acima de 50%",
      ],
      correct_answer:
        "Necessidade de maior altura disponível para instalação do telhado, o que pode ser um problema com legislação que limite a altura final da construção",
      explanation:
        'O texto diz que a telha cerâmica "requer maior altura disponível para instalação do telhado, o que pode ser um problema caso exista algum elemento ou legislação que limite a altura final da construção".',
    },
    {
      page: 13,
      difficulty: "medium",
      prompt: "Qual a faixa de inclinação recomendada para telhados com telha cerâmica, segundo o texto?",
      options: ["Entre 5% e 10%", "Entre 10% e 25%", "Entre 25% e 35%", "Acima de 50%"],
      correct_answer: "Entre 25% e 35%",
      explanation:
        'O texto afirma que as telhas cerâmicas "oferecem boas condições de conforto termoacústico, com inclinação entre 25% e 35%".',
    },
    {
      page: 14,
      difficulty: "medium",
      prompt: "Segundo o texto, qual é a principal vantagem da telha de fibrocimento em relação à telha cerâmica?",
      options: [
        "Melhor desempenho termoacústico",
        "É mais leve, tem custo menor e é mais fácil de manusear e instalar, exigindo estrutura de sustentação mais leve",
        "Estética mais agradável",
        "Maior durabilidade",
      ],
      correct_answer:
        "É mais leve, tem custo menor e é mais fácil de manusear e instalar, exigindo estrutura de sustentação mais leve",
      explanation:
        'O texto afirma que as telhas de fibrocimento "são mais leves do que as telhas cerâmicas e têm um custo menor, são mais fáceis de manusear e instalar e exigem uma estrutura de sustentação mais leve", ressalvando que "seu desempenho termoacústico é baixo e sua estética não é agradável".',
    },
  ],
};

// ---------------------------------------------------------------------------
// Atelier de Projeto de Arquitetura Cultural — Unidade 1 (páginas 3-6 da apostila)
// ---------------------------------------------------------------------------
const projetoArquiteturaCultural = {
  trackId: "track_s03_projeto_arquitetura_cultural",
  lessonId: "lesson_projeto_arquitetura_cultural_u1",
  unitTitle: "Unidade 1",
  questions: [
    {
      page: 3,
      difficulty: "medium",
      prompt:
        "Segundo Neufert (2013), citado no texto, por que compreender a topografia é especialmente importante em projetos culturais situados em parques, centros históricos ou áreas simbólicas?",
      options: [
        "Porque reduz o custo da obra",
        "Porque compreender a topografia é compreender a lógica do assentamento arquitetônico, exigindo decisões sensíveis de implantação, drenagem e acessibilidade",
        "Porque dispensa o uso de maquetes físicas",
        "Porque é uma exigência exclusiva do Plano Diretor Municipal",
      ],
      correct_answer:
        "Porque compreender a topografia é compreender a lógica do assentamento arquitetônico, exigindo decisões sensíveis de implantação, drenagem e acessibilidade",
      explanation:
        'O texto afirma, citando Neufert (2013), que "compreender a topografia é compreender a lógica do assentamento arquitetônico", algo essencial nesses cenários que "exigem decisões sensíveis de implantação, drenagem e acessibilidade".',
    },
    {
      page: 3,
      difficulty: "hard",
      prompt:
        "De acordo com Knoll e Hechinger (2003), citados no texto, o que o trabalho manual de construção da maquete devolve ao arquiteto?",
      options: [
        "A capacidade de calcular custos com precisão",
        "A dimensão sensorial do espaço — textura, profundidade e escala tornam-se mais perceptíveis quando materializadas em camadas físicas",
        "A aprovação automática de órgãos de patrimônio",
        "A dispensa do uso de softwares de modelagem digital",
      ],
      correct_answer:
        "A dimensão sensorial do espaço — textura, profundidade e escala tornam-se mais perceptíveis quando materializadas em camadas físicas",
      explanation:
        'O texto afirma que "Knoll e Hechinger (2003) argumentam que o trabalho manual devolve ao arquiteto a dimensão sensorial do espaço: textura, profundidade e escala tornam-se mais perceptíveis quando materializadas em camadas físicas".',
    },
    {
      page: 4,
      difficulty: "medium",
      prompt:
        "Segundo Ching (2013), citado no texto, qual a vantagem da modelagem física ao estudar a topografia de projetos culturais?",
      options: [
        "Permite visualizar as relações entre terreno e edifício de modo imediato e intuitivo, fundamental na tomada de decisão arquitetônica",
        "Elimina a necessidade de visitar o terreno",
        "Substitui integralmente o uso de plantas baixas",
        "É exigida pela NBR 9050",
      ],
      correct_answer:
        "Permite visualizar as relações entre terreno e edifício de modo imediato e intuitivo, fundamental na tomada de decisão arquitetônica",
      explanation:
        'O texto diz que "Ching (2013) enfatiza que a modelagem física permite visualizar essas relações de modo imediato e intuitivo, algo fundamental na tomada de decisão arquitetônica".',
    },
    {
      page: 5,
      difficulty: "hard",
      prompt:
        "Segundo o texto, além de revelar a atmosfera espacial, que tipo de problemas a maquete física ajuda a expor nas fases iniciais do projeto?",
      options: [
        "Apenas problemas orçamentários",
        "Conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade",
        "Somente problemas de iluminação artificial",
        "Exclusivamente questões de sustentabilidade energética",
      ],
      correct_answer:
        "Conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade",
      explanation:
        'O texto afirma que "a maquete revela problemas ocultos que raramente aparecem em desenhos: conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade".',
    },
    {
      page: 5,
      difficulty: "medium",
      prompt:
        "Segundo Littlefield (2014), citado no texto, por que a simulação de fluxos (percursos, entradas, rampas, escadas, foyers) é vital em edifícios culturais?",
      options: [
        "Porque reduz o número de pavimentos necessários",
        "Porque espaços de grande público dependem dessa leitura antecipada para garantir fluidez, conforto e segurança",
        "Porque é uma exigência exclusiva de museus",
        "Porque substitui a necessidade de rampas de acessibilidade",
      ],
      correct_answer:
        "Porque espaços de grande público dependem dessa leitura antecipada para garantir fluidez, conforto e segurança",
      explanation:
        'O texto conclui que "espaços de grande público dependem dessa leitura antecipada para garantir fluidez, conforto e segurança (Littlefield, 2014)".',
    },
    {
      page: 6,
      difficulty: "medium",
      prompt:
        "No desafio prático apresentado no texto (projeto de um centro de artes e eventos), quais normas da ABNT são explicitamente citadas como exigência a ser atendida?",
      options: [
        "NBR 6118 e NBR 8800",
        "NBR 6492 e NBR 9050",
        "NBR 15575, apenas",
        "Nenhuma norma é citada",
      ],
      correct_answer: "NBR 6492 e NBR 9050",
      explanation:
        'O desafio pede que a equipe elabore as plantas "atendendo às normas da ABNT (NBR 6492 e NBR 9050) e às exigências do Plano Diretor Municipal".',
    },
  ],
};

// ---------------------------------------------------------------------------
// Informática Aplicada à Arquitetura e Urbanismo - Projeções Ortogonais — Unidade 2
// (páginas 5-8 da apostila; Unidade 1 é PDF escaneado, sem texto extraível — ver PENDENCIAS_IA.md)
// ---------------------------------------------------------------------------
const informaticaProjecoesOrtogonais = {
  trackId: "track_s03_informatica_projecoes_ortogonais",
  lessonId: "lesson_informatica_projecoes_ortogonais_u2",
  unitTitle: "Unidade 2",
  questions: [
    {
      page: 5,
      difficulty: "medium",
      prompt: "Segundo o texto, o que é um arquivo CTB no AutoCAD?",
      options: [
        "Um arquivo que armazena backups automáticos do desenho",
        "Um arquivo de configuração que define como cada cor do desenho será impressa (espessura de linha, se sai em preto/cinza/cor, transparência e qualidade)",
        "Um plugin de renderização 3D",
        "Um formato de exportação para PDF",
      ],
      correct_answer:
        "Um arquivo de configuração que define como cada cor do desenho será impressa (espessura de linha, se sai em preto/cinza/cor, transparência e qualidade)",
      explanation:
        'O texto define: "O CTB é um arquivo de configuração que define como cada cor do desenho será impressa. Ou seja, ele determina: a espessura das linhas... se a cor será impressa em preto, em escala de cinza ou na própria cor... a transparência... a qualidade da impressão".',
    },
    {
      page: 5,
      difficulty: "hard",
      prompt:
        "Segundo Baldam, Costa e Oliveira (2015), citados no texto, qual é a função central que o CTB garante para a apresentação de um desenho a clientes, professores ou órgãos técnicos?",
      options: [
        "A velocidade de plotagem",
        "A legibilidade da prancha, garantindo que o desenho fique claro e fácil de interpretar",
        "A redução do tamanho do arquivo",
        "A conversão automática para escala métrica",
      ],
      correct_answer: "A legibilidade da prancha, garantindo que o desenho fique claro e fácil de interpretar",
      explanation:
        'O texto afirma: "O CTB controla a legibilidade da prancha. Ele é responsável por garantir que o desenho fique claro e fácil de interpretar... (Baldam; Costa; Oliveira, 2015)".',
    },
    {
      page: 6,
      difficulty: "medium",
      prompt:
        "Segundo Oliveira, Baldam e Costa (2012), como funciona a lógica de atribuição de espessura de linha num CTB no AutoCAD?",
      options: [
        "A espessura é definida manualmente traço por traço",
        "Cada cor do desenho corresponde a uma configuração de impressão (espessura, aparência) pré-definida na tabela CTB",
        "A espessura é fixa e igual para todas as cores",
        "Depende exclusivamente do tipo de camada (layer)",
      ],
      correct_answer:
        "Cada cor do desenho corresponde a uma configuração de impressão (espessura, aparência) pré-definida na tabela CTB",
      explanation:
        'O texto explica que "cada cor corresponde a uma configuração de impressão (Oliveira; Baldam; Costa, 2012)" — exemplificado na Tabela 1, em que cada cor (Vermelho, Amarelo, Cinza, Azul escuro) tem espessura e aparência de impressão próprias.',
    },
    {
      page: 6,
      difficulty: "hard",
      prompt: "De acordo com a Tabela 1 do texto, qual é a espessura de linha configurada para a cor 8 (Cinza)?",
      options: ["0.15 mm", "0.10 mm", "0.40 mm", "0.25 mm"],
      correct_answer: "0.40 mm",
      explanation: 'A Tabela 1 do texto lista: "8 (Cinza) Preto espesso 0.40 mm".',
    },
    {
      page: 7,
      difficulty: "medium",
      prompt:
        "Segundo o texto, quais são os passos iniciais para criar ou editar um estilo de plotagem (CTB) no AutoCAD?",
      options: [
        'Abrir o Layer Manager e clicar em "Novo CTB"',
        "Ir até Plot (Ctrl+P), selecionar Plot Style Table (CTB) e clicar em New (criar) ou Edit (alterar)",
        "Exportar o desenho para PDF e editar as cores no Photoshop",
        "Usar o comando PURGE antes de qualquer configuração",
      ],
      correct_answer:
        "Ir até Plot (Ctrl+P), selecionar Plot Style Table (CTB) e clicar em New (criar) ou Edit (alterar)",
      explanation:
        'O texto lista os passos: "Vá até Plot (Ctrl + P). Selecione Plot Style Table (CTB)... Clique em New, para criar, ou Edit, para alterar um existente."',
    },
    {
      page: 8,
      difficulty: "hard",
      prompt:
        "Segundo o texto, além de Lineweight (espessura) e Color (cor de saída), quais outras duas configurações estão disponíveis para cada cor na janela do CTB?",
      options: [
        "Layer e Linetype",
        "Dithering/Grayscale (escala de cinza) e Screening (intensidade da tinta)",
        "Zoom e Pan",
        "Hatch e Fill",
      ],
      correct_answer: "Dithering/Grayscale (escala de cinza) e Screening (intensidade da tinta)",
      explanation:
        'O texto lista, para cada cor na janela do CTB: "Lineweight (Espessura da linha), Color (Cor de saída), Dithering / Grayscale (Escala de cinza), Screening (Intensidade da tinta)".',
    },
  ],
};

const disciplinas = [
  construcoesSustentaveis,
  desenhoArquiteturaUrbanismo,
  projetoArquiteturaCultural,
  informaticaProjecoesOrtogonais,
];

let totalQuestions = 0;
disciplinas.forEach((d) => {
  const questionIds = upsertQuestions(d.lessonId, d.questions);
  upsertLesson(d.lessonId, d.trackId, d.unitTitle, questionIds);
  ensureLessonInTrackUnits(d.trackId, d.lessonId, d.unitTitle);
  totalQuestions += d.questions.length;
});

print(`${disciplinas.length} lições processadas, ${totalQuestions} perguntas (pending — rodar cmd/review-questions antes de ficarem jogáveis).`);
