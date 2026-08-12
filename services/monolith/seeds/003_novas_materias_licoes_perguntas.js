// Lições + perguntas reais para Unidade 1 de 4 novas disciplinas, a partir do material
// fornecido pelo usuário em Docs/DocsFaculdade/ (apostilas por disciplina, pasta git-ignorada —
// mesmo tratamento de Docs/ignorar/, repositório é público).
//
// IMPORTANTE — numeração real das unidades: os PDFs de cada disciplina NÃO seguem a ordem
// alfabética do nome do arquivo (UUID). Cada apostila declara sua própria "Unidade N" na capa —
// confirmado lendo a primeira página de cada PDF antes de escrever as perguntas. O PDF mais
// acessível de cada uma das 4 disciplinas (usado aqui) corresponde às unidades abaixo, não
// necessariamente "Unidade 1":
//   - Construções Sustentáveis -> Unidade 3 (Uso dos Recursos Naturais e Resíduos da Construção)
//   - Desenho de Arquitetura e Urbanismo -> Unidade 4 (Coberturas, Elementos Verticais, Detalhamentos)
//   - Atelier de Projeto de Arquitetura Cultural -> Unidade 4 (Apresentação e detalhamento do anteprojeto)
//   - Informática Aplicada... Projeções Ortogonais -> Unidade 4 (Configurando impressão e plotagem;
//     a Unidade 1 dessa disciplina é PDF escaneado sem texto extraível, ver PENDENCIAS_IA.md #4)
//
// As perguntas foram escritas diretamente a partir do texto extraído dos PDFs (pdftotext), sem
// passar pelo AI Content Pipeline (Gemini) — mesmas regras do Persona Prompt §4: source_ref real
// por página, só medium/hard (com uma pitada de easy em definições diretas), resposta única
// inequívoca, nada além do que o trecho-fonte sustenta. Todo correct_answer foi validado
// programaticamente contra as options (bate exatamente, sem duplicata) antes de entrar aqui —
// mesma checagem que geminiclient.Validate() faria, evitando o bug de "correct_answer não bate
// com nenhuma option" já documentado no CLAUDE.md.
//
// review_status "pending" em todas — mesma regra de Maquetes (002): precisa cmd/review-questions
// (ou aprovação manual equivalente) antes de aparecer numa sessão real. Uma vez aprovadas, entram
// automaticamente no Modo Infinito (reaproveita pool "approved" por tracks.topic, já existente).
//
// Cobertura parcial de propósito — só a unidade acima de cada disciplina. As unidades restantes
// (a maioria de cada uma tem 4 PDFs no total) ficam como pendência, ver PENDENCIAS_IA.md #4.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/003_novas_materias_licoes_perguntas.js
// (idempotente via upsert por _id, como os seeds anteriores; seguro rodar de novo.)

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

// Adiciona a lição a track.units só se ainda não estiver referenciada em nenhuma unit —
// idempotente e seguro rodar de novo ou junto de futuras unidades da mesma trilha (usa $push,
// não $set sobrescrevendo o array inteiro, pra permitir adição incremental sem clobber).
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
// track_s01_construcoes_sustentaveis — Unidade 3 — Uso dos Recursos Naturais e a Geração de Resíduos da Construção Civil
// ---------------------------------------------------------------------------
const construcoesSustentaveis = {
  trackId: "track_s01_construcoes_sustentaveis",
  lessonId: "lesson_construcoes_sustentaveis_u3",
  unitTitle: "Unidade 3 — Uso dos Recursos Naturais e a Geração de Resíduos da Construção Civil",
  questions: [
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Bassoi e Guazelli (2004), citados no texto, o que caracteriza a categoria de \"poluição natural\" da água?",
    "options": [
      "Ocorre por meio do arraste da água da chuva, carregada com partículas orgânicas e inorgânicas do solo, resíduos de animais silvestres e vegetação",
      "É causada exclusivamente por esgotos industriais não tratados",
      "É a categoria de maior incidência de poluição hídrica no Brasil",
      "Resulta do uso de defensivos agrícolas em grandes plantações"
    ],
    "correct_answer": "Ocorre por meio do arraste da água da chuva, carregada com partículas orgânicas e inorgânicas do solo, resíduos de animais silvestres e vegetação",
    "explanation": "O texto define: \"a poluição natural, que ocorre por meio do arraste da água da chuva, a qual é carregada com partículas orgânicas e inorgânicas do solo, além de resíduos de animais silvestres e folhas ou galhos da vegetação\"."
  },
  {
    "page": 2,
    "difficulty": "hard",
    "prompt": "Segundo o texto, por que a poluição causada por esgotos sanitários é considerada a de maior incidência entre as categorias de poluição hídrica?",
    "options": [
      "Porque altera as características biológicas e físico-químicas da água, sendo gerada em residências, indústrias, comércios e serviços",
      "Porque afeta exclusivamente áreas rurais",
      "Porque é a única categoria regulada por norma técnica",
      "Porque ocorre apenas em períodos de chuva intensa"
    ],
    "correct_answer": "Porque altera as características biológicas e físico-químicas da água, sendo gerada em residências, indústrias, comércios e serviços",
    "explanation": "O texto diz que a poluição por esgotos sanitários \"apresenta, segundo os autores, a maior incidência de poluição hídrica\" e \"altera as características biológicas e físico-químicas da água\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo a Portaria nº 518/2004 do Ministério da Saúde, citada no texto, em que condição a água potável pode ser usada na construção civil?",
    "options": [
      "Sem restrição",
      "Somente após laudo de engenheiro sanitarista",
      "Apenas em obras públicas",
      "Somente misturada com água pluvial"
    ],
    "correct_answer": "Sem restrição",
    "explanation": "O texto afirma que \"a água potável... pode ser usada sem restrição na construção civil\", diferente da água de fontes subterrâneas ou captação pluvial, que exige monitoramento de qualidade."
  },
  {
    "page": 3,
    "difficulty": "hard",
    "prompt": "O que a norma NBR 15900, criada pelo Comitê Brasileiro de Cimento, Concreto e Agregados (ABNT/CB-18), estabelece segundo o texto?",
    "options": [
      "Os requisitos de resistência do concreto armado",
      "A classificação da água em função de sua origem e os requisitos para uso na preparação de concreto",
      "O prazo de validade de cimentos e argamassas",
      "Os padrões de acessibilidade de canteiros de obra"
    ],
    "correct_answer": "A classificação da água em função de sua origem e os requisitos para uso na preparação de concreto",
    "explanation": "O texto diz que a NBR 15900 \"apresenta a classificação da água em função de sua origem e estabelece os requisitos a serem obedecidos para que possa ser utilizada na preparação de concreto\"."
  },
  {
    "page": 4,
    "difficulty": "easy",
    "prompt": "Segundo o texto, o que diferencia \"água servida\" (água cinza) de \"água fecal\"?",
    "options": [
      "Água servida corresponde ao esgoto sanitário de chuveiros, lavatórios e máquinas de lavar; água fecal inclui restos de alimentos ou dejetos humanos",
      "São termos sinônimos no texto",
      "Água fecal é sempre potável após tratamento simples",
      "Água servida só existe em edificações comerciais"
    ],
    "correct_answer": "Água servida corresponde ao esgoto sanitário de chuveiros, lavatórios e máquinas de lavar; água fecal inclui restos de alimentos ou dejetos humanos",
    "explanation": "O texto define a \"água servida\" como o esgoto de chuveiros, lavatórios e máquinas de lavar, sem restos de alimentos ou dejetos humanos — se incluir esses resíduos, é chamada \"água fecal\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Keeler e Burke (2010), citados no texto, o que caracteriza a biofiltragem como prática de manejo de águas pluviais?",
    "options": [
      "A água da chuva é filtrada através de plantas, em vez do solo",
      "A água é armazenada em cisternas por longos períodos",
      "Consiste em bombear a água para estações de tratamento centralizadas",
      "É aplicável apenas em telhados verdes"
    ],
    "correct_answer": "A água da chuva é filtrada através de plantas, em vez do solo",
    "explanation": "O texto explica que \"a biofiltragem faz com que a água da chuva seja filtrada através de plantas em vez do solo\"."
  },
  {
    "page": 5,
    "difficulty": "hard",
    "prompt": "Por que o texto considera perigosos tanto solos com taxas de infiltração muito altas quanto muito baixas, no contexto de manejo pluvial?",
    "options": [
      "Solos com infiltração alta liberam água no lençol freático sem filtrar poluentes; solos com infiltração muito baixa nem chegam a absorver a água",
      "Ambos os casos exigem o mesmo tipo de bacia de detenção",
      "Solos com infiltração alta encarecem a obra; os de infiltração baixa não têm esse problema",
      "Apenas solos de infiltração baixa representam risco real"
    ],
    "correct_answer": "Solos com infiltração alta liberam água no lençol freático sem filtrar poluentes; solos com infiltração muito baixa nem chegam a absorver a água",
    "explanation": "O texto afirma que solos com taxas de infiltração altas \"liberam a água da chuva diretamente no lençol freático, sem filtrar os poluentes\", enquanto \"solos com taxas de infiltração muito baixas nem chegam a absorver a água\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Leal (2000 apud May, 2004), citado no texto, como a água de chuva é normalmente coletada no funcionamento do sistema de aproveitamento pluvial?",
    "options": [
      "Por meio de áreas impermeáveis, normalmente telhados, seguida de filtragem e armazenamento em reservatórios",
      "Diretamente do solo, sem qualquer filtragem",
      "Apenas por meio de poços artesianos",
      "Exclusivamente por caminhões-pipa"
    ],
    "correct_answer": "Por meio de áreas impermeáveis, normalmente telhados, seguida de filtragem e armazenamento em reservatórios",
    "explanation": "O texto afirma que \"ela é coletada por meio de áreas impermeáveis, normalmente telhados. Em seguida, passa por um processo de filtragem e é armazenada em reservatórios para distribuição\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que a instalação de sistemas de reúso de água em edificações já em uso costuma gerar mais desconforto que em obras novas?",
    "options": [
      "Porque geralmente requer a quebra de pisos e paredes para passagem de tubulação e instalação de tanques",
      "Porque exige interrupção total do fornecimento de água por meses",
      "Porque a legislação proíbe reformas hidráulicas em prédios ocupados",
      "Porque encarece o seguro predial"
    ],
    "correct_answer": "Porque geralmente requer a quebra de pisos e paredes para passagem de tubulação e instalação de tanques",
    "explanation": "O texto afirma que a implantação em edifícios em uso \"requer a quebra de pisos e de paredes para a passagem de tubulação e instalação de tanques, o que gera desconforto aos usuários\"."
  },
  {
    "page": 7,
    "difficulty": "hard",
    "prompt": "Segundo Keeler e Burke (2010), citados no texto, o que caracteriza o \"projeto de baixo impacto\" no manejo de águas pluviais?",
    "options": [
      "Inclui o manejo das águas pluviais no planejamento e projeto urbano, promovendo uma abordagem completa baseada em bacias de drenagem",
      "Reduz o número de pavimentos permitidos por lote",
      "Elimina totalmente o uso de pavimentação impermeável",
      "É aplicável somente a edificações públicas"
    ],
    "correct_answer": "Inclui o manejo das águas pluviais no planejamento e projeto urbano, promovendo uma abordagem completa baseada em bacias de drenagem",
    "explanation": "O texto define que \"o projeto de baixo impacto é aquele que inclui o manejo das águas pluviais no planejamento e projeto urbano... baseada em bacias de drenagem\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "Segundo Kwok e Grondzik (2013), citados no texto, para que tipo de carga os sistemas de grelhas plásticas permeáveis são projetados?",
    "options": [
      "Cargas de pedestres ou tráfego leve",
      "Tráfego pesado de caminhões",
      "Apenas cargas estáticas de mobiliário urbano",
      "Cargas de aeronaves em pistas de pouso"
    ],
    "correct_answer": "Cargas de pedestres ou tráfego leve",
    "explanation": "O texto afirma que \"os sistemas de grelhas plásticas são projetados para suportar cargas de pedestres ou tráfego leve\"."
  },
  {
    "page": 8,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que tipo de uso são indicados os pavimentos asfálticos porosos?",
    "options": [
      "Estradas e estacionamentos",
      "Exclusivamente calçadas residenciais",
      "Pistas de aeroportos apenas",
      "Coberturas de edifícios"
    ],
    "correct_answer": "Estradas e estacionamentos",
    "explanation": "O texto afirma que \"os pavimentos asfálticos porosos são indicados para estradas e estacionamentos\"."
  },
  {
    "page": 8,
    "difficulty": "hard",
    "prompt": "Segundo o texto, como são construídos os pavimentos de blocos porosos?",
    "options": [
      "Com elementos interconectados de tijolo, pedra ou concreto, instalados sobre base de agregado convencional com leito de areia",
      "Com uma única laje monolítica de concreto poroso",
      "Com placas metálicas perfuradas sobre solo compactado",
      "Exclusivamente com blocos plásticos reciclados"
    ],
    "correct_answer": "Com elementos interconectados de tijolo, pedra ou concreto, instalados sobre base de agregado convencional com leito de areia",
    "explanation": "O texto descreve que os pavimentos de blocos porosos \"são construídos com elementos interconectados de tijolo, pedra ou concreto... instalados sobre uma base de agregado convencional com leito de areia\"."
  },
  {
    "page": 8,
    "difficulty": "hard",
    "prompt": "Para Oliveira (2005 apud Bazzarella, 2005), citado no texto, quais são as causas do desperdício de água em aparelhos como chuveiros, mictórios, bacias sanitárias e torneiras?",
    "options": [
      "Vazamentos, dispersão dos jatos, vazão excessiva e tempo de utilização prolongado",
      "Apenas o mau uso por parte dos usuários",
      "Exclusivamente falhas de fabricação dos aparelhos",
      "Pressão insuficiente da rede pública"
    ],
    "correct_answer": "Vazamentos, dispersão dos jatos, vazão excessiva e tempo de utilização prolongado",
    "explanation": "O texto afirma que os desperdícios \"ocorrem por causa de vazamentos, dispersão dos jatos, vazão excessiva e tempo de utilização prolongado\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual aparelho hidrossanitário é o maior consumidor de água em uma edificação?",
    "options": [
      "A torneira da cozinha",
      "O chuveiro",
      "A máquina de lavar roupas",
      "A bacia sanitária"
    ],
    "correct_answer": "O chuveiro",
    "explanation": "O texto afirma: \"O maior consumidor de água é o chuveiro, e as opções mais usuais para a redução do consumo de água nesse caso são: chuveiros com reguladores da vazão... e chuveiros tipo ducha\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como funciona o chuveiro de acionamento hidromecânico, usado em edificações de locais públicos?",
    "options": [
      "Possui um tempo determinado para fechar automaticamente",
      "É acionado exclusivamente por controle remoto",
      "Funciona por energia solar",
      "Precisa ser ligado manualmente a cada uso, sem desligamento automático"
    ],
    "correct_answer": "Possui um tempo determinado para fechar automaticamente",
    "explanation": "O texto descreve o \"chuveiro de acionamento hidromecânico (com um tempo determinado para fechar automaticamente)\"."
  },
  {
    "page": 11,
    "difficulty": "hard",
    "prompt": "Qual é a diferença entre o acionamento por pedal e o acionamento por sensor infravermelho descritos no texto para torneiras e mictórios em locais públicos?",
    "options": [
      "O acionamento por pedal depende de contato físico do usuário; o sensor infravermelho detecta a presença das mãos e libera o fluxo automaticamente",
      "Ambos funcionam exatamente da mesma forma, apenas com nomes diferentes",
      "O sensor infravermelho exige bateria recarregável a cada uso; o pedal não precisa de manutenção",
      "O acionamento por pedal é exclusivo de mictórios, nunca usado em torneiras"
    ],
    "correct_answer": "O acionamento por pedal depende de contato físico do usuário; o sensor infravermelho detecta a presença das mãos e libera o fluxo automaticamente",
    "explanation": "O texto descreve \"chuveiro e torneira com acionamento de pedal\" e, separadamente, \"torneira e mictório... acionados por sensor infravermelho (os quais detectam a presença das mãos e liberam o fluxo de água)\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais fontes de energia fazem parte das energias renováveis citadas?",
    "options": [
      "Solar, hidrelétrica, biocombustíveis, eólica e das ondas das marés",
      "Petróleo, carvão e gás natural",
      "Apenas energia nuclear e solar",
      "Somente biocombustíveis e carvão mineral"
    ],
    "correct_answer": "Solar, hidrelétrica, biocombustíveis, eólica e das ondas das marés",
    "explanation": "O texto lista: \"Fazem parte das energias renováveis a energia solar, a gerada por hidrelétricas, por biocombustíveis..., a eólica e a produzida pelas ondas das marés\"."
  },
  {
    "page": 14,
    "difficulty": "hard",
    "prompt": "Para Abreu (2012), citado no texto, em quais etapas o consumo de energia pela construção civil é mais expressivo?",
    "options": [
      "Extração de materiais, fabricação, transporte e processamento dos insumos",
      "Apenas na etapa de demolição",
      "Exclusivamente durante a operação do edifício já construído",
      "Somente no transporte de trabalhadores até a obra"
    ],
    "correct_answer": "Extração de materiais, fabricação, transporte e processamento dos insumos",
    "explanation": "O texto afirma que \"é expressivo o consumo de energia pela construção civil nas etapas de extração de materiais, fabricação, transporte e processamento dos insumos\" (Abreu, 2012)."
  },
  {
    "page": 15,
    "difficulty": "hard",
    "prompt": "Segundo Roberto Kauffmann, citado no texto, dos 50% da energia elétrica consumida pelo setor industrial brasileiro, qual porcentagem se restringe à produção de cimento, aço, alumínio, ferroliga, petroquímica e papel e celulose?",
    "options": [
      "10%",
      "30%",
      "50%",
      "70%"
    ],
    "correct_answer": "30%",
    "explanation": "O texto cita: \"de 50% da energia elétrica consumida pelo setor industrial brasileiro, 30% se restringem à produção de cimento, aço, alumínio, ferroliga, petroquímica e papel e celulose\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo Benite (2011), citado no texto, em quais produções ocorrem as maiores emissões de dióxido de carbono (CO2) na cadeia da construção civil?",
    "options": [
      "Cimento, aço e cal",
      "Vidro e alumínio",
      "Madeira e gesso",
      "Tintas e solventes"
    ],
    "correct_answer": "Cimento, aço e cal",
    "explanation": "O texto afirma: \"Benite (2011) destaca que nas produções de cimento, aço e cal ocorrem as maiores emissões de dióxido de carbono (CO2)\"."
  },
  {
    "page": 16,
    "difficulty": "hard",
    "prompt": "Segundo Benite (2011), citado no texto, qual a faixa percentual das emissões de CO2 em edificações que está ligada à etapa de operação e uso do edifício (aquecimento, condicionamento de ar, iluminação e equipamentos)?",
    "options": [
      "10 a 20%",
      "30 a 40%",
      "50 a 60%",
      "80 a 90%"
    ],
    "correct_answer": "80 a 90%",
    "explanation": "O texto afirma que 10 a 20% das emissões estão ligadas à extração/fabricação/construção, e \"os 80 a 90% restantes são gerados na etapa de operação e uso do edifício\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "De acordo com o Plano Nacional de Eficiência Energética (Brasil, 2011), citado no texto, quais são as três situações relacionadas ao consumo de energia em uma edificação?",
    "options": [
      "Energia da construção, energia das atividades-fim do prédio e energia para conforto dos usuários",
      "Energia elétrica, energia solar e energia eólica",
      "Energia de projeto, energia de obra e energia de demolição",
      "Energia pública, energia privada e energia mista"
    ],
    "correct_answer": "Energia da construção, energia das atividades-fim do prédio e energia para conforto dos usuários",
    "explanation": "O texto lista as três situações: (1) energia resultante da construção, (2) energia consumida pelas atividades-fim do prédio, (3) energia para prover condições de conforto aos usuários."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo Burke e Ornstein (1998), citados no texto, qual é um dos principais problemas da falta de sustentabilidade na construção civil?",
    "options": [
      "A busca por resultados a curto prazo, sem levar em conta os custos a longo prazo (raciocínio imediatista)",
      "A escassez de mão de obra qualificada",
      "O excesso de normas técnicas regulatórias",
      "A ausência de financiamento bancário"
    ],
    "correct_answer": "A busca por resultados a curto prazo, sem levar em conta os custos a longo prazo (raciocínio imediatista)",
    "explanation": "O texto afirma que \"as atividades antrópicas estão associadas à busca por resultados a curto prazo, sem levar em conta os custos a longo prazo. O raciocínio imediatista é um dos principais problemas da falta de sustentabilidade\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "De acordo com o Ministério do Meio Ambiente, citado no texto, em que consiste a eficiência energética?",
    "options": [
      "Na relação entre a quantidade de energia efetivamente usada em uma atividade e a disponibilizada para sua realização",
      "Na quantidade total de energia produzida por uma usina",
      "No custo por kWh cobrado ao consumidor final",
      "Na capacidade máxima de armazenamento de uma bateria"
    ],
    "correct_answer": "Na relação entre a quantidade de energia efetivamente usada em uma atividade e a disponibilizada para sua realização",
    "explanation": "O texto afirma que \"a eficiência energética está na relação entre a quantidade de energia efetivamente usada em uma determinada atividade e a disponibilizada para sua realização\"."
  },
  {
    "page": 18,
    "difficulty": "hard",
    "prompt": "Para Hinrichs, Kleinbach e Reis (2010), citados no texto, por que conservar energia elétrica é considerado \"o meio de produção mais econômico que existe\"?",
    "options": [
      "Porque não polui o meio ambiente e reduz custos e impactos ambientais locais e globais",
      "Porque dispensa qualquer investimento inicial em equipamentos",
      "Porque é a única forma de energia isenta de impostos",
      "Porque elimina a necessidade de matriz energética diversificada"
    ],
    "correct_answer": "Porque não polui o meio ambiente e reduz custos e impactos ambientais locais e globais",
    "explanation": "O texto afirma que conservar energia elétrica \"é o meio de produção mais econômico que existe, o qual não polui o meio ambiente... a eficiência energética é a forma mais efetiva de reduzir os custos e os impactos ambientais locais e globais\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Como Lamberts, Dutra e Pereira (2004) definem eficiência energética, segundo o texto?",
    "options": [
      "A obtenção de um serviço com baixo dispêndio de energia",
      "A geração de energia a partir de fontes 100% renováveis",
      "O uso exclusivo de lâmpadas de LED em uma edificação",
      "A ausência total de consumo elétrico em horário de pico"
    ],
    "correct_answer": "A obtenção de um serviço com baixo dispêndio de energia",
    "explanation": "O texto afirma que \"a eficiência energética é definida como a obtenção de um serviço com baixo dispêndio de energia\" (Lamberts, Dutra e Pereira, 2004)."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Para Corbella e Corner (2015), citados no texto, o que caracteriza a arquitetura bioclimática?",
    "options": [
      "É voltada à adequação da construção ao clima, visando ao conforto térmico, acústico e visual do usuário",
      "É um estilo arquitetônico baseado exclusivamente em materiais reciclados",
      "Refere-se apenas ao uso de painéis solares na cobertura",
      "É aplicável somente a climas frios"
    ],
    "correct_answer": "É voltada à adequação da construção ao clima, visando ao conforto térmico, acústico e visual do usuário",
    "explanation": "O texto define: \"a arquitetura bioclimática é aquela voltada à adequação da construção ao clima, visando ao conforto térmico, acústico e visual do usuário\"."
  },
  {
    "page": 20,
    "difficulty": "hard",
    "prompt": "Segundo Kwok e Grondzik (2013), citados no texto, por que os requisitos para uma iluminação natural de qualidade devem ser considerados desde o início da definição do partido arquitetônico?",
    "options": [
      "Porque costumam ter grandes implicações para a volumetria da edificação e o zoneamento das atividades",
      "Porque a legislação exige aprovação prévia do projeto de iluminação",
      "Porque reduz o custo de licenciamento ambiental",
      "Porque elimina a necessidade de qualquer iluminação artificial"
    ],
    "correct_answer": "Porque costumam ter grandes implicações para a volumetria da edificação e o zoneamento das atividades",
    "explanation": "O texto afirma que \"os requisitos para uma iluminação natural de qualidade costumam ter grandes implicações para a volumetria da edificação e o zoneamento das atividades\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, de quais fatores depende o potencial de aproveitamento da energia eólica em uma região?",
    "options": [
      "Topografia da região, rugosidade do solo e existência de obstáculos nas proximidades",
      "Exclusivamente da latitude geográfica",
      "Apenas da temperatura média anual",
      "Somente da proximidade com a costa litorânea"
    ],
    "correct_answer": "Topografia da região, rugosidade do solo e existência de obstáculos nas proximidades",
    "explanation": "O texto afirma que \"o seu potencial de aproveitamento varia de acordo com alguns fatores, como topografia da região, rugosidade do solo e existência de obstáculos nas proximidades\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a diferença entre um sistema fotovoltaico isolado e um sistema interligado à rede pública?",
    "options": [
      "No sistema isolado a energia gerada é acumulada em baterias; no interligado, a eletricidade excedente é repassada automaticamente à rede pública",
      "O sistema isolado só funciona à noite; o interligado só de dia",
      "O sistema interligado não pode ser usado em residências, apenas indústrias",
      "Ambos os sistemas armazenam energia em baterias da mesma forma"
    ],
    "correct_answer": "No sistema isolado a energia gerada é acumulada em baterias; no interligado, a eletricidade excedente é repassada automaticamente à rede pública",
    "explanation": "O texto explica que, no sistema isolado, \"a energia gerada pode ser acumulada em baterias\"; no sistema interligado, \"a eletricidade excedente é repassada automaticamente à rede pública\"."
  },
  {
    "page": 24,
    "difficulty": "hard",
    "prompt": "De acordo com Dorigo, Pinto e Santos (2009), citados no texto, quais componentes constituem um sistema fotovoltaico?",
    "options": [
      "Células fotoelétricas, transformadores, cabeamentos, inversores e sistemas de integração",
      "Apenas painéis solares e fiação básica",
      "Baterias, gerador a diesel e quadro de distribuição",
      "Somente inversores e cabos de cobre"
    ],
    "correct_answer": "Células fotoelétricas, transformadores, cabeamentos, inversores e sistemas de integração",
    "explanation": "O texto afirma que \"esse sistema é constituído por células fotoelétricas, transformadores, cabeamentos, inversores e sistemas de integração\" (Dorigo, Pinto e Santos, 2009)."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que as células fotoelétricas convencionais são geralmente usadas em fachadas cegas ou coberturas, e não em áreas envidraçadas?",
    "options": [
      "Porque impedem a visibilidade entre áreas internas e externas",
      "Porque não resistem à exposição direta ao sol",
      "Porque são incompatíveis com estruturas metálicas",
      "Porque exigem manutenção diária"
    ],
    "correct_answer": "Porque impedem a visibilidade entre áreas internas e externas",
    "explanation": "O texto explica que \"as células fotoelétricas convencionais impedem a visibilidade entre áreas internas e externas. Por esse motivo, geralmente são utilizadas em fachadas cegas ou coberturas\"."
  },
  {
    "page": 26,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual a diferença entre \"resíduos sólidos\" e \"rejeito\"?",
    "options": [
      "Resíduos sólidos podem ser majoritariamente reaproveitados; rejeitos não são reaproveitados",
      "São termos idênticos usados de forma intercambiável",
      "Rejeito é sempre líquido; resíduo sólido é sempre sólido",
      "Resíduo sólido é regulado por lei; rejeito não tem regulação nenhuma"
    ],
    "correct_answer": "Resíduos sólidos podem ser majoritariamente reaproveitados; rejeitos não são reaproveitados",
    "explanation": "O texto afirma: \"Os resíduos sólidos correspondem à parte do lixo que de alguma maneira poderá ser majoritariamente reaproveitada, enquanto os rejeitos compreendem a parte do lixo que não é reaproveitada\"."
  },
  {
    "page": 26,
    "difficulty": "hard",
    "prompt": "Segundo a Lei nº 12.305/2010 (Política Nacional de Resíduos Sólidos), citada no texto, o conceito legal de \"resíduos sólidos\" inclui apenas materiais no estado sólido?",
    "options": [
      "Não — inclui também gases contidos em recipientes e líquidos cujo lançamento na rede pública de esgoto seja inviável",
      "Sim, exclusivamente materiais sólidos ou semissólidos",
      "Não — inclui qualquer tipo de líquido, mesmo lançável em rede de esgoto comum",
      "Sim, e a lei exclui explicitamente qualquer gás"
    ],
    "correct_answer": "Não — inclui também gases contidos em recipientes e líquidos cujo lançamento na rede pública de esgoto seja inviável",
    "explanation": "A definição legal citada inclui \"nos estados sólido ou semissólido, bem como gases contidos em recipientes e líquidos cujas particularidades tornem inviável o seu lançamento na rede pública de esgotos\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo a classificação por origem da PNRS, citada no texto, como se dividem os resíduos domiciliares?",
    "options": [
      "Em secos (plásticos, papéis, metais, vidros) e úmidos (resíduos orgânicos, restos de alimentos)",
      "Em recicláveis e não recicláveis apenas",
      "Em perigosos e não perigosos exclusivamente",
      "Em urbanos e rurais"
    ],
    "correct_answer": "Em secos (plásticos, papéis, metais, vidros) e úmidos (resíduos orgânicos, restos de alimentos)",
    "explanation": "O texto define: \"Resíduos domiciliares: originados das residências urbanas. Podem ser secos (plásticos, papéis, metais, vidros e outras embalagens) ou úmidos (resíduos orgânicos...)\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo a PNRS, citada no texto, o que caracteriza os \"resíduos da construção civil\" como categoria de origem?",
    "options": [
      "São provenientes da construção civil, demolições, reformas ou reparos, incluindo preparação e escavação de terrenos",
      "São apenas os resíduos gerados em canteiros de obras públicas",
      "Incluem exclusivamente resíduos de demolição, não de construção nova",
      "São classificados junto aos resíduos industriais"
    ],
    "correct_answer": "São provenientes da construção civil, demolições, reformas ou reparos, incluindo preparação e escavação de terrenos",
    "explanation": "O texto define: \"Resíduos da construção civil: provenientes da construção civil, de demolições, reformas ou reparos. Essa categoria também inclui os resíduos de etapas de preparação e escavação de terrenos\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 1004/2004, citada no texto, como os resíduos são divididos quanto à periculosidade?",
    "options": [
      "Classe I (perigosos) e Classe II (não perigosos)",
      "Classe A, B, C e D",
      "Tipo 1 (sólido) e Tipo 2 (líquido)",
      "Categoria urbana e categoria industrial"
    ],
    "correct_answer": "Classe I (perigosos) e Classe II (não perigosos)",
    "explanation": "O texto afirma que a NBR 1004/2004 \"divide os resíduos em dois grupos: Classe I (perigosos) e Classe II (não perigosos)\"."
  },
  {
    "page": 30,
    "difficulty": "hard",
    "prompt": "Segundo o texto, em que a Classe II de resíduos (não perigosos) da NBR 1004/2004 pode ser subdividida?",
    "options": [
      "Classe II A (não inertes) e Classe II B (inertes)",
      "Classe II Doméstica e Classe II Industrial",
      "Classe II Sólida e Classe II Líquida",
      "A Classe II não admite subdivisão"
    ],
    "correct_answer": "Classe II A (não inertes) e Classe II B (inertes)",
    "explanation": "O texto afirma que \"na Classe II, eles podem ser, ainda, subdivididos em Classe II A (não inertes) e Classe II B (inertes)\"."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo a PNRS, citada no texto, o que compreende o \"gerenciamento de resíduos sólidos\"?",
    "options": [
      "Conjunto de ações nas etapas de coleta, transporte, transbordo, tratamento e destinação final ambientalmente adequada",
      "Apenas a etapa final de disposição em aterro",
      "Somente a fiscalização por órgãos ambientais",
      "Exclusivamente o transporte entre municípios"
    ],
    "correct_answer": "Conjunto de ações nas etapas de coleta, transporte, transbordo, tratamento e destinação final ambientalmente adequada",
    "explanation": "A definição legal citada é: \"gerenciamento de resíduos sólidos: conjunto de ações exercidas... nas etapas de coleta, transporte, transbordo, tratamento e destinação final ambientalmente adequada dos resíduos sólidos\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza o tratamento térmico por incineração?",
    "options": [
      "Queima pela ação de um combustível, causando a oxidação da matéria orgânica",
      "Decomposição por minhocas em ambiente controlado",
      "Separação por densidade em líquido intermediário",
      "Redução do tamanho das partículas por moinhos"
    ],
    "correct_answer": "Queima pela ação de um combustível, causando a oxidação da matéria orgânica",
    "explanation": "O Quadro 1 do texto define incineração como \"queima pela ação de um combustível, causando a oxidação da matéria orgânica\"."
  },
  {
    "page": 33,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual a principal diferença entre um aterro sanitário e um lixão?",
    "options": [
      "O aterro sanitário conta com proteção da base e laterais por material impermeável e coleta/tratamento de gases e líquidos; o lixão descarrega resíduos sem cuidado, planejamento ou proteção ambiental",
      "Não há diferença real, apenas o nome muda conforme a região do país",
      "O lixão é regulamentado por norma técnica; o aterro sanitário não",
      "Aterros sanitários só existem em capitais; lixões, apenas em cidades pequenas"
    ],
    "correct_answer": "O aterro sanitário conta com proteção da base e laterais por material impermeável e coleta/tratamento de gases e líquidos; o lixão descarrega resíduos sem cuidado, planejamento ou proteção ambiental",
    "explanation": "O texto descreve o lixão como área \"ao ar livre\" sem proteção, enquanto o aterro sanitário \"conta com uma proteção da base e das laterais propiciada pela utilização de um material impermeável... há coleta e tratamento dos gases... e dos líquidos gerados\"."
  },
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é o lixiviado (também chamado percolado ou chorume)?",
    "options": [
      "Um líquido de cor escura, originado da decomposição do resíduo sólido somada à precipitação, com pH ácido e alta concentração de compostos tóxicos",
      "Água potável tratada usada na limpeza do aterro",
      "Um gás produzido exclusivamente pela queima de plástico",
      "Material sólido reaproveitável do aterro"
    ],
    "correct_answer": "Um líquido de cor escura, originado da decomposição do resíduo sólido somada à precipitação, com pH ácido e alta concentração de compostos tóxicos",
    "explanation": "O texto define o lixiviado como \"um líquido de cor escura, originado da decomposição do resíduo sólido somada à precipitação... possuindo pH ácido, malcheiroso e concentrado – com altas concentrações... compostos tóxicos e microrganismos patogênicos\"."
  },
  {
    "page": 35,
    "difficulty": "medium",
    "prompt": "Segundo a Resolução Conama nº 307/2002, citada no texto, o que caracteriza os resíduos de construção civil Classe A?",
    "options": [
      "São resíduos reutilizáveis ou recicláveis como agregados, provenientes de construção, demolição, reformas e reparos",
      "São resíduos perigosos que exigem descarte especial",
      "São exclusivamente plásticos e metais",
      "Não têm nenhuma aplicação futura possível"
    ],
    "correct_answer": "São resíduos reutilizáveis ou recicláveis como agregados, provenientes de construção, demolição, reformas e reparos",
    "explanation": "O texto cita a Resolução: \"resíduos classe A são os resíduos reutilizáveis ou recicláveis como agregados\", exemplificando com componentes cerâmicos, argamassa e concreto de construção/demolição."
  },
  {
    "page": 36,
    "difficulty": "medium",
    "prompt": "Segundo Angulo et al. (2004), citados no texto, qual percentual do total de resíduos sólidos urbanos no Brasil os resíduos da construção civil (RCC) representam?",
    "options": [
      "Cerca de 10%",
      "Cerca de 25%",
      "Cerca de 50%",
      "Cerca de 90%"
    ],
    "correct_answer": "Cerca de 50%",
    "explanation": "O texto afirma: \"No Brasil, os resíduos da construção civil representam cerca de 50% do total de resíduos sólidos urbanos (Angulo et al., 2004)\"."
  },
  {
    "page": 37,
    "difficulty": "hard",
    "prompt": "Segundo Leite (1997), citado no texto, qual é a diferença entre \"gestão\" e \"gerenciamento\" de resíduos sólidos?",
    "options": [
      "Gestão abrange decisões estratégicas e organização do setor (instituições, políticas); gerenciamento trata dos aspectos tecnológicos e operacionais",
      "São sinônimos, sem diferença conceitual relevante",
      "Gestão é responsabilidade exclusiva do poder público; gerenciamento, apenas do setor privado",
      "Gerenciamento se refere só à etapa de coleta; gestão, só à etapa de descarte final"
    ],
    "correct_answer": "Gestão abrange decisões estratégicas e organização do setor (instituições, políticas); gerenciamento trata dos aspectos tecnológicos e operacionais",
    "explanation": "O texto explica que \"a gestão de resíduos sólidos abrange atividades referentes às tomadas de decisões estratégicas... englobando instituições, políticas, instrumentos e meios. Já o gerenciamento... está relacionado aos aspectos tecnológicos e operacionais\"."
  },
  {
    "page": 38,
    "difficulty": "medium",
    "prompt": "Segundo a Resolução Conama nº 307/2002, citada no texto, como são diferenciados os pequenos e grandes geradores de RCC?",
    "options": [
      "Pequenos geradores produzem até 1.000 litros (1 m³) de RCC por obra, conforme estabelecido pela administração municipal; grandes geradores excedem esse volume",
      "Pequenos geradores são pessoas físicas; grandes geradores são sempre empresas",
      "A diferenciação é feita pelo faturamento anual da empresa",
      "Não há diferenciação legal entre os dois tipos de gerador"
    ],
    "correct_answer": "Pequenos geradores produzem até 1.000 litros (1 m³) de RCC por obra, conforme estabelecido pela administração municipal; grandes geradores excedem esse volume",
    "explanation": "O texto afirma que pequenos geradores são \"aqueles que geram uma quantidade máxima de RCC, estabelecida pela administração municipal, de até 1.000 litros por gerador, quantidade equivalente a 1 m3\", e grandes geradores excedem esse valor."
  },
  {
    "page": 39,
    "difficulty": "hard",
    "prompt": "Segundo John e Agopyan (2000), citados no texto, quais são as três fases do ciclo de vida da construção civil em que os RCC podem ser gerados?",
    "options": [
      "Construção, manutenção e demolição",
      "Projeto, licenciamento e execução",
      "Extração, transporte e venda",
      "Fundação, estrutura e acabamento"
    ],
    "correct_answer": "Construção, manutenção e demolição",
    "explanation": "O texto descreve as três fases estudadas pelos autores: geração de resíduos na fase de construção (perdas dos processos construtivos), na fase de manutenção (reformas, correções) e na fase de demolição."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais dois aspectos são especialmente importantes a considerar em edificações comerciais com grandes áreas envidraçadas, do ponto de vista de eficiência energética?",
    "options": [
      "A iluminação e o condicionamento do ar",
      "A estrutura metálica e o revestimento externo",
      "O paisagismo e a acústica",
      "O sistema de segurança e o elevador"
    ],
    "correct_answer": "A iluminação e o condicionamento do ar",
    "explanation": "O texto afirma: \"em edificações comerciais, dois aspectos são importantes de serem considerados: a iluminação e o condicionamento do ar. Geralmente essas edificações apresentam grandes áreas envidraçadas\", o que pode causar ofuscamento pelo excesso de luz natural."
  },
  {
    "page": 40,
    "difficulty": "hard",
    "prompt": "Segundo Leite (2001), citado no texto, quais fatores interferem na composição média dos resíduos de construção (RCC)?",
    "options": [
      "A tipologia construtiva utilizada, as técnicas construtivas existentes e os materiais disponíveis em cada local",
      "Apenas o clima da região",
      "Somente o porte financeiro da construtora",
      "Exclusivamente a idade da edificação"
    ],
    "correct_answer": "A tipologia construtiva utilizada, as técnicas construtivas existentes e os materiais disponíveis em cada local",
    "explanation": "O texto afirma que \"diversos fatores interferem na composição média dos resíduos de construção, como a tipologia construtiva utilizada, as técnicas construtivas existentes e os materiais disponíveis em cada local\" (Leite, 2001)."
  }
],
};

// ---------------------------------------------------------------------------
// track_s02_desenho_arquitetura_urbanismo — Unidade 4 — Representação de Coberturas, Elementos Verticais e Detalhamentos
// ---------------------------------------------------------------------------
const desenhoArquiteturaUrbanismo = {
  trackId: "track_s02_desenho_arquitetura_urbanismo",
  lessonId: "lesson_desenho_arquitetura_urbanismo_u4",
  unitTitle: "Unidade 4 — Representação de Coberturas, Elementos Verticais e Detalhamentos",
  questions: [
  {
    "page": 3,
    "difficulty": "easy",
    "prompt": "Segundo o texto, o que caracteriza o telhado aparente?",
    "options": [
      "As telhas ficam à mostra e compõem a estética da fachada",
      "O telhado fica sempre oculto atrás de uma platibanda",
      "É usado exclusivamente em coberturas planas",
      "Dispensa qualquer tipo de estrutura de apoio"
    ],
    "correct_answer": "As telhas ficam à mostra e compõem a estética da fachada",
    "explanation": "O texto define: \"O telhado aparente é o modelo de cobertura mais comum... As telhas são responsáveis por compor a estética da fachada, já que ficam à mostra\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que o telhado embutido exige atenção especial ao dimensionamento das calhas?",
    "options": [
      "Porque, diferente do telhado aparente, não há beiral por onde a água escorra, exigindo calhas para direcionar a chuva",
      "Porque a platibanda impede totalmente a passagem de água",
      "Porque esse tipo de telhado nunca usa telha de fibrocimento",
      "Porque a inclinação é sempre superior a 35%"
    ],
    "correct_answer": "Porque, diferente do telhado aparente, não há beiral por onde a água escorra, exigindo calhas para direcionar a chuva",
    "explanation": "O texto explica que \"como não há um beiral por onde a água escorra, é necessário utilizar-se de calhas para direcionar a chuva\" no telhado embutido."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Gaspar (2012), citado no texto, qual a faixa de inclinação característica de uma laje plana de cobertura?",
    "options": [
      "Entre 1% e 5%",
      "Entre 10% e 25%",
      "Entre 25% e 35%",
      "Entre 40% e 50%"
    ],
    "correct_answer": "Entre 1% e 5%",
    "explanation": "O texto afirma que a laje plana \"é caracterizada por ter uma inclinação mínima, imperceptível aos olhos, que varia entre 1% e 5%\" (Gaspar, 2012)."
  },
  {
    "page": 8,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quais são os três elementos que compõem a estrutura principal do telhado, do apoio até o suporte das telhas?",
    "options": [
      "Tesoura (suporta tudo), terças (fixadas na tesoura, suportam os caibros) e caibros/ripas (sustentam as telhas)",
      "Cumeeira, espigão e água furtada",
      "Rufo, cantoneira e testeira",
      "Beiral, platibanda e lanternim"
    ],
    "correct_answer": "Tesoura (suporta tudo), terças (fixadas na tesoura, suportam os caibros) e caibros/ripas (sustentam as telhas)",
    "explanation": "O texto descreve: \"Tesoura: ...é a base que suporta todos os elementos... Terças: fixados na tesoura, suportam os caibros. Caibros: ...que sustenta as ripas. Ripas: ...que sustenta as telhas\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é a \"água furtada\" em uma cobertura?",
    "options": [
      "O encontro das águas que escorrem das partes de um telhado, também conhecido como calha",
      "A linha horizontal mais alta da cobertura",
      "A parte do telhado que avança além das paredes",
      "O material impermeabilizante usado sob as telhas"
    ],
    "correct_answer": "O encontro das águas que escorrem das partes de um telhado, também conhecido como calha",
    "explanation": "O texto define: \"Água furtada: encontro das águas que escorrem das partes de um telhado, também conhecido como calha\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a função do rufo no telhamento?",
    "options": [
      "Arremate do telhamento com a parede, caixas-d'água, lanternins e platibandas",
      "Cobrir o encontro de duas águas do telhado",
      "Sustentar diretamente as telhas cerâmicas",
      "Substituir a necessidade de calhas em telhados embutidos"
    ],
    "correct_answer": "Arremate do telhamento com a parede, caixas-d'água, lanternins e platibandas",
    "explanation": "O texto define: \"Rufo: utilizado no arremate do telhamento com a parede, caixas-d'água, lanternins... platibandas, entre outros\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a faixa de inclinação das telhas cerâmicas, conhecidas por boa estanqueidade e conforto térmico?",
    "options": [
      "Entre 25% e 35%",
      "Entre 10% e 25%",
      "Entre 5% e 10%",
      "Entre 1% e 5%"
    ],
    "correct_answer": "Entre 25% e 35%",
    "explanation": "O texto afirma que \"as telhas cerâmicas oferecem boas condições de conforto termoacústico, com inclinação entre 25% e 35%\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a faixa de inclinação recomendada para telhas de fibrocimento?",
    "options": [
      "Entre 10% e 25%",
      "Entre 25% e 35%",
      "Entre 40% e 50%",
      "Acima de 50%"
    ],
    "correct_answer": "Entre 10% e 25%",
    "explanation": "O texto afirma que com telhas de fibrocimento \"é possível executar um telhado com inclinações menores, entre 10% e 25%\"."
  },
  {
    "page": 14,
    "difficulty": "hard",
    "prompt": "Segundo o texto, por que se criou a telha \"sanduíche\", composta por duas chapas metálicas com material isolante entre elas?",
    "options": [
      "Porque as telhas metálicas comuns são as que mais esquentam o ambiente e as mais barulhentas",
      "Porque telhas metálicas comuns não suportam ventos fortes",
      "Porque é exigência da NBR 6492 para qualquer telhado embutido",
      "Porque reduz o custo em comparação à telha cerâmica"
    ],
    "correct_answer": "Porque as telhas metálicas comuns são as que mais esquentam o ambiente e as mais barulhentas",
    "explanation": "O texto explica que as telhas metálicas \"são as que mais esquentam o ambiente e as mais barulhentas. Por este motivo, criou-se um modelo de telha chamada sanduíche... compostas por duas chapas metálicas 'recheadas' de um material isolante térmico e acústico\"."
  },
  {
    "page": 18,
    "difficulty": "hard",
    "prompt": "Segundo o texto, a partir de que valor de inclinação uma laje de cobertura horizontal passa a ser considerada \"cobertura inclinada\"?",
    "options": [
      "Acima de 1%",
      "Acima de 3%",
      "Acima de 10%",
      "Acima de 25%"
    ],
    "correct_answer": "Acima de 3%",
    "explanation": "O texto afirma: \"para as coberturas horizontais (lajes de cobertura), a inclinação pode variar entre 1% a 3%, no máximo, um plano com inclinação maior do que 3% já é considerado cobertura inclinada\"."
  },
  {
    "page": 19,
    "difficulty": "hard",
    "prompt": "Qual é a fórmula apresentada no texto para calcular a inclinação (%) de um telhado?",
    "options": [
      "Inclinação (%) = Altura do telhado (m) / Largura (m) x 100",
      "Inclinação (%) = Largura (m) / Altura do telhado (m) x 100",
      "Inclinação (%) = Altura do telhado (m) x Largura (m)",
      "Inclinação (%) = (Altura + Largura) / 2"
    ],
    "correct_answer": "Inclinação (%) = Altura do telhado (m) / Largura (m) x 100",
    "explanation": "O texto apresenta exatamente essa fórmula: \"Inclinação (%) = Altura do telhado (m) / Largura (m) x 100\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, em quais três desenhos principais o telhado deve estar representado num projeto?",
    "options": [
      "Planta de cobertura, cortes e elevações",
      "Planta baixa, planta de situação e planta de locação",
      "Corte, detalhe construtivo e memorial descritivo",
      "Fachada, perspectiva e maquete eletrônica"
    ],
    "correct_answer": "Planta de cobertura, cortes e elevações",
    "explanation": "O texto afirma que \"o telhado deverá estar representado em três desenhos principais: planta de cobertura, cortes e elevações\", segundo a NBR 6492."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em quais escalas a Planta de Cobertura costuma ser apresentada nos projetos arquitetônicos?",
    "options": [
      "1:50, 1:100, 1:200 ou 1:500",
      "1:1, 1:2 ou 1:5",
      "1:1000, 1:2000 ou 1:5000",
      "Sempre 1:75, sem variação"
    ],
    "correct_answer": "1:50, 1:100, 1:200 ou 1:500",
    "explanation": "O texto afirma que os planos de cobertura \"são apresentadas geralmente nas escalas: 1:50, 1:100, 1:200 ou 1:500\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como se desenha de forma simples e eficiente a inclinação do telhado no corte, usando um triângulo como base?",
    "options": [
      "Desenhando uma linha horizontal de 100 cm e uma linha vertical com altura correspondente à inclinação em porcentagem, fechando com uma linha angulada",
      "Desenhando um círculo e medindo seu raio",
      "Usando apenas a planta baixa, sem necessidade de cálculo no corte",
      "Aplicando a fórmula da NBR 9050 para rampas"
    ],
    "correct_answer": "Desenhando uma linha horizontal de 100 cm e uma linha vertical com altura correspondente à inclinação em porcentagem, fechando com uma linha angulada",
    "explanation": "O texto descreve: desenha-se \"um triângulo reto com 100 centímetros de base e altura correspondente à inclinação desejada (em porcentagem). A linha angulada... será a inclinação do telhado\"."
  },
  {
    "page": 26,
    "difficulty": "hard",
    "prompt": "Segundo o estudo de Bernardo Misaka, citado no texto, como se comparou o desempenho térmico do telhado verde em relação às telhas de fibrocimento e ecológica?",
    "options": [
      "A cobertura verde teve desempenho melhor no que diz respeito à inércia térmica",
      "O telhado verde teve o pior desempenho térmico entre os três",
      "Não houve diferença mensurável de desempenho entre os três tipos",
      "A telha de fibrocimento superou o telhado verde em conforto térmico"
    ],
    "correct_answer": "A cobertura verde teve desempenho melhor no que diz respeito à inércia térmica",
    "explanation": "O texto conclui, a partir do estudo de Misaka, que \"foi possível concluir que a cobertura verde teve um desempenho melhor no que diz respeito à inércia térmica\"."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que situação a escada reta é geralmente utilizada?",
    "options": [
      "Quando a largura do espaço é reduzida",
      "Quando é necessária mudança de direção a 90 graus",
      "Apenas em escadas de emergência de grandes edifícios",
      "Exclusivamente em escadas helicoidais"
    ],
    "correct_answer": "Quando a largura do espaço é reduzida",
    "explanation": "O texto afirma que a escada reta \"geralmente é utilizada quando a largura do espaço é reduzida\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual formato de escada é descrito como mais confortável e muito utilizado em residências e escadas de emergência de edifícios?",
    "options": [
      "Escada em \"U\"",
      "Escada reta",
      "Escada caracol",
      "Escada helicoidal sem eixo central"
    ],
    "correct_answer": "Escada em \"U\"",
    "explanation": "O texto afirma que a escada em \"U\" \"é mais confortável e muito utilizada em residências e escadas de emergência de edifícios\"."
  },
  {
    "page": 36,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual a diferença entre escadas autoportantes, apoiadas e suspensas?",
    "options": [
      "Autoportantes possuem própria estrutura; apoiadas são fixadas em paredes ou pilares; suspensas são fixadas em apenas um ponto, parecendo flutuar",
      "Todas têm a mesma estrutura, diferindo apenas no material",
      "Apoiadas são sempre de concreto; suspensas, sempre metálicas",
      "Autoportantes exigem sempre patamar intermediário"
    ],
    "correct_answer": "Autoportantes possuem própria estrutura; apoiadas são fixadas em paredes ou pilares; suspensas são fixadas em apenas um ponto, parecendo flutuar",
    "explanation": "O texto descreve: \"escadas autoportantes são aquelas que possuem sua própria estrutura, enquanto as escadas apoiadas são fixadas em paredes ou pilares. As escadas suspensas... são fixadas apenas em um ponto e parecem estar flutuando\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que situações os elevadores hidráulicos são geralmente utilizados?",
    "options": [
      "Em edificações de menor porte e com menor fluxo de pessoas, pois possuem capacidade para poucos andares",
      "Em arranha-céus com mais de 50 pavimentos",
      "Exclusivamente em elevadores de carga industrial",
      "Apenas em edificações com fachada panorâmica de vidro"
    ],
    "correct_answer": "Em edificações de menor porte e com menor fluxo de pessoas, pois possuem capacidade para poucos andares",
    "explanation": "O texto afirma que elevadores hidráulicos \"são utilizados em edificações de menor porte e com menor fluxo de pessoas pois possuem capacidade para poucos andares\"."
  },
  {
    "page": 38,
    "difficulty": "hard",
    "prompt": "Segundo o Código de Obras de São Paulo (2017), citado no texto, a partir de quantos pavimentos exige-se o uso de elevadores, e quando são exigidos no mínimo dois elevadores?",
    "options": [
      "Mais de 5 pavimentos exige elevador; mais de 10 pavimentos exige no mínimo dois elevadores",
      "Mais de 3 pavimentos exige elevador; mais de 6 exige dois elevadores",
      "Mais de 10 pavimentos exige elevador; mais de 20 exige dois elevadores",
      "Não há exigência de número mínimo de elevadores em nenhum caso"
    ],
    "correct_answer": "Mais de 5 pavimentos exige elevador; mais de 10 pavimentos exige no mínimo dois elevadores",
    "explanation": "O texto cita: \"exige-se o uso de elevadores para edifícios com mais de 5 pavimentos ou com desnível total superior a 12 metros... em edifícios com mais de 10 pavimentos, são necessários no mínimo dois elevadores\"."
  },
  {
    "page": 40,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9050 (ABNT, 2021b), citada no texto, qual a largura mínima permitida para escadas em rotas acessíveis?",
    "options": [
      "120 centímetros",
      "80 centímetros",
      "150 centímetros",
      "200 centímetros"
    ],
    "correct_answer": "120 centímetros",
    "explanation": "O texto afirma: \"A NBR 9050... diz que a largura mínima permitida para escadas em rotas acessíveis é de 120 centímetros\"."
  },
  {
    "page": 40,
    "difficulty": "hard",
    "prompt": "Segundo a NBR 9050, citada no texto, para um desnível de 350 cm com altura máxima de espelho de 18 cm, quantos degraus são necessários e qual a altura final de cada espelho?",
    "options": [
      "20 degraus, com espelhos de 17,5 cm cada",
      "19 degraus, com espelhos de 18,4 cm cada",
      "18 degraus, com espelhos de 19,4 cm cada",
      "21 degraus, com espelhos de 16,6 cm cada"
    ],
    "correct_answer": "20 degraus, com espelhos de 17,5 cm cada",
    "explanation": "O texto calcula: \"350/18 = 19,44 = 20, arredondando para cima... os espelhos terão altura final de 17,5 cm (350 / 20 = 17,5)\"."
  },
  {
    "page": 42,
    "difficulty": "hard",
    "prompt": "Segundo a NBR 9050, citada no texto, qual fórmula relaciona o piso (p) e o espelho (e) de uma escada para garantir conforto e segurança?",
    "options": [
      "60 cm ≤ p + 2e ≤ 65 cm",
      "p = e x 2",
      "p + e = 100 cm sempre",
      "p - e ≥ 30 cm"
    ],
    "correct_answer": "60 cm ≤ p + 2e ≤ 65 cm",
    "explanation": "O texto apresenta exatamente essa fórmula da NBR 9050: \"60 cm ≤p + 2e ≤ 65cm\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a função da guia de balizamento em escadas sem paredes laterais?",
    "options": [
      "Auxiliar pessoas cegas, que ao bater com a bengala usam essa fiada de alvenaria como guia na circulação vertical",
      "Substituir totalmente a função do corrimão",
      "Servir apenas como elemento decorativo sem função de segurança",
      "Indicar a numeração dos degraus"
    ],
    "correct_answer": "Auxiliar pessoas cegas, que ao bater com a bengala usam essa fiada de alvenaria como guia na circulação vertical",
    "explanation": "O texto explica que a guia de balizamento \"auxilia, por exemplo, a pessoa cega, que, ao bater com a bengala, serve como guia na circulação das transposições verticais\"."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9077/2001, citada no texto, a partir de que desnível é obrigatória a instalação de guarda-corpo em áreas de uso coletivo?",
    "options": [
      "Desnível maior que 19 cm",
      "Desnível maior que 50 cm",
      "Desnível maior que 1 metro",
      "Desnível maior que 5 cm"
    ],
    "correct_answer": "Desnível maior que 19 cm",
    "explanation": "O texto afirma que o guarda-corpo \"é instalado em áreas de uso coletivo quando o desnível é maior que 19 cm\", segundo a NBR 9077/2001."
  },
  {
    "page": 45,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual teste determina se as aberturas de um guarda-corpo (grades, telas, vidros) são seguras?",
    "options": [
      "Uma esfera de 15 cm de diâmetro não deve passar por nenhuma das aberturas",
      "A abertura máxima deve ser de 30 cm em qualquer direção",
      "O teste é feito apenas visualmente, sem parâmetro numérico",
      "Deve suportar o peso de uma pessoa de 100 kg apoiada"
    ],
    "correct_answer": "Uma esfera de 15 cm de diâmetro não deve passar por nenhuma das aberturas",
    "explanation": "O texto afirma que o guarda-corpo deve ser feito \"na condição de que, se feito um teste com uma esfera de 15 cm de diâmetro, esta não passe por nenhuma das aberturas do guarda-corpo\"."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9050, citada no texto, a que alturas do piso devem ser posicionados os corrimãos superior e inferior?",
    "options": [
      "0,92 m (superior) e 0,70 m (inferior)",
      "1,05 m (superior) e 0,50 m (inferior)",
      "0,80 m (superior) e 0,40 m (inferior)",
      "1,20 m (superior) e 0,90 m (inferior)"
    ],
    "correct_answer": "0,92 m (superior) e 0,70 m (inferior)",
    "explanation": "O texto afirma que o corrimão \"é posicionado a 0,92 m (corrimão superior) e a 0,70 m (corrimão inferior) do piso\"."
  },
  {
    "page": 46,
    "difficulty": "hard",
    "prompt": "Segundo o texto, a partir de qual largura de escada é necessário instalar um corrimão intermediário?",
    "options": [
      "Igual ou superior a 2,40 m",
      "Igual ou superior a 1,20 m",
      "Igual ou superior a 3,00 m",
      "Não há exigência de corrimão intermediário em nenhum caso"
    ],
    "correct_answer": "Igual ou superior a 2,40 m",
    "explanation": "O texto afirma: \"Quando as escadas apresentarem largura igual ou superior a 2,40 m, é necessário instalar um corrimão intermediário, com largura mínima de 1,20 m\"."
  },
  {
    "page": 48,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual norma técnica estabelece os requisitos para cálculo e execução de projetos de elevadores elétricos de passageiros?",
    "options": [
      "NBR 16858-1",
      "NBR 9050",
      "NBR 9077",
      "NBR 6492"
    ],
    "correct_answer": "NBR 16858-1",
    "explanation": "O texto afirma que \"a norma que trata dos cálculos adequados [para elevadores] é a NBR 16858-1 (ABNT, 2021c)\"."
  },
  {
    "page": 49,
    "difficulty": "hard",
    "prompt": "Segundo o texto, como se indica o sentido de subida ao representar uma escada em planta baixa?",
    "options": [
      "Numerando os degraus do nível mais baixo para o mais alto e colocando uma seta indicando o sentido de subida",
      "Usando apenas cores diferentes para cada degrau",
      "Desenhando setas apontando para baixo em todos os casos",
      "Não é necessário indicar sentido algum em planta baixa"
    ],
    "correct_answer": "Numerando os degraus do nível mais baixo para o mais alto e colocando uma seta indicando o sentido de subida",
    "explanation": "O texto afirma: \"devemos numerar os degraus, do nível mais baixo para o mais alto, e colocar uma seta indicando o sentido de subida\"."
  },
  {
    "page": 49,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como costumam ser representados os degraus de uma escada que estão a mais de 150 cm de altura do piso, na planta baixa?",
    "options": [
      "Com linha tracejada",
      "Com linha contínua mais espessa",
      "Com hachura cruzada",
      "Não são representados de forma alguma"
    ],
    "correct_answer": "Com linha tracejada",
    "explanation": "O texto afirma: \"É comum que os últimos degraus da escada, aqueles que estão a uma altura superior a 150 cm do piso, sejam desenhados com linha tracejada\"."
  },
  {
    "page": 58,
    "difficulty": "easy",
    "prompt": "Segundo o texto, a partir de qual declividade uma superfície de piso é classificada como rampa?",
    "options": [
      "Igual ou superior a 5%",
      "Igual ou superior a 1%",
      "Igual ou superior a 10%",
      "Igual ou superior a 20%"
    ],
    "correct_answer": "Igual ou superior a 5%",
    "explanation": "O texto define: \"As rampas são superfícies de piso com declividade igual ou superior a 5%\"."
  },
  {
    "page": 58,
    "difficulty": "hard",
    "prompt": "Segundo o texto, por que as rampas são consideradas o meio mais seguro de garantir a acessibilidade universal, em comparação com escadas e elevadores?",
    "options": [
      "Porque são o único elemento capaz de promover autonomia na locomoção de qualquer pessoa, enquanto escadas dificultam a locomoção reduzida e elevadores são suscetíveis a falhas mecânicas",
      "Porque ocupam menos espaço que escadas e elevadores",
      "Porque dispensam qualquer norma técnica de dimensionamento",
      "Porque nunca precisam de corrimão"
    ],
    "correct_answer": "Porque são o único elemento capaz de promover autonomia na locomoção de qualquer pessoa, enquanto escadas dificultam a locomoção reduzida e elevadores são suscetíveis a falhas mecânicas",
    "explanation": "O texto argumenta que as rampas \"são o único elemento de circulação vertical capaz de promover a autonomia\", enquanto escadas dificultam a locomoção reduzida e elevadores \"estão suscetíveis às falhas mecânicas\"."
  },
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que situação a rampa em Z é frequentemente utilizada?",
    "options": [
      "Em espaços estreitos, por ter duas seções retas conectadas por um patamar intermediário",
      "Apenas em edifícios tombados pelo patrimônio histórico",
      "Em espaços muito amplos e abertos",
      "Exclusivamente em rampas externas de estacionamentos"
    ],
    "correct_answer": "Em espaços estreitos, por ter duas seções retas conectadas por um patamar intermediário",
    "explanation": "O texto descreve a rampa em Z como tendo \"duas seções retas, conectadas por um patamar intermediário em forma de Z. Essa configuração é frequentemente utilizada em espaços estreitos\"."
  },
  {
    "page": 66,
    "difficulty": "hard",
    "prompt": "Segundo a NBR 9050 (ABNT, 2021b), citada no texto, qual a inclinação máxima permitida para rampas, e a que proporção aproximada isso corresponde?",
    "options": [
      "8,33%, aproximadamente 1:12",
      "5%, aproximadamente 1:20",
      "12,5%, aproximadamente 1:8",
      "15%, aproximadamente 1:6,5"
    ],
    "correct_answer": "8,33%, aproximadamente 1:12",
    "explanation": "O texto afirma: \"a inclinação máxima permitida para rampas é de 8,33% (ou aproximadamente 1:12)\"."
  },
  {
    "page": 68,
    "difficulty": "hard",
    "prompt": "Segundo o texto, em casos excepcionais de reforma, até qual inclinação máxima a NBR 9050 permite para rampas, além do limite padrão de 8,33%?",
    "options": [
      "Até 12,5%",
      "Até 8,33% apenas, sem exceção",
      "Até 20%",
      "Até 5%"
    ],
    "correct_answer": "Até 12,5%",
    "explanation": "O texto afirma: \"Em casos de reforma, se forem esgotadas as possibilidades de implantação da rampa nos requisitos referentes à Tabela 1, é permitido que se utilize inclinações superiores a 8,33% até 12,5%\"."
  },
  {
    "page": 68,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a largura mínima recomendada para uma rampa acessível, e qual a medida ainda mais recomendada para permitir circulação simultânea de cadeirante e pedestre?",
    "options": [
      "Mínimo 1,20 m; recomendado 1,50 m",
      "Mínimo 0,80 m; recomendado 1,00 m",
      "Mínimo 1,50 m; recomendado 2,00 m",
      "Mínimo 2,00 m; recomendado 2,50 m"
    ],
    "correct_answer": "Mínimo 1,20 m; recomendado 1,50 m",
    "explanation": "O texto afirma: \"A largura mínima recomendada para uma rampa acessível é de 1,20 metro, sendo que a medida recomendada é de 1,50 metro, afim de permitir que pessoas em cadeiras de rodas e pedestres possam transitar simultaneamente\"."
  },
  {
    "page": 71,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual a altura mínima do guarda-corpo em rampas internas, e qual a altura mínima quando a rampa externa ultrapassa 12 m de altura do solo?",
    "options": [
      "92 cm internas; 1,30 m quando externa ultrapassa 12 m",
      "70 cm internas; 92 cm quando externa ultrapassa 12 m",
      "1,05 m internas; 1,05 m em qualquer caso externo",
      "50 cm internas; 1,00 m externas em qualquer altura"
    ],
    "correct_answer": "92 cm internas; 1,30 m quando externa ultrapassa 12 m",
    "explanation": "O texto afirma: \"A altura do guarda-corpo em rampas internas às edificações é de, no mínimo, 92 cm... Em locais externos, quando a altura ultrapassar 12 m do solo, o guarda-corpo deve ser de, no mínimo, 1,30 m\"."
  },
  {
    "page": 74,
    "difficulty": "hard",
    "prompt": "Segundo a fórmula da NBR 9050 apresentada no texto (i = h x 100 / c), qual a inclinação resultante para uma rampa que vence um desnível de 0,80 m com 8 metros de comprimento disponível — e essa inclinação atende à norma?",
    "options": [
      "10%, o que excede o limite de 8,33% da norma",
      "8,33%, exatamente dentro do limite da norma",
      "5%, bem abaixo do limite permitido",
      "12,5%, dentro do limite excepcional de reforma"
    ],
    "correct_answer": "10%, o que excede o limite de 8,33% da norma",
    "explanation": "O texto calcula: \"i = (0,8 x 100) / 8 = 80 / 8 = 10%... o que está fora dos limites estabelecidos pela NBR 9050... que permite uma inclinação máxima de 8,33%\"."
  },
  {
    "page": 74,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para vencer um desnível de 0,80 m respeitando a inclinação máxima de 8,33% da NBR 9050, qual o comprimento necessário da rampa (excluindo patamares)?",
    "options": [
      "9,60 metros",
      "8,00 metros",
      "10,00 metros",
      "12,00 metros"
    ],
    "correct_answer": "9,60 metros",
    "explanation": "O texto calcula: \"c = (0,80 x 100 / 8,33) = 80 / 8,33 = 9,60 metros\", necessários para vencer o desnível de 0,80 m respeitando a inclinação máxima."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quando é utilizada a escada em \"L\"?",
    "options": [
      "Quando há mudança de direção no trajeto a 90 graus, com patamar intermediário — modelo muito utilizado em edifícios",
      "Apenas em residências térreas sem desnível algum",
      "Quando não há necessidade de patamar intermediário em nenhum ponto",
      "Exclusivamente em escadas de emergência externas"
    ],
    "correct_answer": "Quando há mudança de direção no trajeto a 90 graus, com patamar intermediário — modelo muito utilizado em edifícios",
    "explanation": "O texto descreve a escada em \"L\": \"tem um formato em 'L', é usada quando há mudança de direção no trajeto a 90º graus, com patamar intermediário em leque ou de descanso. Este modelo é muito utilizado em edifícios\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual tipo de elevador tem como característica um design com paredes de vidro na cabine, permitindo vista panorâmica?",
    "options": [
      "Elevador panorâmico",
      "Elevador de carga",
      "Elevador hidráulico",
      "Elevador elétrico convencional"
    ],
    "correct_answer": "Elevador panorâmico",
    "explanation": "O texto descreve: \"Elevadores panorâmicos: têm um design diferenciado, com paredes de vidro na cabine, permitindo uma vista panorâmica. Podem ser elétricos ou hidráulicos\"."
  },
  {
    "page": 38,
    "difficulty": "hard",
    "prompt": "Segundo o texto, por que um edifício nunca deve contar apenas com elevadores como único meio de circulação vertical?",
    "options": [
      "Devido ao baixo desempenho em situações de emergência e à possibilidade de inutilização por falta de energia ou danos mecânicos",
      "Porque elevadores são sempre mais lentos que escadas em qualquer situação",
      "Porque a legislação brasileira proíbe expressamente elevadores como único acesso",
      "Porque elevadores nunca atendem aos requisitos de acessibilidade da NBR 9050"
    ],
    "correct_answer": "Devido ao baixo desempenho em situações de emergência e à possibilidade de inutilização por falta de energia ou danos mecânicos",
    "explanation": "O texto afirma que \"um edifício nunca contará apenas com os elevadores como meio de circulação vertical devido ao baixo desempenho em situações de emergência, bem como em casos de inutilização do equipamento por conta de falta de energia, danos mecânicos\"."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a finalidade do piso tátil de alerta posicionado no início e no fim de uma escada?",
    "options": [
      "Orientar pessoas com deficiência, principalmente cegas, a perceberem com a bengala o relevo diferente que sinaliza o início e o fim da transposição vertical",
      "Indicar apenas o sentido de subida da escada",
      "Substituir a necessidade de corrimão em escadas estreitas",
      "Servir como acabamento estético, sem função de acessibilidade"
    ],
    "correct_answer": "Orientar pessoas com deficiência, principalmente cegas, a perceberem com a bengala o relevo diferente que sinaliza o início e o fim da transposição vertical",
    "explanation": "O texto explica que a sinalização do piso tátil de alerta \"deve ser incluída no projeto para orientar pessoas com deficiência, principalmente cegos, para atentar o início e ao final da transposição vertical ao perceber com a bengala esse relevo diferente no piso\"."
  },
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos mínimos devem ser identificados ao representar um elevador em planta baixa?",
    "options": [
      "As paredes externas, a cabine do elevador e a localização da porta",
      "Apenas a cabine e o motor",
      "O peso máximo suportado e a velocidade de deslocamento",
      "Somente a localização da porta"
    ],
    "correct_answer": "As paredes externas, a cabine do elevador e a localização da porta",
    "explanation": "O texto afirma que \"para representar os elevadores, é necessário identificar as paredes externas, a cabine do elevador e a localização da porta, pelo menos\"."
  },
  {
    "page": 60,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual a diferença entre a rampa em \"L\" e a rampa em \"U\"?",
    "options": [
      "A rampa em L faz um ângulo reto entre duas direções perpendiculares; a rampa em U tem uma curva suave para mudança de direção em 180 graus",
      "São o mesmo tipo de rampa, com nomes regionais diferentes",
      "A rampa em L é sempre externa; a rampa em U é sempre interna",
      "A rampa em U nunca tem patamar; a rampa em L sempre tem dois patamares"
    ],
    "correct_answer": "A rampa em L faz um ângulo reto entre duas direções perpendiculares; a rampa em U tem uma curva suave para mudança de direção em 180 graus",
    "explanation": "O texto descreve: a rampa em L \"faz um ângulo reto, proporcionando um caminho acessível em duas direções perpendiculares\"; a rampa em U \"possui uma curva suave em formato de U para permitir a mudança de direção em 180 graus\"."
  },
  {
    "page": 69,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9050, citada no texto, em quais duas alturas as rampas devem ser providas de corrimãos, em ambos os lados?",
    "options": [
      "70 cm e 92 cm",
      "50 cm e 100 cm",
      "80 cm e 1,20 m",
      "60 cm e 90 cm"
    ],
    "correct_answer": "70 cm e 92 cm",
    "explanation": "O texto afirma que \"a NBR 9050 estabelece que as rampas devem ser providas de corrimãos em duas alturas, 70 cm e 92 cm, em ambos os lados\"."
  },
  {
    "page": 21,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quais normas técnicas específicas (além da NBR 6492) são citadas para a execução de telhados?",
    "options": [
      "NBR 15575-5:2013, NBR 13858-1:1997 e NBR 7190:1997",
      "NBR 9050 e NBR 9077, apenas",
      "NBR 6118 e NBR 8800",
      "NBR 5410 e NBR 5626"
    ],
    "correct_answer": "NBR 15575-5:2013, NBR 13858-1:1997 e NBR 7190:1997",
    "explanation": "O texto cita: \"NBR 15575-5:2013 – Edificações habitacionais... Requisitos para os sistemas de coberturas; NBR 13858-1:1997 – Telhas de concreto... e NBR 7190:1997 – Projeto de estruturas de madeira\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é a \"empena\" ou \"oitão\" de uma cobertura?",
    "options": [
      "A parede lateral onde se apoia a cumeeira e que define a altura da cobertura",
      "O elemento que fixa os caibros nas terças",
      "A peça de acabamento que esconde caibros e vigas",
      "A linha inclinada formada pelo encontro dos planos"
    ],
    "correct_answer": "A parede lateral onde se apoia a cumeeira e que define a altura da cobertura",
    "explanation": "O texto define: \"Empena ou oitão: parede lateral onde se apoia a cumeeira e define a altura da cobertura\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos gráficos são usados numa planta de cobertura para indicar o sentido de caimento da água e o material da superfície?",
    "options": [
      "Setas para o sentido de caimento e hachuras para representar o material, com a porcentagem de inclinação indicada",
      "Apenas cores diferentes para cada tipo de telha, sem setas nem hachuras",
      "Somente números romanos identificando cada água do telhado",
      "Círculos concêntricos indicando a cumeeira"
    ],
    "correct_answer": "Setas para o sentido de caimento e hachuras para representar o material, com a porcentagem de inclinação indicada",
    "explanation": "O texto afirma que \"são utilizadas setas, indicando o sentido de caimento da água pluvial, hachuras para a representação do material, e a porcentagem de inclinação\"."
  }
],
};

// ---------------------------------------------------------------------------
// track_s03_projeto_arquitetura_cultural — Unidade 4 — Apresentação e detalhamento construtivo do anteprojeto
// ---------------------------------------------------------------------------
const projetoArquiteturaCultural = {
  trackId: "track_s03_projeto_arquitetura_cultural",
  lessonId: "lesson_projeto_arquitetura_cultural_u4",
  unitTitle: "Unidade 4 — Apresentação e detalhamento construtivo do anteprojeto",
  questions: [
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, o que o modelo físico consegue materializar com uma precisão que as representações bidimensionais não alcançam?",
    "options": [
      "Conceitos de forma, proporção e volume com precisão sensorial",
      "Apenas o custo estimado da obra",
      "Somente a paleta de cores da fachada",
      "O cronograma de execução da obra"
    ],
    "correct_answer": "Conceitos de forma, proporção e volume com precisão sensorial",
    "explanation": "O texto afirma que \"o modelo físico materializa conceitos de forma, proporção e volume com precisão sensorial que vai além das representações bidimensionais\" (Ching, 2013)."
  },
  {
    "page": 1,
    "difficulty": "hard",
    "prompt": "Segundo Neufert (2013), citado no texto, o que o estudo do terreno antecede no processo de projeto?",
    "options": [
      "Qualquer escolha volumétrica, garantindo que acessos, rampas, taludes e áreas de convivência sejam projetados com segurança",
      "A escolha do sistema estrutural apenas",
      "A definição do orçamento da obra",
      "A escolha da equipe de obra"
    ],
    "correct_answer": "Qualquer escolha volumétrica, garantindo que acessos, rampas, taludes e áreas de convivência sejam projetados com segurança",
    "explanation": "O texto afirma que \"Neufert (2013) reforça que o estudo do terreno antecede qualquer escolha volumétrica, garantindo que acessos, rampas, taludes e áreas de convivência sejam projetados de maneira segura e funcional\"."
  },
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Consalez e Bertazzoni (2001), citados no texto, de que a arquitetura cultural depende, e como a maquete contribui para isso?",
    "options": [
      "Depende de um discurso espacial claro, e a maquete contribui ao tornar palpáveis as decisões projetuais",
      "Depende exclusivamente do orçamento disponível",
      "Depende apenas da localização geográfica do terreno",
      "Depende do número de pavimentos do edifício"
    ],
    "correct_answer": "Depende de um discurso espacial claro, e a maquete contribui ao tornar palpáveis as decisões projetuais",
    "explanation": "O texto afirma que \"a arquitetura cultural depende de um discurso espacial claro, e a maquete contribui diretamente para a construção desse discurso ao tornar palpáveis as decisões projetuais\" (Consalez; Bertazzoni, 2001)."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Van Lengen (2021), citado no texto, o que é o modelo tridimensional, antes de tudo?",
    "options": [
      "Um pensamento construído, uma extensão do raciocínio espacial",
      "Apenas um instrumento de apresentação comercial",
      "Uma etapa dispensável em projetos de pequeno porte",
      "Um substituto definitivo para o desenho técnico"
    ],
    "correct_answer": "Um pensamento construído, uma extensão do raciocínio espacial",
    "explanation": "O texto afirma que \"Van Lengen (2021) afirma que o modelo tridimensional é, antes de tudo, um pensamento construído, uma extensão do raciocínio espacial\"."
  },
  {
    "page": 3,
    "difficulty": "hard",
    "prompt": "Segundo Neufert (2013), citado no texto, o que significa \"compreender a topografia\" no contexto de projetos culturais situados em parques ou centros históricos?",
    "options": [
      "Compreender a lógica do assentamento arquitetônico, essencial em cenários que exigem decisões sensíveis de implantação, drenagem e acessibilidade",
      "Compreender apenas a orientação solar do terreno",
      "Compreender exclusivamente o tipo de solo para fundação",
      "Compreender somente os limites legais do lote"
    ],
    "correct_answer": "Compreender a lógica do assentamento arquitetônico, essencial em cenários que exigem decisões sensíveis de implantação, drenagem e acessibilidade",
    "explanation": "O texto afirma que \"compreender a topografia é compreender a lógica do assentamento arquitetônico, algo essencial em projetos culturais situados em parques, centros históricos ou áreas simbólicas\" (Neufert, 2013)."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Montaner (2007), citado no texto, o que os edifícios culturais precisam comunicar, além de sua função prática?",
    "options": [
      "Suas intenções também por meio da forma",
      "Apenas o nome do arquiteto responsável",
      "Somente o custo de manutenção previsto",
      "Exclusivamente sua data de construção"
    ],
    "correct_answer": "Suas intenções também por meio da forma",
    "explanation": "O texto afirma que \"Montaner (2007) destaca que edifícios culturais precisam comunicar suas intenções também por meio da forma, e o modelo tridimensional evidencia essa intenção de maneira direta\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Knoll e Hechinger (2003), citados no texto, o que o trabalho manual de construção da maquete devolve ao arquiteto?",
    "options": [
      "A dimensão sensorial do espaço — textura, profundidade e escala perceptíveis em camadas físicas",
      "A capacidade de calcular estruturas com precisão",
      "A aprovação automática do projeto por órgãos públicos",
      "A dispensa total do uso de softwares de modelagem"
    ],
    "correct_answer": "A dimensão sensorial do espaço — textura, profundidade e escala perceptíveis em camadas físicas",
    "explanation": "O texto afirma que \"Knoll e Hechinger (2003) argumentam que o trabalho manual devolve ao arquiteto a dimensão sensorial do espaço: textura, profundidade e escala tornam-se mais perceptíveis quando materializadas em camadas físicas\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, para que diversos escritórios contemporâneos utilizam modelos físicos rápidos?",
    "options": [
      "Para testar alternativas formais antes mesmo de trabalhar no ambiente digital",
      "Para substituir definitivamente o uso de qualquer software",
      "Para reduzir o número de reuniões com o cliente",
      "Para cumprir uma exigência obrigatória da NBR 6492"
    ],
    "correct_answer": "Para testar alternativas formais antes mesmo de trabalhar no ambiente digital",
    "explanation": "O texto afirma que escritórios \"utilizam modelos rápidos para testar alternativas formais antes mesmo de trabalhar no ambiente digital (Littlefield, 2014)\"."
  },
  {
    "page": 5,
    "difficulty": "hard",
    "prompt": "Segundo Van Lengen (2021), citado no texto, como a arquitetura se revela, e qual o papel da maquete nesse processo?",
    "options": [
      "A arquitetura só se revela por meio da vivência corporal, e a maquete é um ensaio dessa vivência",
      "A arquitetura se revela apenas através de renderizações digitais fotorrealistas",
      "A arquitetura se revela exclusivamente pela análise de custos da obra",
      "A maquete não tem relação alguma com a vivência do espaço"
    ],
    "correct_answer": "A arquitetura só se revela por meio da vivência corporal, e a maquete é um ensaio dessa vivência",
    "explanation": "O texto afirma: \"A arquitetura só se revela por meio da vivência corporal, e a maquete é um ensaio dessa vivência (Van Lengen, 2021)\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, o que a modelagem física permite visualizar em relação às decisões de posição, recuo ou corte no terreno?",
    "options": [
      "Essas relações de modo imediato e intuitivo, fundamental na tomada de decisão arquitetônica",
      "Apenas o resultado final já construído",
      "Somente o impacto financeiro da obra",
      "Exclusivamente a vista aérea do projeto"
    ],
    "correct_answer": "Essas relações de modo imediato e intuitivo, fundamental na tomada de decisão arquitetônica",
    "explanation": "O texto afirma que \"Ching (2013) enfatiza que a modelagem física permite visualizar essas relações de modo imediato e intuitivo, algo fundamental na tomada de decisão arquitetônica\"."
  },
  {
    "page": 6,
    "difficulty": "hard",
    "prompt": "Segundo o texto, que tipo de problemas a maquete revela que raramente aparecem em desenhos bidimensionais?",
    "options": [
      "Conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade",
      "Apenas erros ortográficos em legendas",
      "Somente questões de escala do desenho técnico",
      "Exclusivamente problemas de cor do material especificado"
    ],
    "correct_answer": "Conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade",
    "explanation": "O texto afirma que \"a maquete revela problemas ocultos que raramente aparecem em desenhos: conflitos de geometria, volumes desproporcionais, tensões de circulação, falhas de continuidade ou dificuldades de acessibilidade\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Consalez e Bertazzoni (2001), citados no texto, o que o modelo físico registra ao longo do processo criativo?",
    "options": [
      "A memória do processo — versões intermediárias, soluções testadas, arranjos descartados e caminhos projetuais",
      "Apenas o peso final dos materiais utilizados",
      "Somente o tempo total gasto na construção da maquete",
      "Exclusivamente o nome dos alunos que participaram"
    ],
    "correct_answer": "A memória do processo — versões intermediárias, soluções testadas, arranjos descartados e caminhos projetuais",
    "explanation": "O texto afirma que \"o modelo físico também registra a memória do processo criativo. Ele guarda versões intermediárias, soluções testadas, arranjos descartados e caminhos projetuais\" (Consalez; Bertazzoni, 2001)."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, de que depende a leitura antecipada de percursos, entradas, rampas e áreas de dispersão em espaços de grande público?",
    "options": [
      "Para garantir fluidez, conforto e segurança",
      "Apenas para reduzir o custo do projeto",
      "Somente para cumprir exigência estética",
      "Para eliminar a necessidade de sinalização"
    ],
    "correct_answer": "Para garantir fluidez, conforto e segurança",
    "explanation": "O texto afirma que \"espaços de grande público dependem dessa leitura antecipada para garantir fluidez, conforto e segurança (Littlefield, 2014)\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "No desafio do centro de artes e eventos apresentado no texto, qual a área do terreno e quais normas da ABNT devem ser atendidas?",
    "options": [
      "Terreno de 6.000 m²; normas NBR 6492 e NBR 9050",
      "Terreno de 3.000 m²; normas NBR 9077 e NBR 15575",
      "Terreno de 10.000 m²; apenas a NBR 9050",
      "Terreno de 1.500 m²; nenhuma norma específica citada"
    ],
    "correct_answer": "Terreno de 6.000 m²; normas NBR 6492 e NBR 9050",
    "explanation": "O texto descreve um \"terreno de 6.000 m²... atendendo às normas da ABNT (NBR 6492 e NBR 9050) e às exigências do Plano Diretor Municipal\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo Kevin Lynch (1997) e Gordon Cullen (1961), citados no texto, de que depende a experiência espacial do usuário?",
    "options": [
      "Da clareza perceptiva, da legibilidade e da capacidade do ambiente de oferecer respostas sensoriais harmônicas",
      "Exclusivamente do custo dos materiais de acabamento",
      "Somente da orientação geográfica do edifício",
      "Apenas do número de pavimentos da construção"
    ],
    "correct_answer": "Da clareza perceptiva, da legibilidade e da capacidade do ambiente de oferecer respostas sensoriais harmônicas",
    "explanation": "O texto afirma que os autores \"destacam que a experiência espacial depende da clareza perceptiva, da legibilidade e da capacidade do ambiente de oferecer respostas sensoriais harmônicas\"."
  },
  {
    "page": 9,
    "difficulty": "hard",
    "prompt": "No cenário do centro cultural municipal descrito no texto, quais são os valores de temperatura, umidade relativa e nível de ruído externo registrados como problema?",
    "options": [
      "Temperaturas acima de 29°C, umidade entre 30 e 75%, ruído com picos de 65 dB",
      "Temperaturas acima de 35°C, umidade entre 10 e 20%, ruído com picos de 40 dB",
      "Temperaturas acima de 20°C, umidade entre 50 e 90%, ruído com picos de 80 dB",
      "Temperaturas acima de 25°C, umidade entre 60 e 100%, ruído com picos de 50 dB"
    ],
    "correct_answer": "Temperaturas acima de 29°C, umidade entre 30 e 75%, ruído com picos de 65 dB",
    "explanation": "O texto descreve: \"as temperaturas internas ultrapassam 29 °C no período da tarde, a umidade relativa varia entre 30 e 75%, e o nível de ruído externo atinge picos de 65 dB\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo Frota e Schiffer (2007), citados no texto, o que a iluminação natural é capaz de formar e reforçar num espaço cultural?",
    "options": [
      "Atmosferas, percursos e elementos arquitetônicos em destaque",
      "Apenas a temperatura interna do ambiente",
      "Somente a acústica dos corredores",
      "Exclusivamente o valor de revenda do imóvel"
    ],
    "correct_answer": "Atmosferas, percursos e elementos arquitetônicos em destaque",
    "explanation": "O texto afirma que \"a iluminação natural é analisada considerando sua capacidade de formar atmosferas, reforçar percursos e destacar elementos arquitetônicos, conforme discutido por Frota e Schiffer (2007)\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, com apoio de que ferramenta os materiais de absorção, difusão e isolamento acústico são analisados?",
    "options": [
      "Modelos 3D, que permitem prever como o som se comportará nos diferentes setores",
      "Ensaios laboratoriais obrigatórios em todos os projetos",
      "Apenas relatórios técnicos sem simulação",
      "Cálculos manuais sem qualquer apoio visual"
    ],
    "correct_answer": "Modelos 3D, que permitem prever como o som se comportará nos diferentes setores",
    "explanation": "O texto afirma que \"materiais de absorção, difusão e isolamento são analisados com apoio dos modelos 3D, permitindo prever como o som se comportará nos diferentes setores (Ching, 2013)\"."
  },
  {
    "page": 11,
    "difficulty": "hard",
    "prompt": "Segundo Pinheiro e Crivelaro (2014), citados no texto, quais faixas de temperatura e umidade relativa são consideradas ideais para conforto prolongado em ambientes culturais de uso coletivo?",
    "options": [
      "Temperaturas entre 23 e 26 ºC, com umidade relativa entre 40 e 60%",
      "Temperaturas entre 18 e 20 ºC, com umidade relativa entre 20 e 30%",
      "Temperaturas entre 28 e 32 ºC, com umidade relativa entre 70 e 90%",
      "Temperaturas entre 15 e 18 ºC, com umidade relativa entre 80 e 100%"
    ],
    "correct_answer": "Temperaturas entre 23 e 26 ºC, com umidade relativa entre 40 e 60%",
    "explanation": "O texto afirma que \"pesquisas de ergonomia ambiental apontam que temperaturas internas entre 23 e 26 ºC, com umidade relativa controlada entre 40 e 60%, são ideais para conforto prolongado\" (Pinheiro; Crivelaro, 2014)."
  },
  {
    "page": 12,
    "difficulty": "hard",
    "prompt": "Segundo Frota e Schiffer (2007), citados no texto, em quanto a ventilação cruzada pode reduzir o uso de climatização artificial, segundo estudos brasileiros de eficiência energética?",
    "options": [
      "Até 30%",
      "Até 10%",
      "Até 50%",
      "Até 70%"
    ],
    "correct_answer": "Até 30%",
    "explanation": "O texto afirma que \"Frota e Schiffer (2007) discorrem sobre estratégias de ventilação cruzada que podem reduzir até 30% o uso de climatização artificial, segundo estudos brasileiros de eficiência energética\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a faixa de nível de pressão sonora exigida em ambientes culturais para leitura, exposição e concentração?",
    "options": [
      "Entre 35 e 50 dB",
      "Entre 60 e 80 dB",
      "Entre 10 e 20 dB",
      "Entre 90 e 100 dB"
    ],
    "correct_answer": "Entre 35 e 50 dB",
    "explanation": "O texto afirma que \"ambientes culturais exigem níveis de pressão sonora entre 35 e 50 dB para leitura, exposição e concentração\"."
  },
  {
    "page": 12,
    "difficulty": "hard",
    "prompt": "Segundo a ABNT NBR 9050 (2020), citada no texto, qual o contraste mínimo de luminância recomendado entre planos verticais e horizontais para orientar pessoas com baixa visão?",
    "options": [
      "30%",
      "10%",
      "50%",
      "70%"
    ],
    "correct_answer": "30%",
    "explanation": "O texto afirma que \"a ABNT NBR 9050 (2020) recomenda que o contraste de luminância seja de, no mínimo, 30% entre planos verticais e horizontais, assegurando orientação para pessoas com baixa visão\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo o texto, a partir de qual nível de ruído a percepção espacial de idosos pode ser comprometida, exigindo materiais amortecedores e pisos resilientes?",
    "options": [
      "Acima de 55 dB",
      "Acima de 20 dB",
      "Acima de 90 dB",
      "Acima de 35 dB"
    ],
    "correct_answer": "Acima de 55 dB",
    "explanation": "O texto afirma que \"níveis de ruído acima de 55 dB podem comprometer a percepção espacial de idosos, exigindo materiais amortecedores, pisos resilientes e tratamento de forro\"."
  },
  {
    "page": 13,
    "difficulty": "hard",
    "prompt": "Segundo estudos de microclima urbano citados no texto, em quanto elementos vegetados podem reduzir a temperatura superficial externa?",
    "options": [
      "Em até 8 ºC",
      "Em até 2 ºC",
      "Em até 15 ºC",
      "Em até 1 ºC"
    ],
    "correct_answer": "Em até 8 ºC",
    "explanation": "O texto afirma que \"elementos vegetados podem reduzir a temperatura superficial externa em até 8 ºC, segundo estudos de microclima urbano\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais estratégias registradas no memorial descritivo podem contribuir para reduções de 20 a 35% no consumo de energia anual?",
    "options": [
      "Lâmpadas LED de alta eficiência, sensores de presença, painéis fotovoltaicos integrados e sistemas de automação",
      "Apenas a troca de vidros por modelos comuns",
      "Somente a pintura externa de cor clara",
      "Exclusivamente a redução do pé-direito dos ambientes"
    ],
    "correct_answer": "Lâmpadas LED de alta eficiência, sensores de presença, painéis fotovoltaicos integrados e sistemas de automação",
    "explanation": "O texto afirma que \"registrar no memorial estratégias como lâmpadas LED de alta eficiência, sensores de presença, painéis fotovoltaicos integrados e sistemas de automação contribui para reduções que podem variar entre 20 e 35% no consumo anual\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, o que o arquiteto assegura na fase de detalhamento do projeto?",
    "options": [
      "A fidelidade entre o que foi idealizado e o que será construído, com ênfase no controle de custos e clareza técnica",
      "Apenas a aprovação do projeto pela prefeitura",
      "Somente a escolha da paleta de cores final",
      "Exclusivamente o cronograma de divulgação da obra"
    ],
    "correct_answer": "A fidelidade entre o que foi idealizado e o que será construído, com ênfase no controle de custos e clareza técnica",
    "explanation": "O texto afirma que, segundo Littlefield (2014), \"é nesse momento que o arquiteto assegura a fidelidade entre o que foi idealizado e o que será construído, com ênfase no controle de custos, na clareza da informação técnica e na redução de improvisos em obra\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo Ching e Eckler (2013), citados no texto, como devem operar os sistemas construtivos, os materiais e as decisões formais no detalhamento?",
    "options": [
      "Em interdependência, garantindo legibilidade e coerência espacial",
      "De forma totalmente independente entre si",
      "Apenas conforme a disponibilidade de mão de obra local",
      "Exclusivamente segundo o orçamento máximo definido"
    ],
    "correct_answer": "Em interdependência, garantindo legibilidade e coerência espacial",
    "explanation": "O texto afirma que \"Ching e Eckler (2013) destacam que os sistemas construtivos, os materiais e as decisões formais devem operar em interdependência, garantindo legibilidade e coerência espacial\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a NBR 6492 (ABNT, 2020) define no contexto do detalhamento de projetos culturais?",
    "options": [
      "Padrões de simbologias, escalas e conteúdo para comunicação entre equipes multidisciplinares",
      "Os requisitos estruturais de fundações profundas",
      "Os parâmetros de conforto acústico de auditórios",
      "O dimensionamento de sistemas de climatização"
    ],
    "correct_answer": "Padrões de simbologias, escalas e conteúdo para comunicação entre equipes multidisciplinares",
    "explanation": "O texto afirma que \"a NBR 6492 (ABNT, 2020) define padrões de simbologias, escalas e conteúdo para comunicação entre equipes multidisciplinares\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Van Lengen (2021), citado no texto, como devem ser os processos construtivos em relação ao ambiente em que se inserem?",
    "options": [
      "Apropriados ao ambiente, facilitando a manutenção e ampliando a durabilidade",
      "Padronizados globalmente, sem adaptação regional",
      "Baseados exclusivamente no menor custo possível",
      "Escolhidos apenas pela estética, sem relação com o clima"
    ],
    "correct_answer": "Apropriados ao ambiente, facilitando a manutenção e ampliando a durabilidade",
    "explanation": "O texto afirma que \"Van Lengen (2021) reforça que os processos construtivos devem ser apropriados ao ambiente em que se inserem, facilitando a manutenção e ampliando a durabilidade\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Tamura (2020), citado no texto, como a sustentabilidade deve ser tratada no detalhamento de um projeto cultural?",
    "options": [
      "Como princípio formador do edifício, e não como acessório",
      "Como um item opcional a ser considerado apenas se houver orçamento extra",
      "Exclusivamente como exigência legal sem impacto de projeto",
      "Apenas na fase de manutenção pós-entrega da obra"
    ],
    "correct_answer": "Como princípio formador do edifício, e não como acessório",
    "explanation": "O texto afirma que \"Tamura (2020) aponta que estratégias sustentáveis devem ser incorporadas desde o detalhamento... reforçando que a sustentabilidade não é acessório, mas princípio formador do edifício\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Neufert (2013), citado no texto, por que antecipar as soluções de conforto acústico (salas de música, auditórios, galerias) já no detalhamento?",
    "options": [
      "Porque evita correções improvisadas durante a obra, que normalmente resultam em desperdício de recursos e comprometem a qualidade cultural do espaço",
      "Porque é uma exigência exclusiva de auditórios com mais de 500 lugares",
      "Porque reduz o número de reuniões necessárias com o cliente",
      "Porque dispensa o uso de qualquer material acústico especial"
    ],
    "correct_answer": "Porque evita correções improvisadas durante a obra, que normalmente resultam em desperdício de recursos e comprometem a qualidade cultural do espaço",
    "explanation": "O texto afirma que \"Neufert (2013) ressalta que antecipar essas soluções no detalhamento evita correções improvisadas durante a obra, que normalmente resultam em desperdícios de recursos e comprometem a qualidade cultural do espaço\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo Ching e Eckler (2013), citados no texto, o que o design detalhado do mobiliário expositivo contribui para transformar?",
    "options": [
      "O espaço em mediador entre conhecimento e público, contribuindo para a compreensão do conteúdo cultural",
      "Apenas o custo total do projeto de interiores",
      "Somente a estética da recepção do edifício",
      "Exclusivamente a durabilidade das peças de mobiliário"
    ],
    "correct_answer": "O espaço em mediador entre conhecimento e público, contribuindo para a compreensão do conteúdo cultural",
    "explanation": "O texto afirma que \"o design detalhado do mobiliário contribui para a compreensão do conteúdo cultural, transformando o espaço em mediador entre conhecimento e público\" (Ching; Eckler, 2013)."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, como devem ser os sistemas de segurança (alarmes, sensores, câmeras) em um espaço cultural?",
    "options": [
      "Eficientes mas discretos, sem se tornarem elementos que deixem o ambiente desconfortável ou ameaçador",
      "Sempre visíveis e ostensivos, para funcionar como dissuasão",
      "Instalados apenas nas áreas de acervo, nunca em áreas de circulação",
      "Dispensáveis em edificações públicas de pequeno porte"
    ],
    "correct_answer": "Eficientes mas discretos, sem se tornarem elementos que deixem o ambiente desconfortável ou ameaçador",
    "explanation": "O texto afirma que os sistemas de segurança \"devem garantir proteção ao público e ao acervo, mas sem se tornar elementos que deixem o ambiente desconfortável ou ameaçador. Littlefield (2014) lembra que a qualidade do uso depende de escolhas discretas, mas eficientes\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Abbud (2006), citado no texto, qual o papel da paisagem em um projeto cultural?",
    "options": [
      "Emocionar e acolher, promovendo encontros e fortalecendo a relação entre o edifício e a comunidade",
      "Servir apenas como barreira visual para a rua",
      "Reduzir exclusivamente o custo de manutenção externa",
      "Substituir a necessidade de qualquer área coberta"
    ],
    "correct_answer": "Emocionar e acolher, promovendo encontros e fortalecendo a relação entre o edifício e a comunidade",
    "explanation": "O texto afirma que \"Abbud (2006) reforça que a paisagem deve emocionar e acolher, promovendo encontros e fortalecendo a relação entre o edifício e a comunidade\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto (ABNT, 2021), quais formatos de prancha são os mais adotados na fase de apresentação de um projeto, por acomodarem melhor informações, imagens e diagramas?",
    "options": [
      "A1 e A0",
      "A3 e A4",
      "A2 apenas",
      "A5 e A6"
    ],
    "correct_answer": "A1 e A0",
    "explanation": "O texto afirma que \"os formatos de pranchas seguem padronizações internacionais, sendo A1 e A0 os mais adotados na fase de apresentação, devido à maior capacidade de acomodar informações, imagens e diagramas (ABNT, 2021)\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Neufert (2013), citado no texto, como costuma evoluir uma apresentação eficiente de projeto, do início ao detalhamento?",
    "options": [
      "Do conceito geral para o detalhamento construtivo, passando por análises urbanas, plantas, cortes, fachadas e perspectivas",
      "Do detalhamento construtivo direto para o conceito geral, sem etapas intermediárias",
      "Apenas com uma única imagem 3D final, sem plantas nem cortes",
      "Começando pelas fachadas e terminando pelo estudo urbano"
    ],
    "correct_answer": "Do conceito geral para o detalhamento construtivo, passando por análises urbanas, plantas, cortes, fachadas e perspectivas",
    "explanation": "O texto afirma que \"Neufert (2013) observa que uma apresentação eficiente costuma evoluir do conceito geral para o detalhamento construtivo, passando por análises urbanas, plantas, cortes, fachadas, fluxos de circulação e perspectivas\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (2001), citado no texto, o que o desenho representa ao selecionar o que vai ou não figurar nas pranchas?",
    "options": [
      "Um raciocínio visual, evidenciando o essencial para compreender as intenções do projetista",
      "Apenas uma etapa burocrática sem valor comunicativo",
      "Exclusivamente uma exigência contratual do cliente",
      "Um processo que deve ser totalmente automatizado por software"
    ],
    "correct_answer": "Um raciocínio visual, evidenciando o essencial para compreender as intenções do projetista",
    "explanation": "O texto afirma que \"Montenegro (2001) enfatiza que o desenho atua como raciocínio visual: ao selecionar o que vai ou não figurar nas pranchas, o projetista evidencia o essencial para compreender suas intenções\"."
  },
  {
    "page": 25,
    "difficulty": "hard",
    "prompt": "Segundo Cullen (1961), citado no texto, de que decorre o impacto visual de uma composição gráfica, aplicável ao layout de pranchas?",
    "options": [
      "Das relações de contraste, ritmo e enquadramento",
      "Exclusivamente da quantidade de texto presente",
      "Apenas do uso de cores vibrantes em toda a prancha",
      "Somente do tamanho do papel utilizado"
    ],
    "correct_answer": "Das relações de contraste, ritmo e enquadramento",
    "explanation": "O texto afirma que \"Cullen (1961) contribui ao reforçar que o impacto visual decorre das relações de contraste, ritmo e enquadramento, princípios que podem ser traduzidos para o layout das pranchas\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a NBR 6492:2021 padroniza especificamente na apresentação técnica das pranchas de um projeto cultural?",
    "options": [
      "Cotas, níveis, simbologias, espessuras e eixos, garantindo compatibilidade e compreensão universal do projeto",
      "Apenas a paleta de cores permitida nas pranchas",
      "Somente o tipo de papel a ser utilizado na impressão",
      "Exclusivamente o nome da equipe responsável"
    ],
    "correct_answer": "Cotas, níveis, simbologias, espessuras e eixos, garantindo compatibilidade e compreensão universal do projeto",
    "explanation": "O texto afirma que \"a apresentação técnica deve observar rigor normativo... cotas, níveis, simbologias, espessuras e eixos seguem parâmetros padronizados segundo a NBR 6492:2021\"."
  },
  {
    "page": 27,
    "difficulty": "medium",
    "prompt": "Segundo Braga (2020), citado no texto, como deve ser a narrativa gráfica das pranchas de apresentação?",
    "options": [
      "Fluida e estrategicamente estruturada, conduzindo o olhar por hierarquias visuais que destacam o essencial",
      "Totalmente livre, sem qualquer estruturação prévia",
      "Baseada exclusivamente em textos longos e detalhados",
      "Restrita a uma única imagem por prancha"
    ],
    "correct_answer": "Fluida e estrategicamente estruturada, conduzindo o olhar por hierarquias visuais que destacam o essencial",
    "explanation": "O texto afirma que \"Braga (2020) ressalta que a narrativa gráfica deve ser fluida e estrategicamente estruturada, conduzindo o olhar por meio de hierarquias visuais que destacam o essencial sem suprimir o detalhamento\"."
  },
  {
    "page": 24,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quais são os três eixos interdependentes que estruturam a comunicação de um projeto em pranchas?",
    "options": [
      "Tipos e formatos de pranchas, diagramação e narrativa",
      "Planta, corte e elevação, apenas",
      "Orçamento, cronograma e equipe técnica",
      "Estrutura, instalações e acabamentos"
    ],
    "correct_answer": "Tipos e formatos de pranchas, diagramação e narrativa",
    "explanation": "O texto afirma: \"Os três eixos: tipos e formatos de pranchas, diagramação e narrativa, devem ser compreendidos como partes interdependentes da comunicação do projeto\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "No exercício final da unidade, descrito no texto, quais são as duas opções de terreno disponibilizadas para o centro cultural comunitário e educativo?",
    "options": [
      "Um lote em esquina com forte incidência solar e intensa circulação de veículos; e um lote interno de quadra com declive acentuado e árvores consolidadas",
      "Dois lotes de esquina idênticos em bairros diferentes",
      "Um terreno litorâneo e outro em zona rural",
      "Um terreno já edificado e outro totalmente vazio sem infraestrutura"
    ],
    "correct_answer": "Um lote em esquina com forte incidência solar e intensa circulação de veículos; e um lote interno de quadra com declive acentuado e árvores consolidadas",
    "explanation": "O texto descreve: \"Um lote em esquina, com pouca vegetação, forte incidência solar à tarde e intensa circulação de veículos\" e \"Um lote interno de quadra, com declive acentuado, presença de árvores consolidadas e fluxo mais calmo de pedestres\"."
  },
  {
    "page": 31,
    "difficulty": "hard",
    "prompt": "Na \"Solução 1 – Estratégia de acolhimento e proteção\" descrita no texto para o terreno de esquina, quais elementos de conforto ambiental são propostos?",
    "options": [
      "Brises, marquises, vegetação densa e ventilação cruzada, com pátios internos protegidos",
      "Apenas grandes superfícies envidraçadas sem qualquer proteção solar",
      "Exclusivamente climatização artificial de alta potência",
      "Somente pintura escura para absorção de calor"
    ],
    "correct_answer": "Brises, marquises, vegetação densa e ventilação cruzada, com pátios internos protegidos",
    "explanation": "O texto descreve que, no terreno de esquina, \"o conforto ambiental é trabalhado com brises, marquises, vegetação densa e ventilação cruzada\", com \"pátios internos protegidos\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Na \"Solução 2 – Estratégia de abertura e integração\" descrita no texto, como o edifício no terreno de esquina é concebido para criar espaço público de encontro?",
    "options": [
      "Como uma ponte urbana, com vazio térreo generoso que abriga feiras, apresentações e encontros comunitários",
      "Como um bloco fechado sem qualquer área térrea livre",
      "Exclusivamente como estacionamento subterrâneo",
      "Como um volume enterrado sem relação com a rua"
    ],
    "correct_answer": "Como uma ponte urbana, com vazio térreo generoso que abriga feiras, apresentações e encontros comunitários",
    "explanation": "O texto descreve que, na Solução 2, \"o edifício funciona como ponte urbana, criando um vazio térreo generoso que abriga feiras, apresentações e encontros comunitários\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo o texto (Ponto de Chegada da unidade), o que o memorial descritivo faz com as decisões formais, funcionais, construtivas e ambientais do projeto?",
    "options": [
      "Dá voz, sentido e responsabilidade a essas decisões, explicando e justificando o projeto",
      "Apenas lista o custo de cada material especificado",
      "Serve somente como documento de arquivo sem uso prático",
      "Substitui integralmente a necessidade de plantas e cortes"
    ],
    "correct_answer": "Dá voz, sentido e responsabilidade a essas decisões, explicando e justificando o projeto",
    "explanation": "O texto afirma que no memorial descritivo \"suas decisões formais, funcionais, construtivas e ambientais ganham voz, sentido e responsabilidade\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo o texto, ao elaborar as pranchas de apresentação, em que sequência lógica as informações devem ser organizadas?",
    "options": [
      "Contexto, implantação, volumetria, conforto ambiental, detalhes, paisagismo e síntese final",
      "Síntese final primeiro, seguida de detalhes técnicos isolados",
      "Apenas volumetria e fachadas, sem contexto urbano",
      "Paisagismo primeiro, seguido de qualquer outra informação"
    ],
    "correct_answer": "Contexto, implantação, volumetria, conforto ambiental, detalhes, paisagismo e síntese final",
    "explanation": "O texto recomenda organizar \"as informações em uma sequência lógica: contexto, implantação, volumetria, conforto ambiental, detalhes, paisagismo e síntese final, garantindo unidade visual e legibilidade\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo Lynch (1997), citado no texto, o que o uso do 3D potencializa a representação, permitindo visualizar contrastes, continuidade, limites e conexões?",
    "options": [
      "A \"imagem ambiental\"",
      "O orçamento total da obra",
      "O cronograma físico-financeiro",
      "A lista de materiais especificados"
    ],
    "correct_answer": "A \"imagem ambiental\"",
    "explanation": "O texto afirma que \"o uso do 3D potencializa a representação do que Lynch (1997) chama de 'imagem ambiental', permitindo visualizar contrastes, continuidade, limites e conexões que também influenciam o desempenho físico do espaço\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que deve orientar a NBR 9050:2020 na definição do mobiliário arquitetônico de um centro cultural?",
    "options": [
      "Alturas, profundidades, vãos, apoios e áreas de aproximação, assegurando uso democrático a crianças, idosos e pessoas com deficiência",
      "Apenas a cor e o material de acabamento das peças",
      "Somente o preço de fabricação de cada peça de mobiliário",
      "Exclusivamente o estilo decorativo do arquiteto responsável"
    ],
    "correct_answer": "Alturas, profundidades, vãos, apoios e áreas de aproximação, assegurando uso democrático a crianças, idosos e pessoas com deficiência",
    "explanation": "O texto afirma que \"a NBR 9050:2020 deve orientar alturas, profundidades, vãos, apoios e áreas de aproximação, assegurando uso democrático a crianças, idosos e pessoas com deficiência\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos são citados como exemplos de equipamentos urbanos que ampliam a conexão entre a arquitetura cultural e a cidade?",
    "options": [
      "Bicicletários, sinalização, iluminação pública e áreas de convivência",
      "Apenas vagas de estacionamento privativo",
      "Somente grades de proteção perimetral",
      "Exclusivamente antenas de telecomunicação"
    ],
    "correct_answer": "Bicicletários, sinalização, iluminação pública e áreas de convivência",
    "explanation": "O texto afirma que \"os equipamentos urbanos, quando integrados ao detalhamento, ampliam a conexão entre a arquitetura cultural e a cidade. Bicicletários, sinalização, iluminação pública e áreas de convivência tornam o entorno ativo e seguro\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo Ching e Eckler (2013), citados no texto, o que a representação gráfica de um projeto cultural deve fazer, além de mostrar informações técnicas?",
    "options": [
      "Instigar a imaginação e revelar atmosferas, indicando como as pessoas irão perceber, ocupar e experienciar o espaço",
      "Apenas cumprir requisitos mínimos de aprovação legal",
      "Substituir totalmente a necessidade de uma maquete física",
      "Ser restrita exclusivamente a desenhos em preto e branco"
    ],
    "correct_answer": "Instigar a imaginação e revelar atmosferas, indicando como as pessoas irão perceber, ocupar e experienciar o espaço",
    "explanation": "O texto afirma que \"Ching e Eckler (2013) afirmam que a representação gráfica deve instigar a imaginação e revelar atmosferas, indicando como as pessoas irão perceber, ocupar e experienciar o espaço\"."
  }
],
};

// ---------------------------------------------------------------------------
// track_s03_informatica_projecoes_ortogonais — Unidade 4 — Configurando impressão e plotagem
// ---------------------------------------------------------------------------
const informaticaProjecoesOrtogonais = {
  trackId: "track_s03_informatica_projecoes_ortogonais",
  lessonId: "lesson_informatica_projecoes_ortogonais_u4",
  unitTitle: "Unidade 4 — Configurando impressão e plotagem",
  questions: [
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é um TEMPLATE no AutoCAD?",
    "options": [
      "Um arquivo-base que contém todas as configurações necessárias para iniciar um projeto de maneira organizada e padronizada",
      "Um comando para desenhar paredes automaticamente",
      "Um tipo de impressora específica para plantas arquitetônicas",
      "Um plugin de renderização fotorrealista"
    ],
    "correct_answer": "Um arquivo-base que contém todas as configurações necessárias para iniciar um projeto de maneira organizada e padronizada",
    "explanation": "O texto define: \"Um template é um arquivo-base que contém todas as configurações necessárias para iniciar um projeto de maneira organizada e padronizada\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, com qual extensão de arquivo um template do AutoCAD deve ser salvo?",
    "options": [
      ".dwt",
      ".dwg",
      ".dxf",
      ".pdf"
    ],
    "correct_answer": ".dwt",
    "explanation": "O texto afirma: \"Salva esse arquivo com extensão .dwt\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as vantagens principais de usar TEMPLATES?",
    "options": [
      "Agilidade na abertura de projetos, redução de erros, padronização gráfica e melhora na comunicação com o cliente",
      "Apenas reduzir o tamanho do arquivo final",
      "Somente permitir impressão em cores diferentes",
      "Exclusivamente acelerar a renderização 3D"
    ],
    "correct_answer": "Agilidade na abertura de projetos, redução de erros, padronização gráfica e melhora na comunicação com o cliente",
    "explanation": "O texto lista: \"Agilidade na abertura de novos projetos. Redução de erros de configuração. Padronização gráfica. Melhora na comunicação entre equipe e cliente. Organização interna do escritório\"."
  },
  {
    "page": 3,
    "difficulty": "hard",
    "prompt": "De acordo com Oliveira, Baldam e Costa (2011), citados no texto, o que um template deve conter ao ser criado?",
    "options": [
      "Unidades e precisão, layers padronizados, estilos de texto, estilos de cotas, estilos de hachura e, opcionalmente, layouts com formato de folha e carimbo",
      "Apenas a paleta de cores da empresa",
      "Somente o logotipo do escritório",
      "Exclusivamente o histórico de revisões do projeto"
    ],
    "correct_answer": "Unidades e precisão, layers padronizados, estilos de texto, estilos de cotas, estilos de hachura e, opcionalmente, layouts com formato de folha e carimbo",
    "explanation": "O texto afirma que, segundo Oliveira, Baldam e Costa (2011), o template deve conter \"unidades e precisão, layers padronizados, estilos de texto, estilos de cotas, estilos de hachura, tabelas ou quadros principais (opcional) e layouts com formato de folha e carimbo (opcional)\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando do AutoCAD é usado para definir se o projeto será desenhado em metros ou milímetros?",
    "options": [
      "UNITS",
      "LAYER",
      "STYLE",
      "DIMSTYLE"
    ],
    "correct_answer": "UNITS",
    "explanation": "O texto afirma: \"No AutoCAD: Digite: UNITS. Selecione Decimal. Defina 'meters' ou 'millimeters'\"."
  },
  {
    "page": 4,
    "difficulty": "easy",
    "prompt": "Segundo o exemplo prático do texto, ao desenhar uma parede com valor \"3\" tendo escolhido a unidade \"meters\", como o AutoCAD interpreta essa medida?",
    "options": [
      "Como 3 metros",
      "Como 3 centímetros",
      "Como 3 milímetros",
      "Como 3 pés"
    ],
    "correct_answer": "Como 3 metros",
    "explanation": "O texto afirma: \"Como plantas arquitetônicas são representadas normalmente em metros, escolha meters. Assim, ao desenhar uma parede com 3, o AutoCAD entenderá como 3 metros\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, ao criar um estilo de texto no AutoCAD (comando STYLE), por que a altura costuma ser definida como 0?",
    "options": [
      "Para controlar a altura final do texto no Layout, e não no Model Space",
      "Porque o AutoCAD não permite texto com altura definida",
      "Porque o texto com altura 0 fica automaticamente invisível",
      "Porque é obrigatório por norma técnica"
    ],
    "correct_answer": "Para controlar a altura final do texto no Layout, e não no Model Space",
    "explanation": "O texto afirma: \"Defina a altura como 0 para controlar no layout\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é usado para criar ou editar um estilo de cotas no AutoCAD, como o exemplo \"COTA_1_50\"?",
    "options": [
      "DIMSTYLE",
      "STYLE",
      "LAYER",
      "UNITS"
    ],
    "correct_answer": "DIMSTYLE",
    "explanation": "O texto afirma: \"Digite: DIMSTYLE, clique em New, crie algo como COTA_1_50\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é um CTB no AutoCAD?",
    "options": [
      "Um arquivo de configuração que define como cada cor do desenho será impressa (espessura, preto/cinza/cor, transparência e qualidade)",
      "Um arquivo que armazena backups automáticos do desenho",
      "Um plugin de renderização 3D",
      "Um formato de exportação exclusivo para PDF"
    ],
    "correct_answer": "Um arquivo de configuração que define como cada cor do desenho será impressa (espessura, preto/cinza/cor, transparência e qualidade)",
    "explanation": "O texto define: \"O CTB é um arquivo de configuração que define como cada cor do desenho será impressa. Ou seja, ele determina: a espessura das linhas... se a cor será impressa em preto, em escala de cinza ou na própria cor... a transparência... a qualidade da impressão\"."
  },
  {
    "page": 6,
    "difficulty": "hard",
    "prompt": "Segundo Baldam, Costa e Oliveira (2015), citados no texto, qual é a função central que o CTB garante para a apresentação de um desenho a clientes, professores ou órgãos técnicos?",
    "options": [
      "A legibilidade da prancha, garantindo que o desenho fique claro e fácil de interpretar",
      "A velocidade de plotagem",
      "A redução do tamanho do arquivo",
      "A conversão automática para escala métrica"
    ],
    "correct_answer": "A legibilidade da prancha, garantindo que o desenho fique claro e fácil de interpretar",
    "explanation": "O texto afirma: \"O CTB controla a legibilidade da prancha. Ele é responsável por garantir que o desenho fique claro e fácil de interpretar... (Baldam; Costa; Oliveira, 2015)\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Oliveira, Baldam e Costa (2012), citados no texto, como funciona a lógica de atribuição de espessura de linha num CTB no AutoCAD?",
    "options": [
      "Cada cor do desenho corresponde a uma configuração de impressão pré-definida na tabela CTB",
      "A espessura é definida manualmente traço por traço",
      "A espessura é fixa e igual para todas as cores",
      "Depende exclusivamente do tipo de camada (layer)"
    ],
    "correct_answer": "Cada cor do desenho corresponde a uma configuração de impressão pré-definida na tabela CTB",
    "explanation": "O texto explica que \"cada cor corresponde a uma configuração de impressão (Oliveira; Baldam; Costa, 2012)\", exemplificado na Tabela 1."
  },
  {
    "page": 6,
    "difficulty": "hard",
    "prompt": "De acordo com a Tabela 1 do texto, qual é a espessura de linha configurada para a cor 8 (Cinza)?",
    "options": [
      "0.40 mm",
      "0.15 mm",
      "0.10 mm",
      "0.25 mm"
    ],
    "correct_answer": "0.40 mm",
    "explanation": "A Tabela 1 do texto lista: \"8 (Cinza) Preto espesso 0.40 mm\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "No exemplo prático de CTB arquitetônico do texto, como devem ser as linhas das paredes em comparação aos móveis?",
    "options": [
      "As paredes devem ter traços mais fortes; móveis e elementos secundários devem ter linhas mais finas",
      "As paredes devem ser mais finas que os móveis, para dar destaque ao mobiliário",
      "Paredes e móveis devem ter exatamente a mesma espessura",
      "Móveis não devem ter linha alguma, apenas hachura"
    ],
    "correct_answer": "As paredes devem ter traços mais fortes; móveis e elementos secundários devem ter linhas mais finas",
    "explanation": "O texto afirma: \"As paredes devem ter traços mais fortes. Os móveis e elementos secundários devem ter linhas mais finas\"."
  },
  {
    "page": 10,
    "difficulty": "hard",
    "prompt": "No exemplo prático do texto para configurar um CTB arquitetônico, qual espessura de linha (Lineweight) é atribuída à cor 8 (paredes)?",
    "options": [
      "0.40 mm",
      "0.25 mm",
      "0.10 mm",
      "0.20 mm"
    ],
    "correct_answer": "0.40 mm",
    "explanation": "O texto define no passo a passo: \"Cor 8 Lineweight: 0.40 mm\" para o layer PAREDES."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quando se deve deixar a opção \"Plot with Color\" ativada em vez de imprimir em preto e branco?",
    "options": [
      "Em projetos como interiores, paisagismo e humanizações, que requerem uso de cor",
      "Em qualquer projeto de planta baixa arquitetônica padrão",
      "Apenas em desenhos de detalhamento estrutural",
      "Nunca — a impressão deve sempre ser em preto e branco"
    ],
    "correct_answer": "Em projetos como interiores, paisagismo e humanizações, que requerem uso de cor",
    "explanation": "O texto afirma: \"Há projetos — como interiores, paisagismo e humanizações — que requerem uso de cor. Nesse caso: Deixe a opção 'Plot with Color' ativada\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza o Model Space no AutoCAD?",
    "options": [
      "É o ambiente onde você sempre desenha em escala real (1:1)",
      "É o espaço onde se define o tamanho da folha de impressão",
      "É o local onde se insere apenas o carimbo da prancha",
      "É usado exclusivamente para visualizar arquivos externos (XREF)"
    ],
    "correct_answer": "É o ambiente onde você sempre desenha em escala real (1:1)",
    "explanation": "O texto afirma: \"Model Space (Espaço do Modelo): Esse é o ambiente onde você sempre desenha em escala 1:1, ou seja, em tamanho real\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é o Layout (também chamado \"Espaço do Papel\")?",
    "options": [
      "O ambiente onde se prepara a prancha final, escolhendo tamanho da folha, carimbo e enquadrando o desenho via viewports",
      "O comando usado para desenhar paredes em escala real",
      "Um tipo específico de impressora de grande formato",
      "O nome do arquivo salvo em formato .dwt"
    ],
    "correct_answer": "O ambiente onde se prepara a prancha final, escolhendo tamanho da folha, carimbo e enquadrando o desenho via viewports",
    "explanation": "O texto define: \"Layout (Espaço do Papel): é onde você prepara sua prancha final, escolhendo o tamanho da folha, configurando o carimbo e enquadrando o desenho através de viewports\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a diferença entre os comandos TEXT e MTEXT no AutoCAD?",
    "options": [
      "TEXT cria textos simples de uma linha; MTEXT cria textos multilinhas, indicado para anotações maiores",
      "TEXT é usado só em Layout; MTEXT só no Model Space",
      "MTEXT só funciona em maiúsculas; TEXT aceita minúsculas",
      "Não há diferença prática entre os dois comandos"
    ],
    "correct_answer": "TEXT cria textos simples de uma linha; MTEXT cria textos multilinhas, indicado para anotações maiores",
    "explanation": "O texto afirma: \"TEXT: cria textos simples (uma linha). MTEXT: cria textos multilinhas, indicado para anotações maiores\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual o tamanho aparente recomendado para textos legíveis numa prancha impressa?",
    "options": [
      "Geralmente entre 2,5 mm e 4 mm no papel",
      "Entre 10 mm e 15 mm no papel",
      "Entre 0,5 mm e 1 mm no papel",
      "Não há recomendação, depende só do gosto do projetista"
    ],
    "correct_answer": "Geralmente entre 2,5 mm e 4 mm no papel",
    "explanation": "O texto afirma: \"o tamanho aparente deve respeitar o padrão gráfico (geralmente 2,5 mm a 4 mm no papel)\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo Tuller (2013), citado no texto, o que é a escala de um desenho técnico?",
    "options": [
      "A relação entre o tamanho real e o tamanho representado na prancha",
      "A quantidade de camadas (layers) usadas no desenho",
      "O tempo necessário para plotar o arquivo",
      "A resolução em pixels da imagem exportada"
    ],
    "correct_answer": "A relação entre o tamanho real e o tamanho representado na prancha",
    "explanation": "O texto afirma: \"A escala é a relação entre o tamanho real e o tamanho representado na prancha (Tuller, 2013)\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é usado para cotar uma medida inclinada, como o comprimento diagonal de uma escada?",
    "options": [
      "DIMALIGNED",
      "DIMLINEAR",
      "DIMSTYLE",
      "MTEXT"
    ],
    "correct_answer": "DIMALIGNED",
    "explanation": "O texto afirma: \"Para cotar uma medida inclinada, como o comprimento de uma escada... DIMALIGNED Enter. Esse comando acompanha a inclinação do objeto\"."
  },
  {
    "page": 20,
    "difficulty": "hard",
    "prompt": "De acordo com a ABNT NBR 6492:2021, citada no texto, qual deve ser a altura do texto da cota no papel, independentemente da escala escolhida?",
    "options": [
      "2,5 mm",
      "5,0 mm",
      "1,0 mm",
      "10 mm"
    ],
    "correct_answer": "2,5 mm",
    "explanation": "O texto afirma: \"De acordo com a ABNT NBR 6492:2021... o texto da cota no papel deve ter 2,5 mm independentemente da escala escolhida\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais escalas são muito utilizadas para plantas de pavimento de ambientes pequenos, permitindo boa leitura dos mobiliários?",
    "options": [
      "1:50 ou 1:75",
      "1:500 ou 1:1000",
      "1:5 ou 1:2",
      "1:200 ou 1:250"
    ],
    "correct_answer": "1:50 ou 1:75",
    "explanation": "O texto afirma: \"Para plantas do pavimento de ambientes pequenos, escalas como 1:50 ou 1:75 são muito utilizadas, pois permitem boa leitura dos mobiliários\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais escalas maiores podem ser necessárias para detalhes de construção, como paginação de revestimentos ou marcenaria?",
    "options": [
      "1:20, 1:10 ou até 1:5",
      "1:100 ou 1:150",
      "1:1000 ou 1:2000",
      "1:500 apenas"
    ],
    "correct_answer": "1:20, 1:10 ou até 1:5",
    "explanation": "O texto afirma: \"para detalhes de construção, como paginação de revestimentos ou detalhes de marcenaria, escalas maiores como 1:20, 1:10 ou até 1:5 podem ser necessárias\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que são as viewports dentro do Layout?",
    "options": [
      "Janelas que exibem o que foi desenhado no Model Space, cada uma podendo ter enquadramento e escala diferentes",
      "Comandos exclusivos para desenhar paredes curvas",
      "Arquivos externos anexados via XREF",
      "Estilos de cota configurados pelo DIMSTYLE"
    ],
    "correct_answer": "Janelas que exibem o que foi desenhado no Model Space, cada uma podendo ter enquadramento e escala diferentes",
    "explanation": "O texto afirma: \"As viewports são janelas que exibem o que foi desenhado no Model Space. Você pode ter uma ou várias viewports na mesma prancha, cada uma mostrando um enquadramento ou escala diferente\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve travar (Lock) uma viewport depois de ajustar sua escala?",
    "options": [
      "Para garantir que ao navegar ou aproximar o desenho dentro da viewport, a escala não seja alterada acidentalmente",
      "Para impedir que qualquer pessoa edite o Model Space",
      "Para converter automaticamente a viewport em um XREF",
      "Para reduzir o tamanho do arquivo final em PDF"
    ],
    "correct_answer": "Para garantir que ao navegar ou aproximar o desenho dentro da viewport, a escala não seja alterada acidentalmente",
    "explanation": "O texto afirma: \"Bloqueando a viewport (evita perda da escala): Com a viewport selecionada... clique no ícone de cadeado (Lock). Isso garante que você navegue ou aproxime o desenho sem alterar a escala\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo Baldam, Costa e Oliveira (2015), citados no texto, qual comando é recomendado para inserir arquivos externos (como projeto elétrico ou hidráulico) numa prancha, mantendo o desenho leve?",
    "options": [
      "XREF (External Reference)",
      "INSERT BLOCK apenas",
      "COPY/PASTE direto entre arquivos",
      "PURGE"
    ],
    "correct_answer": "XREF (External Reference)",
    "explanation": "O texto afirma: \"o método mais eficiente é usar o comando XREF (External Reference), que vincula o arquivo à prancha sem incorporá-lo permanentemente (Baldam; Costa; Oliveira, 2015)\"."
  },
  {
    "page": 28,
    "difficulty": "hard",
    "prompt": "Segundo o texto, o que acontece com a prancha se o arquivo XREF anexado for atualizado por outra pessoa?",
    "options": [
      "A prancha atualiza automaticamente ao ser reaberta, refletindo as mudanças do arquivo externo",
      "Nada muda, o XREF é uma cópia estática e independente",
      "O AutoCAD exige reinstalação do plugin de referência",
      "A prancha perde a referência e precisa ser refeita do zero"
    ],
    "correct_answer": "A prancha atualiza automaticamente ao ser reaberta, refletindo as mudanças do arquivo externo",
    "explanation": "O texto afirma: \"Caso ele seja atualizado por outra pessoa, sua prancha atualizará automaticamente ao abrir o desenho\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo Tuler (2013), citado no texto, qual comando/recurso permite controlar quais layers aparecem em cada viewport, mesmo que existam no Model Space?",
    "options": [
      "VPLAYER ou a coluna VP Freeze no painel de Layer Properties",
      "XREF",
      "DIMSTYLE",
      "UNITS"
    ],
    "correct_answer": "VPLAYER ou a coluna VP Freeze no painel de Layer Properties",
    "explanation": "O texto afirma: \"Isso é feito através do comando VPLAYER ou pelo painel de Layer Properties com a coluna VP Freeze (Tuller, 2013)\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "No exemplo do texto de uma prancha com duas viewports (planta geral 1:100 e detalhe da cozinha 1:25), o que se deseja ocultar na viewport do detalhe usando VP Freeze?",
    "options": [
      "Textos e cotas, deixando apenas o detalhamento das bancadas e armários",
      "Apenas as paredes estruturais",
      "Toda a mobília, sem exceção",
      "As linhas de contorno do edifício"
    ],
    "correct_answer": "Textos e cotas, deixando apenas o detalhamento das bancadas e armários",
    "explanation": "O texto afirma: \"Na viewport 1:25 da cozinha, você deseja ocultar os textos e as cotas, deixando apenas o detalhamento das bancadas e armários\"."
  },
  {
    "page": 30,
    "difficulty": "hard",
    "prompt": "Segundo Oliveira, Baldam e Costa (2012), citados no texto, o que a função VP Freeze permite fazer com um layer, sem afetar o restante do projeto?",
    "options": [
      "Congelar o layer somente naquela viewport específica, sem apagar ou desligar o layer no projeto todo",
      "Apagar permanentemente o layer de todas as viewports",
      "Renomear o layer automaticamente em todo o desenho",
      "Bloquear a edição do layer em qualquer parte do arquivo"
    ],
    "correct_answer": "Congelar o layer somente naquela viewport específica, sem apagar ou desligar o layer no projeto todo",
    "explanation": "O texto afirma: \"A função VP Freeze permite congelar um layer somente naquela viewport, sem apagar ou desligar o layer no projeto todo. Isso permite destacar informações específicas de forma clara (Oliveira; Baldam; Costa, 2012)\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, que tipo de elementos podem ser colocados em layers criados exclusivamente para o Layout (não para o desenho em si)?",
    "options": [
      "Linhas de enquadramento, tarjas de destaque, linhas para separar pranchas e notas explicativas",
      "Apenas paredes estruturais do projeto",
      "Somente hidrossanitário e elétrica",
      "Exclusivamente blocos de mobiliário"
    ],
    "correct_answer": "Linhas de enquadramento, tarjas de destaque, linhas para separar pranchas e notas explicativas",
    "explanation": "O texto lista como exemplos de layers exclusivos do Layout: \"Linhas de enquadramento. Tarjas de destaque. Linhas para separar pranchas. Notas explicativas\"."
  },
  {
    "page": 26,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quais são os passos para criar uma prancha no Layout, na ordem apresentada?",
    "options": [
      "Escolher o formato da folha, inserir o carimbo, criar a viewport, aplicar a escala e travar a viewport",
      "Travar a viewport, depois criar a folha, depois aplicar a escala",
      "Aplicar a escala antes de escolher o formato da folha",
      "Inserir o carimbo é o último passo, depois de travar a viewport"
    ],
    "correct_answer": "Escolher o formato da folha, inserir o carimbo, criar a viewport, aplicar a escala e travar a viewport",
    "explanation": "O texto lista o passo a passo: \"Escolha o formato da folha... Insira ou desenhe o carimbo... Crie a viewport... Aplique a escala... Trave a viewport\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais quatro parâmetros devem ser definidos para cada cor na janela de configuração do CTB?",
    "options": [
      "Lineweight (espessura), Color (cor de saída), Dithering/Grayscale (escala de cinza) e Screening (intensidade da tinta)",
      "Apenas Lineweight e Color",
      "Somente o nome do layer e sua cor",
      "Exclusivamente a transparência da linha"
    ],
    "correct_answer": "Lineweight (espessura), Color (cor de saída), Dithering/Grayscale (escala de cinza) e Screening (intensidade da tinta)",
    "explanation": "O texto lista: \"Lineweight (Espessura da linha), Color (Cor de saída), Dithering / Grayscale (Escala de cinza), Screening (Intensidade da tinta)\"."
  },
  {
    "page": 10,
    "difficulty": "hard",
    "prompt": "No exemplo prático de CTB arquitetônico do texto, qual espessura (Lineweight) é atribuída à cor 2 (COTAS)?",
    "options": [
      "0.10 mm",
      "0.40 mm",
      "0.25 mm",
      "0.20 mm"
    ],
    "correct_answer": "0.10 mm",
    "explanation": "O texto define: \"Cor 2 Lineweight: 0.10 mm\" para o layer COTAS."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como o Layout é descrito em analogia ao processo criativo do Model Space?",
    "options": [
      "O Model Space é a oficina onde se cria e ajusta cada detalhe; o Layout é a vitrine onde se exibe o resultado final",
      "O Layout é onde se desenha; o Model Space é só para impressão",
      "Ambos cumprem exatamente a mesma função, sem distinção",
      "O Model Space só existe em versões antigas do AutoCAD"
    ],
    "correct_answer": "O Model Space é a oficina onde se cria e ajusta cada detalhe; o Layout é a vitrine onde se exibe o resultado final",
    "explanation": "O texto afirma: \"Enquanto o Model Space é a oficina onde criamos e ajustamos cada detalhe, o Layout é a vitrine onde exibimos o resultado final\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como devem ser as cotas num CTB arquitetônico bem configurado, em termos de espessura e legibilidade?",
    "options": [
      "Finas, porém legíveis",
      "Tão espessas quanto as paredes, para dar destaque",
      "Invisíveis na impressão final",
      "Coloridas em vermelho vibrante, sempre"
    ],
    "correct_answer": "Finas, porém legíveis",
    "explanation": "O texto afirma que, no CTB arquitetônico, \"as cotas precisam ser finas, porém legíveis\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é usado para cotar uma medida reta, como o comprimento de uma parede?",
    "options": [
      "DIMLINEAR",
      "DIMALIGNED",
      "DIMSTYLE",
      "XREF"
    ],
    "correct_answer": "DIMLINEAR",
    "explanation": "O texto afirma: \"Para cotar o comprimento da parede maior, você pode usar: DIMLINEAR Enter\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual escala pode ser suficiente para representar cortes, fachadas ou vistas gerais?",
    "options": [
      "1:100",
      "1:5",
      "1:1000",
      "1:10"
    ],
    "correct_answer": "1:100",
    "explanation": "O texto afirma: \"Para cortes, fachadas ou vistas gerais, 1:100 pode ser suficiente\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais dois fatores principais influenciam a escolha da escala ideal para uma prancha?",
    "options": [
      "O tamanho da folha e a complexidade do desenho",
      "A cor do papel e o tipo de impressora",
      "O nome do arquiteto e a data de entrega",
      "O custo da impressão e o horário de entrega"
    ],
    "correct_answer": "O tamanho da folha e a complexidade do desenho",
    "explanation": "O texto afirma: \"A escolha depende de dois fatores principais: o tamanho da folha e a complexidade do desenho\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que se pode fazer numa mesma prancha ao usar múltiplas viewports, por exemplo, para planta e detalhe da cozinha?",
    "options": [
      "Apresentar planta, corte e detalhes na mesma folha, cada um com sua própria escala",
      "Mostrar apenas uma escala fixa para toda a prancha",
      "Combinar arquivos de formatos diferentes, como DWG e Excel, na mesma viewport",
      "Eliminar a necessidade de qualquer carimbo na prancha"
    ],
    "correct_answer": "Apresentar planta, corte e detalhes na mesma folha, cada um com sua própria escala",
    "explanation": "O texto afirma: \"Isso torna possível apresentar planta, corte e detalhes na mesma folha, cada um com sua própria escala\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto, ao anexar um XREF, qual é o procedimento recomendado para o ponto de inserção, escala e rotação?",
    "options": [
      "Inserir na origem (0,0), sem alterar escala ou rotação",
      "Inserir sempre em um ponto aleatório da prancha",
      "Aumentar a escala em 200% por padrão",
      "Rotacionar automaticamente em 90 graus"
    ],
    "correct_answer": "Inserir na origem (0,0), sem alterar escala ou rotação",
    "explanation": "O texto afirma: \"Insira na origem (0,0), sem alterar escala ou rotação\"."
  },
  {
    "page": 9,
    "difficulty": "hard",
    "prompt": "Segundo o texto, como devem aparecer os textos num CTB arquitetônico bem configurado?",
    "options": [
      "Com boa intensidade, mas sem exagero",
      "Totalmente ocultos na impressão",
      "Na mesma espessura das paredes",
      "Sempre em vermelho para destaque"
    ],
    "correct_answer": "Com boa intensidade, mas sem exagero",
    "explanation": "O texto afirma que, no CTB arquitetônico, \"os textos devem aparecer com boa intensidade, mas sem exagero\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que cada elemento do desenho deve estar em um layer específico?",
    "options": [
      "Isso organiza a visualização e facilita a impressão",
      "Porque o AutoCAD não permite desenhar sem criar layers antes",
      "Apenas para reduzir o tamanho do arquivo",
      "Porque é uma exigência do formato .dwt"
    ],
    "correct_answer": "Isso organiza a visualização e facilita a impressão",
    "explanation": "O texto afirma: \"Cada elemento do desenho deve estar em um layer específico. Isso organiza a visualização e facilita a impressão\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que uma prancha de apresentação contém além do desenho técnico em si?",
    "options": [
      "Informações complementares como nome do autor, data, escala utilizada, localização e nome da folha/projeto",
      "Apenas a assinatura digital do responsável técnico",
      "Somente o código de barras de identificação",
      "Exclusivamente o preço do projeto"
    ],
    "correct_answer": "Informações complementares como nome do autor, data, escala utilizada, localização e nome da folha/projeto",
    "explanation": "O texto afirma que a prancha contém \"informações complementares que contextualizam o projeto: nome do autor, data, escala utilizada, localização, nome da folha e do projeto, entre outras\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que os layers ajudam a organizar dentro de um desenho no AutoCAD?",
    "options": [
      "Elementos como paredes, mobiliário, textos, cotas, hachuras, estampas ou símbolos",
      "Apenas a escala de impressão final",
      "Somente o nome do arquivo salvo",
      "Exclusivamente o tipo de impressora usada"
    ],
    "correct_answer": "Elementos como paredes, mobiliário, textos, cotas, hachuras, estampas ou símbolos",
    "explanation": "O texto afirma: \"Os layers ajudam a organizar o desenho, separando elementos como: paredes, mobiliário, textos, cotas, hachuras, estampas ou símbolos\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual cor é recomendada para um layer criado exclusivamente para elementos de apresentação no Layout (como linhas de enquadramento)?",
    "options": [
      "Cor fina e discreta, por exemplo cinza claro",
      "Vermelho vibrante, para chamar atenção",
      "Preto espesso, igual às paredes",
      "Não há recomendação de cor nesse caso"
    ],
    "correct_answer": "Cor fina e discreta, por exemplo cinza claro",
    "explanation": "O texto recomenda: \"Aplique cor fina e discreta (por exemplo, cinza claro)\"."
  },
  {
    "page": 36,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que a escolha do tipo de impressora ou plotter importa, além de apenas \"mandar imprimir\"?",
    "options": [
      "Porque influencia diretamente na qualidade da linha, no preenchimento de áreas, na fidelidade das cores e no custo de impressão",
      "Porque cada impressora exige um formato de arquivo diferente do DWG",
      "Porque só plotters permitem salvar em PDF",
      "Porque a escala do desenho muda automaticamente conforme a impressora"
    ],
    "correct_answer": "Porque influencia diretamente na qualidade da linha, no preenchimento de áreas, na fidelidade das cores e no custo de impressão",
    "explanation": "O texto afirma que \"o tipo de equipamento influencia diretamente na qualidade da linha, no preenchimento de áreas, na fidelidade das cores e até no custo de impressão\"."
  },
  {
    "page": 36,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais tamanhos de papel são citados como os mais utilizados em projetos arquitetônicos?",
    "options": [
      "A4, A3, A1 e A0",
      "Carta e Ofício apenas",
      "A6 e A7",
      "Apenas A4"
    ],
    "correct_answer": "A4, A3, A1 e A0",
    "explanation": "O texto afirma: \"exploraremos os tamanhos de papel mais utilizados — como A4, A3, A1 e A0 — e sua relação com a escala do desenho\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é fundamental garantir ao escolher o tamanho de papel adequado para uma prancha?",
    "options": [
      "Que todas as informações estejam legíveis e organizadas",
      "Que o arquivo digital ocupe o menor espaço possível em disco",
      "Que a impressão saia sempre em cores, nunca em preto e branco",
      "Que o carimbo ocupe a maior parte da folha"
    ],
    "correct_answer": "Que todas as informações estejam legíveis e organizadas",
    "explanation": "O texto afirma: \"Saber escolher o tamanho adequado é fundamental para garantir que todas as informações estejam legíveis e organizadas\"."
  }
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
