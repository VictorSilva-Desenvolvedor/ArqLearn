// Lições + perguntas reais para as demais unidades das 4 novas disciplinas (Docs/DocsFaculdade/),
// complementando o seed 003 (que cobriu só 1 unidade por disciplina) para alcançar paridade
// de volume de questões aprovadas com a trilha de Maquetes (162 perguntas reais).
//
// Mesma metodologia do seed 003: perguntas escritas diretamente a partir do texto extraído dos
// PDFs reais (pdftotext), com source_ref por página, resposta única inequívoca, e nada além do
// que o trecho-fonte sustenta. Todo correct_answer foi validado programaticamente contra as
// options (bate exatamente, sem duplicata, 4 options por pergunta) antes de entrar aqui.
//
// Lições já nascem no tamanho de ~10 perguntas (ver Docs/CLAUDE.md — handleStartSession não
// pagina, então uma lição grande vira uma sessão de prática enorme; lição de seed 004 corrigiu
// esse problema retroativamente para o conteúdo do seed 003, aqui já nasce correto).
//
// review_status "pending" em todas — precisa cmd/review-questions (ou aprovação manual
// equivalente) antes de aparecer numa sessão real ou entrar no pool do Modo Infinito.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/005_novas_materias_unidades_extras.js
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
// idempotente e seguro rodar de novo (usa $push, não $set sobrescrevendo o array inteiro).
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
// track_s01_construcoes_sustentaveis — Unidade 1 — Construção Civil e Desenvolvimento Sustentável (44 perguntas, fonte: q_construcoes_sustentaveis_u1.json)
// ---------------------------------------------------------------------------
const q_lesson_construcoes_sustentaveis_u1_p1 = [
  {
    "page": 2,
    "difficulty": "easy",
    "prompt": "Em que ano o termo \"desenvolvimento sustentável\" foi registrado pela ONU, no relatório Nosso Futuro Comum, segundo o texto?",
    "options": [
      "1987",
      "1992",
      "1972",
      "2000"
    ],
    "correct_answer": "1987",
    "explanation": "O texto afirma que \"no cenário da Organização das Nações Unidas (ONU), o termo 'desenvolvimento sustentável' foi registrado em 1987, no relatório Nosso futuro comum\"."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo o texto (CMMAD, 1991), como é definido o conceito de desenvolvimento sustentável?",
    "options": [
      "\"aquele que atende às necessidades do presente sem comprometer a possibilidade de as gerações futuras atenderem a suas próprias necessidades\"",
      "\"aquele que garante crescimento econômico ilimitado sem restrições ambientais\"",
      "\"aquele que prioriza exclusivamente a preservação ambiental sobre o desenvolvimento econômico\"",
      "\"aquele que se baseia unicamente na redução do consumo de recursos naturais\""
    ],
    "correct_answer": "\"aquele que atende às necessidades do presente sem comprometer a possibilidade de as gerações futuras atenderem a suas próprias necessidades\"",
    "explanation": "O texto cita literalmente essa definição do documento Nosso futuro comum (CMMAD, 1991, [s. p.])."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Em que ano e em qual conferência foi aprovada a elaboração da Agenda 21, segundo o texto?",
    "options": [
      "1992, na ECO-92, realizada no Rio de Janeiro",
      "1987, em Genebra",
      "2002, em Johannesburgo",
      "1972, em Estocolmo"
    ],
    "correct_answer": "1992, na ECO-92, realizada no Rio de Janeiro",
    "explanation": "O texto afirma que \"em 1992, na Conferência das Nações Unidas sobre Meio Ambiente e Desenvolvimento (ECO-92), realizada no Rio de Janeiro, aprovou-se a elaboração da Agenda 21\"."
  },
  {
    "page": 4,
    "difficulty": "hard",
    "prompt": "Segundo Csillag (2007), citado no texto, os impactos gerados no setor da construção civil surgem apenas durante a fase de obra?",
    "options": [
      "Não — estendem-se ao longo de todo o ciclo de vida da edificação, surgindo antes mesmo da produção de qualquer material",
      "Sim, apenas durante a execução da obra",
      "Sim, mas apenas na fase de demolição",
      "Não — apenas na fase de uso da edificação"
    ],
    "correct_answer": "Não — estendem-se ao longo de todo o ciclo de vida da edificação, surgindo antes mesmo da produção de qualquer material",
    "explanation": "O texto afirma que os impactos \"surgem antes mesmo da produção de qualquer material e, de acordo com Csillag (2007), estendem-se ao longo de todo o ciclo de vida da edificação\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo a norma técnica NBR 15575:2013 (ABNT, 2013), citada no texto, o que é \"vida útil do edifício\"?",
    "options": [
      "O período de tempo em que um edifício e/ou seus sistemas, elementos e componentes se prestam às atividades para as quais foram projetados e construídos",
      "O tempo mínimo de garantia legal dado pela construtora",
      "O período entre a construção e a primeira reforma estrutural",
      "O tempo de amortização do financiamento imobiliário"
    ],
    "correct_answer": "O período de tempo em que um edifício e/ou seus sistemas, elementos e componentes se prestam às atividades para as quais foram projetados e construídos",
    "explanation": "O texto cita essa definição literal da NBR 15575:2013."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "De acordo com a Abramat (2014), citada no texto, qual foi a produção total aproximada da cadeia produtiva da construção civil no Brasil em 2014?",
    "options": [
      "R$ 470,3 bilhões",
      "R$ 100 bilhões",
      "R$ 1 trilhão",
      "R$ 50 bilhões"
    ],
    "correct_answer": "R$ 470,3 bilhões",
    "explanation": "O texto afirma que \"a cadeia produtiva teve uma produção total de aproximadamente R$ 470,3 bilhões em 2014, o que equivale a 8,5% do PIB brasileiro\"."
  },
  {
    "page": 7,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quantos trabalhadores atuavam na cadeia produtiva da construção civil brasileira em 2014, de acordo com a Abramat (2014)?",
    "options": [
      "12,3 milhões",
      "5 milhões",
      "20 milhões",
      "8,5 milhões"
    ],
    "correct_answer": "12,3 milhões",
    "explanation": "O texto cita \"os 12,3 milhões de trabalhadores que atuavam na cadeia produtiva em 2014\"."
  },
  {
    "page": 8,
    "difficulty": "medium",
    "prompt": "Segundo Marques e Salgado (2007), citados no texto, quais são as três dimensões que precisam estar em equilíbrio para se alcançar o desenvolvimento sustentável na indústria da construção?",
    "options": [
      "Social, econômica e ambiental",
      "Técnica, jurídica e financeira",
      "Estrutural, estética e funcional",
      "Urbana, rural e industrial"
    ],
    "correct_answer": "Social, econômica e ambiental",
    "explanation": "O texto afirma que \"a procura por esse equilíbrio engloba as dimensões social, econômica e ambiental\", segundo Marques e Salgado (2007)."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual dos seguintes é citado como um dos grandes desafios sociais enfrentados pela cadeia produtiva da construção civil no Brasil?",
    "options": [
      "A informalidade tanto em empresas do setor como na qualificação da mão de obra",
      "A ausência total de normas técnicas no setor",
      "O excesso de mão de obra qualificada disponível",
      "A falta de demanda habitacional no país"
    ],
    "correct_answer": "A informalidade tanto em empresas do setor como na qualificação da mão de obra",
    "explanation": "O texto afirma que \"a cadeia produtiva da construção lida com grandes desafios, como a informalidade tanto em empresas do setor como na qualificação da mão de obra\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que ano foi publicada a Resolução Conama nº 307 e o que ela estabelece?",
    "options": [
      "2002; diretrizes, critérios e procedimentos para a gestão dos resíduos da construção civil",
      "2010; a Política Nacional de Resíduos Sólidos",
      "1998; normas de segurança do trabalho em canteiros de obras",
      "2013; requisitos de desempenho de edificações habitacionais"
    ],
    "correct_answer": "2002; diretrizes, critérios e procedimentos para a gestão dos resíduos da construção civil",
    "explanation": "O texto afirma que \"em 2002, foi publicada a Resolução nº 307, do Conselho Nacional do Meio Ambiente (Conama)..., que estabelece diretrizes, critérios e procedimentos para a gestão dos resíduos da construção civil\"."
  }
];

const q_lesson_construcoes_sustentaveis_u1_p2 = [
  {
    "page": 15,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual das seguintes normas técnicas citadas normatiza as diretrizes para a gestão da qualidade?",
    "options": [
      "ABNT NBR ISO 9.001:2008",
      "ABNT NBR ISO 14.001:2004",
      "OSHAS 18001:2007",
      "ABNT NBR 16001:2004"
    ],
    "correct_answer": "ABNT NBR ISO 9.001:2008",
    "explanation": "O texto afirma que \"a ABNT NBR ISO 9.001:2008, por exemplo, normatiza as diretrizes para a gestão da qualidade\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais certificações ambientais são citadas como importantes ferramentas para a avaliação das construções sustentáveis?",
    "options": [
      "LEED, selo AQUA, BREEAM, Etiqueta Procel Edifica e selo Casa Azul",
      "Somente o LEED, por ser o mais reconhecido mundialmente",
      "ISO 9001 e ISO 14001, exclusivamente",
      "Apenas certificações emitidas por órgãos públicos brasileiros"
    ],
    "correct_answer": "LEED, selo AQUA, BREEAM, Etiqueta Procel Edifica e selo Casa Azul",
    "explanation": "O texto lista: \"o LEED, do Green Building Council Brasil; o selo AQUA, da Fundação Vanzolini; o BREEAM, da BRE... a Etiqueta Procel Edifica, da Eletrobras, e o selo Casa Azul, da Caixa Econômica Federal\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo Vilhena (2007), citado no texto, o que promove a degradação ambiental nas atividades relacionadas à construção civil?",
    "options": [
      "O consumo excessivo de recursos naturais e a geração de resíduos sólidos nas atividades de construção, operação e demolição de edifícios",
      "Exclusivamente a emissão de ruídos durante a obra",
      "Apenas o uso de mão de obra não qualificada",
      "Somente o transporte de materiais até o canteiro de obras"
    ],
    "correct_answer": "O consumo excessivo de recursos naturais e a geração de resíduos sólidos nas atividades de construção, operação e demolição de edifícios",
    "explanation": "O texto afirma que \"as atividades relacionadas à construção, operação e demolição de edifícios promovem a degradação ambiental a partir do consumo excessivo de recursos naturais e da geração de resíduos sólidos (Vilhena, 2007)\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Tavares (2006), citado no texto, por que a indústria do cimento é apontada como a maior emissora de CO2 entre os materiais de construção?",
    "options": [
      "Por causa do uso de combustíveis fósseis para geração de energia térmica e das emissões adicionais pela calcinação de calcário na produção do clínquer",
      "Porque exige transporte rodoviário de longa distância até o canteiro",
      "Porque seu processo de fabricação consome exclusivamente energia elétrica",
      "Porque é extraído de jazidas localizadas em áreas de preservação ambiental"
    ],
    "correct_answer": "Por causa do uso de combustíveis fósseis para geração de energia térmica e das emissões adicionais pela calcinação de calcário na produção do clínquer",
    "explanation": "O texto afirma que \"por causa do uso de combustíveis fósseis para a geração de energia térmica, ocorrem emissões adicionais pela calcinação de calcário durante a produção do clínquer\" (Tavares, 2006)."
  },
  {
    "page": 21,
    "difficulty": "hard",
    "prompt": "Segundo Marland, Boden e Andres (2003), citados no texto, a fabricação de cimento é responsável por qual faixa percentual de todo o CO2 liberado na atmosfera decorrente de atividades antrópicas?",
    "options": [
      "4 a 5%",
      "10 a 15%",
      "20 a 25%",
      "1 a 2%"
    ],
    "correct_answer": "4 a 5%",
    "explanation": "O texto afirma que \"a fabricação de cimento é responsável por 4 a 5% de todo o dióxido de carbono (CO2) liberado na atmosfera decorrente de atividades antrópicas (Marland; Boden; Andres, 2003)\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo Buchanan e Honey (1994), citados no texto, qual gás do efeito estufa, gerado principalmente pelas atividades humanas, é responsável por aproximadamente 55% das emissões?",
    "options": [
      "Dióxido de carbono (CO2)",
      "Metano (CH4)",
      "Óxido nitroso (N2O)",
      "Ozônio troposférico (O3)"
    ],
    "correct_answer": "Dióxido de carbono (CO2)",
    "explanation": "O texto afirma que \"o dióxido de carbono (CO2), gerado principalmente pelas atividades humanas, é responsável por aproximadamente 55% das emissões\" (Buchanan; Honey, 1994)."
  },
  {
    "page": 23,
    "difficulty": "hard",
    "prompt": "Segundo Benite (2011), citado no texto, qual a proporção das emissões de CO2 na construção civil resultante da extração/processamento de matérias-primas, fabricação e construção/demolição, em relação à fase de operação e uso do edifício?",
    "options": [
      "10 a 20% na extração/fabricação/construção; 80 a 90% na operação e uso",
      "50% em cada uma das duas fases",
      "80 a 90% na extração/fabricação/construção; 10 a 20% na operação e uso",
      "30% na extração; 70% na demolição"
    ],
    "correct_answer": "10 a 20% na extração/fabricação/construção; 80 a 90% na operação e uso",
    "explanation": "O texto afirma que \"10 a 20% dessas emissões são resultantes da extração e do processamento das matérias-primas, da fabricação de produtos e da etapa de construção e demolição. Os 80 a 90% restantes estão vinculados à fase de operação e uso do edifício\" (Benite, 2011)."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Grigoletti (2001), citado no texto, a que se deve o fato de o setor da construção civil ser um dos principais contribuintes para o esgotamento das reservas naturais?",
    "options": [
      "A um consumo de cerca de 40% de matérias-primas como areia, pedra britada e cascalho, entre outros elementos",
      "À emissão intensa de gases poluentes durante a fabricação de vidro",
      "Ao uso exclusivo de madeira nativa em estruturas de grande porte",
      "Ao consumo elevado de combustíveis fósseis no transporte urbano de passageiros"
    ],
    "correct_answer": "A um consumo de cerca de 40% de matérias-primas como areia, pedra britada e cascalho, entre outros elementos",
    "explanation": "O texto afirma que \"esse fato é justificado por um consumo de cerca de 40% de matérias-primas como areia, pedra britada, cascalho, entre outros elementos\" (Grigoletti, 2001)."
  },
  {
    "page": 24,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual porcentagem da água do planeta é estimada como própria para consumo?",
    "options": [
      "2,5%",
      "10%",
      "25%",
      "50%"
    ],
    "correct_answer": "2,5%",
    "explanation": "O texto afirma que \"estima-se que apenas 2,5% da água do planeta sejam próprias para consumo\"."
  },
  {
    "page": 27,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 14040 (ABNT, 2009), citada no texto, como é definida a análise de ciclo de vida (ACV)?",
    "options": [
      "\"compilação e avaliação de entradas e saídas (de matérias-primas e recursos energéticos) e impactos ambientais potenciais de um produto através de seu ciclo de vida\"",
      "\"processo de descarte final de resíduos sólidos em aterros sanitários\"",
      "\"conjunto de normas técnicas que regulam a fabricação de materiais de construção\"",
      "\"metodologia exclusiva para cálculo de emissões de CO2 na fase de demolição\""
    ],
    "correct_answer": "\"compilação e avaliação de entradas e saídas (de matérias-primas e recursos energéticos) e impactos ambientais potenciais de um produto através de seu ciclo de vida\"",
    "explanation": "O texto cita literalmente essa definição da ISO/NBR 14040 (ABNT, 2009)."
  }
];

const q_lesson_construcoes_sustentaveis_u1_p3 = [
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 14001 (ABNT, 2004), citada no texto, o que é \"aspecto ambiental\"?",
    "options": [
      "O elemento das atividades ou produtos e serviços de uma organização que pode interagir com o meio ambiente",
      "O impacto financeiro causado por uma obra em uma comunidade vizinha",
      "A quantidade de resíduos gerados por uma edificação ao longo de sua vida útil",
      "O conjunto de normas técnicas aplicáveis ao licenciamento ambiental"
    ],
    "correct_answer": "O elemento das atividades ou produtos e serviços de uma organização que pode interagir com o meio ambiente",
    "explanation": "O texto cita literalmente essa definição da NBR 14001 (ABNT, 2004)."
  },
  {
    "page": 30,
    "difficulty": "hard",
    "prompt": "Segundo o art. 1º da Resolução Conama nº 01/1986, citada no texto, a que elementos a alteração das propriedades físicas, químicas e biológicas do meio ambiente (impacto ambiental) pode afetar direta ou indiretamente?",
    "options": [
      "A saúde, segurança e bem-estar da população, as atividades sociais e econômicas, a biota, e as condições estéticas e sanitárias do meio ambiente",
      "Exclusivamente a fauna e a flora silvestres protegidas por lei",
      "Apenas o valor de mercado dos imóveis vizinhos à obra",
      "Somente a qualidade do ar em áreas urbanas densamente povoadas"
    ],
    "correct_answer": "A saúde, segurança e bem-estar da população, as atividades sociais e econômicas, a biota, e as condições estéticas e sanitárias do meio ambiente",
    "explanation": "O texto cita os incisos I a V do art. 1º da Resolução 01/1986 do Conama, que incluem esses elementos entre os afetados pelo impacto ambiental."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais estratégias são citadas para a redução de impactos ambientais no setor da construção civil relacionadas ao uso de materiais?",
    "options": [
      "A desmaterialização (reúso de componentes ao final da vida útil da obra) e a reciclagem dos materiais",
      "A proibição total do uso de concreto armado nas edificações",
      "O aumento da importação de materiais de países desenvolvidos",
      "A padronização obrigatória do desenho arquitetônico de todas as edificações"
    ],
    "correct_answer": "A desmaterialização (reúso de componentes ao final da vida útil da obra) e a reciclagem dos materiais",
    "explanation": "O texto afirma: \"algumas estratégias para a redução de impactos ambientais no setor da construção civil são: a desmaterialização... e a reciclagem dos materiais\"."
  },
  {
    "page": 34,
    "difficulty": "hard",
    "prompt": "Segundo Souza et al. (1998), citados no texto, a que se pode atribuir parte do elevado consumo de materiais e da geração de resíduos na construção civil?",
    "options": [
      "Às perdas de materiais em canteiros de obras",
      "Exclusivamente à falta de fiscalização governamental sobre construtoras",
      "Ao uso excessivo de materiais reciclados de baixa qualidade",
      "À ausência de projetos arquitetônicos formais nas obras"
    ],
    "correct_answer": "Às perdas de materiais em canteiros de obras",
    "explanation": "O texto afirma que \"pode-se atribuir parte do elevado consumo de materiais e da geração de resíduos às perdas de materiais em canteiros de obras\" (Souza et al., 1998)."
  },
  {
    "page": 35,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em algumas regiões do país, as perdas de argamassa em canteiros de obras podem chegar a quanto?",
    "options": [
      "Quase 50%",
      "Cerca de 10%",
      "Cerca de 5%",
      "Mais de 90%"
    ],
    "correct_answer": "Quase 50%",
    "explanation": "O texto afirma que \"estudos apontam que em algumas regiões do país as perdas chegam a quase 50%\"."
  },
  {
    "page": 38,
    "difficulty": "medium",
    "prompt": "Segundo a norma de desempenho NBR 15.575-1 (ABNT, 2013), citada no texto, quanto à estanqueidade, as edificações devem prever proteção contra águas e umidades provenientes de que fontes?",
    "options": [
      "Fontes externas, como chuva e solo",
      "Exclusivamente vazamentos internos de tubulação hidráulica",
      "Apenas infiltração por capilaridade em fundações",
      "Somente umidade gerada por atividades domésticas"
    ],
    "correct_answer": "Fontes externas, como chuva e solo",
    "explanation": "O texto afirma que \"as edificações devem prever estanqueidade às águas e umidades provenientes de fontes externas (chuva e solo)\"."
  },
  {
    "page": 41,
    "difficulty": "hard",
    "prompt": "Segundo John (2000), citado no texto, quantos quilos de resíduos são gerados, em média, ao final da vida útil de um edifício, para cada quilo de material utilizado?",
    "options": [
      "Cerca de 5 kg",
      "Cerca de 1 kg",
      "Cerca de 10 kg",
      "Cerca de 0,5 kg"
    ],
    "correct_answer": "Cerca de 5 kg",
    "explanation": "O texto afirma que \"John (2000) estima que, ao final da vida útil do edifício, são gerados cerca de 5 kg de resíduos para cada 1 kg de material utilizado\"."
  },
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo um estudo de Pinto (1999), citado no texto, qual era a estimativa de geração de resíduos da construção civil no Brasil, em kg por habitante por ano?",
    "options": [
      "500 kg/hab.ano",
      "100 kg/hab.ano",
      "1.000 kg/hab.ano",
      "50 kg/hab.ano"
    ],
    "correct_answer": "500 kg/hab.ano",
    "explanation": "O texto afirma que \"um estudo elaborado por Pinto (1999) evidenciou que, no Brasil, eram gerados 500 kg/hab.ano de resíduos da construção civil\"."
  },
  {
    "page": 41,
    "difficulty": "hard",
    "prompt": "Segundo Wines (2000 apud Lamberts et al., 2008), citado no texto, a construção e o uso dos edifícios utilizam qual percentual do fornecimento mundial de água pura?",
    "options": [
      "16,6%",
      "40%",
      "25%",
      "55%"
    ],
    "correct_answer": "16,6%",
    "explanation": "O texto afirma que a construção e o uso dos edifícios \"utilizam 16,6% do fornecimento mundial de água pura, 25% de sua colheita de madeira e 40% de seus combustíveis fósseis e materiais manufaturados\"."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo Silva (2003), citada no texto, o conceito de desenvolvimento sustentável é usualmente descrito a partir de qual estrutura, que congrega as dimensões ambiental, social e econômica?",
    "options": [
      "Triple bottom line",
      "Life cycle assessment",
      "Cradle to cradle",
      "Net zero framework"
    ],
    "correct_answer": "Triple bottom line",
    "explanation": "O texto afirma que \"esse conceito é usualmente descrito a partir da chamada triple bottom line, que congrega as dimensões ambiental, social e econômica\" (Silva, 2003)."
  }
];

const q_lesson_construcoes_sustentaveis_u1_p4 = [
  {
    "page": 48,
    "difficulty": "medium",
    "prompt": "De acordo com Motta e Aguilar (2009), citados no texto, o que a ecoeficiência consiste em promover na gestão sustentável da implantação de uma obra?",
    "options": [
      "A redução do consumo de água e energia, a gestão adequada dos resíduos sólidos e a introdução de inovações tecnológicas",
      "Exclusivamente a redução de custos financeiros diretos da obra",
      "Apenas o uso de materiais importados de alta tecnologia",
      "Somente a automação total dos processos construtivos"
    ],
    "correct_answer": "A redução do consumo de água e energia, a gestão adequada dos resíduos sólidos e a introdução de inovações tecnológicas",
    "explanation": "O texto define ecoeficiência como aquela \"que consiste na redução do consumo de água e energia, na gestão adequada dos resíduos sólidos, na introdução de inovações tecnológicas, entre outras ações\"."
  },
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo Araújo (2017), citado no texto, quantas são as diretrizes gerais às quais uma edificação sustentável deve atender?",
    "options": [
      "Nove",
      "Cinco",
      "Doze",
      "Três"
    ],
    "correct_answer": "Nove",
    "explanation": "O texto afirma que, \"como explica Araújo (2017), são nove as diretrizes gerais às quais uma edificação sustentável deve atender\"."
  },
  {
    "page": 55,
    "difficulty": "hard",
    "prompt": "Segundo Araújo (2017), citado no texto, em quantos tipos as construções sustentáveis podem ser diferenciadas, e qual deles é descrito como o sistema construtivo mais próximo da natureza?",
    "options": [
      "Cinco tipos; a construção natural",
      "Três tipos; a construção alternativa",
      "Cinco tipos; a construção com materiais de reúso",
      "Quatro tipos; a construção natural"
    ],
    "correct_answer": "Cinco tipos; a construção natural",
    "explanation": "O texto lista cinco tipos e descreve a construção natural como \"o sistema construtivo mais ecológico e, portanto, mais próximo da própria natureza\"."
  },
  {
    "page": 55,
    "difficulty": "medium",
    "prompt": "Segundo Araújo (2017), citado no texto, o que caracteriza a \"construção com resíduos não reprocessados\"?",
    "options": [
      "A utilização de resíduos de origem urbana com fins construtivos, como garrafas PET, latas e cones de papel acartonado",
      "O uso exclusivo de materiais certificados internacionalmente",
      "A reciclagem industrial de concreto armado em usinas especializadas",
      "A demolição controlada de edificações antigas para reaproveitamento estrutural"
    ],
    "correct_answer": "A utilização de resíduos de origem urbana com fins construtivos, como garrafas PET, latas e cones de papel acartonado",
    "explanation": "O texto define esse tipo como a construção que \"consiste na utilização de resíduos de origem urbana com fins construtivos, como garrafas PET, latas, cones de papel acartonado, etc.\"."
  },
  {
    "page": 61,
    "difficulty": "medium",
    "prompt": "Segundo Keeler e Burke (2010), citados no texto, existe consenso entre os profissionais da área sobre todos os requisitos ambientais para uma construção ser considerada sustentável?",
    "options": [
      "Não — não há consenso sobre os requisitos ambientais, mas a maioria concorda com certos aspectos básicos",
      "Sim, existe consenso total e universal entre os profissionais",
      "Sim, mas apenas em relação ao consumo racional de água",
      "Não — os autores afirmam que não existem critérios objetivos possíveis"
    ],
    "correct_answer": "Não — não há consenso sobre os requisitos ambientais, mas a maioria concorda com certos aspectos básicos",
    "explanation": "O texto afirma que \"para Keeler e Burke (2010), não há consenso sobre os requisitos ambientais para uma construção sustentável. No entanto, a maioria dos profissionais da área concorda\" com certos aspectos básicos."
  },
  {
    "page": 63,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual sistema de certificação ambiental de construções é o mais empregado no Reino Unido?",
    "options": [
      "BREEAM",
      "LEED",
      "CASBEE",
      "HQE"
    ],
    "correct_answer": "BREEAM",
    "explanation": "O texto afirma que, \"no Reino Unido\", destaca-se \"o sistema Building Research Establishment Environmental Assessment Method (BREEAM)\"."
  },
  {
    "page": 63,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual é o selo de certificação para construções sustentáveis mais utilizado em todo o mundo, inclusive no Brasil?",
    "options": [
      "LEED (Leadership in Energy and Environmental Design)",
      "BREEAM",
      "Selo Casa Azul",
      "AQUA"
    ],
    "correct_answer": "LEED (Leadership in Energy and Environmental Design)",
    "explanation": "O texto afirma que \"o selo para construções sustentáveis mais utilizado em todo o mundo, inclusive no Brasil, é o Leadership in Energy and Environmental Design (LEED)\"."
  },
  {
    "page": 64,
    "difficulty": "medium",
    "prompt": "Segundo uma matéria da revista Exame citada no texto, o Brasil é o quantos país do mundo com mais edifícios certificados LEED?",
    "options": [
      "Quarto",
      "Primeiro",
      "Segundo",
      "Décimo"
    ],
    "correct_answer": "Quarto",
    "explanation": "O texto afirma que \"o Brasil é o quarto país do mundo com mais edifícios sustentáveis\", atrás apenas dos Estados Unidos, China e Emirados Árabes Unidos."
  },
  {
    "page": 68,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quais estratégias de sustentabilidade foram adotadas no Templo Religioso Sukyo Mahikari, em São Paulo?",
    "options": [
      "Brises reguláveis, lâmpadas de LED, aquecimento de água por energia solar e reúso de água cinza",
      "Painéis fotovoltaicos exclusivamente na cobertura",
      "Uso de madeira certificada em toda a estrutura do edifício",
      "Sistema de ventilação mecânica forçada em todos os ambientes"
    ],
    "correct_answer": "Brises reguláveis, lâmpadas de LED, aquecimento de água por energia solar e reúso de água cinza",
    "explanation": "O texto descreve brises reguláveis, lâmpadas de LED, água quente por energia solar e reúso da água servida (cinza) como estratégias do templo."
  },
  {
    "page": 69,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual instituição é certificada pelo processo AQUA e apresenta soluções arquitetônicas voltadas ao conforto térmico e acústico das salas de aula?",
    "options": [
      "A escola pública estadual da Vila Brasilândia (Escola Ilha da Juventude), em São Paulo",
      "A fábrica da Coca-Cola na Fazenda Rio Grande (PR)",
      "O edifício da Av. Presidente Juscelino Kubitschek",
      "O Templo Religioso Sukyo Mahikari"
    ],
    "correct_answer": "A escola pública estadual da Vila Brasilândia (Escola Ilha da Juventude), em São Paulo",
    "explanation": "O texto afirma que \"a escola pública estadual da Vila Brasilândia, em São Paulo..., é certificada pelo processo AQUA e tem soluções arquitetônicas que preveem o conforto térmico das salas de aula\", incluindo tratamento acústico."
  }
];

const q_lesson_construcoes_sustentaveis_u1_p5 = [
  {
    "page": 71,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quantos pontos o sistema LEED concede aos edifícios, e em quais níveis de certificação eles são categorizados?",
    "options": [
      "De 40 a 110 pontos, nos níveis Silver, Gold ou Platinum",
      "De 0 a 100 pontos, nos níveis Bronze, Prata e Ouro",
      "De 1 a 10 estrelas, sem denominação de nível",
      "De 40 a 110 pontos, nos níveis A, B e C"
    ],
    "correct_answer": "De 40 a 110 pontos, nos níveis Silver, Gold ou Platinum",
    "explanation": "O texto afirma que \"o LEED concede de 40 a 110 pontos aos edifícios, categorizando-os nos seguintes níveis de certificação: Silver, Gold ou Platinum\"."
  },
  {
    "page": 72,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os parâmetros avaliados pelo LEED para empreendimentos comerciais?",
    "options": [
      "Espaço sustentável, eficiência do uso da água, energia e atmosfera, materiais e recursos, qualidade ambiental interna, inovação e processos, e créditos de prioridade regional",
      "Somente eficiência energética e uso racional da água",
      "Apenas requisitos estruturais e de segurança contra incêndio",
      "Exclusivamente critérios de acessibilidade universal"
    ],
    "correct_answer": "Espaço sustentável, eficiência do uso da água, energia e atmosfera, materiais e recursos, qualidade ambiental interna, inovação e processos, e créditos de prioridade regional",
    "explanation": "O texto lista exatamente esses sete parâmetros avaliados pelo LEED para empreendimentos comerciais."
  },
  {
    "page": 77,
    "difficulty": "hard",
    "prompt": "Segundo o art. 3º da Resolução Conama nº 307/2002, citada no texto, o que caracteriza os resíduos da construção civil Classe D?",
    "options": [
      "Resíduos perigosos oriundos do processo de construção, como tintas, solventes, óleos e materiais que contenham amianto",
      "Resíduos recicláveis para outras destinações, como plásticos e metais",
      "Resíduos reutilizáveis ou recicláveis como agregados",
      "Resíduos para os quais não há tecnologia de reciclagem economicamente viável disponível"
    ],
    "correct_answer": "Resíduos perigosos oriundos do processo de construção, como tintas, solventes, óleos e materiais que contenham amianto",
    "explanation": "O texto define a Classe D como \"resíduos perigosos oriundos do processo de construção, tais como tintas, solventes, óleos e outros... bem como telhas e demais objetos e materiais que contenham amianto\"."
  },
  {
    "page": 77,
    "difficulty": "medium",
    "prompt": "Segundo a Resolução Conama nº 307/2002, citada no texto, o que caracteriza os resíduos da construção civil Classe B?",
    "options": [
      "São os resíduos recicláveis para outras destinações, como plásticos, papel, papelão, metais, vidros, madeiras e gesso",
      "São resíduos perigosos que exigem descarte especial e controlado",
      "São resíduos sem tecnologia de reciclagem economicamente viável disponível",
      "São resíduos reutilizáveis exclusivamente como agregados de pavimentação"
    ],
    "correct_answer": "São os resíduos recicláveis para outras destinações, como plásticos, papel, papelão, metais, vidros, madeiras e gesso",
    "explanation": "O texto define a Classe B como \"os resíduos recicláveis para outras destinações, tais como plásticos, papel, papelão, metais, vidros, madeiras e gesso\"."
  }
];

// ---------------------------------------------------------------------------
// track_s01_construcoes_sustentaveis — Unidade 2 — Planejamento e Viabilidade da Implantação de Empreendimentos (34 perguntas, fonte: q_construcoes_sustentaveis_u2.json)
// ---------------------------------------------------------------------------
const q_lesson_construcoes_sustentaveis_u2_p1 = [
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Acselrad e Leroy (1999), citados no texto, como é definida a sustentabilidade urbana?",
    "options": [
      "\"a capacidade das políticas urbanas de se adaptarem à oferta de serviços, à qualidade e à quantidade das demandas sociais, buscando o equilíbrio entre as necessidades de serviços urbanos e os investimentos em estrutura\"",
      "\"a substituição total do transporte individual por transporte público em áreas urbanas\"",
      "\"o crescimento populacional controlado exclusivamente por políticas de natalidade\"",
      "\"a padronização arquitetônica de todas as edificações de uma cidade\""
    ],
    "correct_answer": "\"a capacidade das políticas urbanas de se adaptarem à oferta de serviços, à qualidade e à quantidade das demandas sociais, buscando o equilíbrio entre as necessidades de serviços urbanos e os investimentos em estrutura\"",
    "explanation": "O texto cita literalmente essa definição de Acselrad e Leroy (1999)."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Keeler e Burke (2010), citados no texto, como os autores descrevem o desenvolvimento sustentável no contexto das cidades?",
    "options": [
      "Como a integração entre ecologia, economia e equidade",
      "Como a substituição integral de energia fóssil por energia solar",
      "Como o controle exclusivo da densidade populacional",
      "Como a ausência total de intervenção do poder público"
    ],
    "correct_answer": "Como a integração entre ecologia, economia e equidade",
    "explanation": "O texto afirma que, \"para os autores, o desenvolvimento sustentável é descrito como a integração entre ecologia, economia e equidade\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como é chamado o padrão de desenvolvimento urbano que caracteriza a segunda metade do século XX, marcado pela separação rígida dos usos do solo e pela dependência do transporte individual?",
    "options": [
      "Expansão convencional ou dispersão urbana",
      "Adensamento compacto",
      "Cidade jardim",
      "Urbanização vertical"
    ],
    "correct_answer": "Expansão convencional ou dispersão urbana",
    "explanation": "O texto afirma que \"o padrão de desenvolvimento das cidades que caracteriza a segunda metade do século XX é conhecido como 'expansão convencional ou dispersão urbana'\"."
  },
  {
    "page": 4,
    "difficulty": "hard",
    "prompt": "Segundo Farah (2003), citado no texto, o que resulta da erosão paulatina que tende a se desenvolver em loteamentos em encostas no Brasil?",
    "options": [
      "Um significativo assoreamento dos cursos d'água, favorecendo a ocorrência de inundações",
      "A elevação do lençol freático em áreas rurais",
      "A redução da temperatura média local",
      "O aumento da permeabilidade do solo urbano"
    ],
    "correct_answer": "Um significativo assoreamento dos cursos d'água, favorecendo a ocorrência de inundações",
    "explanation": "O texto afirma que \"a erosão paulatina, que tende a se desenvolver em loteamentos em encostas, resulta num significativo assoreamento dos cursos d'água, favorecendo a ocorrência de inundações\" (Farah, 2003)."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Philippi Júnior e Silveira (2004), citados no texto, por meio de qual instrumento é possível preservar mananciais e determinar locais de recreação, como áreas verdes destinadas a parques e praças?",
    "options": [
      "O zoneamento",
      "O estudo de impacto de vizinhança",
      "A licença de operação",
      "O código de obras"
    ],
    "correct_answer": "O zoneamento",
    "explanation": "O texto afirma que \"por meio do zoneamento, também é possível determinar locais de recreação, como áreas verdes destinadas a parques e praças\", além de preservar mananciais."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Em que ano foi sancionada a Lei Federal nº 10.257, conhecida como Estatuto da Cidade, segundo o texto?",
    "options": [
      "2001",
      "1988",
      "1997",
      "1986"
    ],
    "correct_answer": "2001",
    "explanation": "O texto afirma que \"em 2001 foi sancionada a Lei Federal nº 10.257, conhecida como Estatuto da Cidade\"."
  },
  {
    "page": 8,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é o plano diretor?",
    "options": [
      "Uma lei municipal resultante da participação conjunta e efetiva da comunidade e de técnicos/profissionais, que define o ordenamento do uso e da ocupação do solo",
      "Um relatório técnico elaborado exclusivamente por engenheiros ambientais",
      "Um instrumento federal aplicável a todos os municípios sem adaptação local",
      "Um documento informal sem força de lei"
    ],
    "correct_answer": "Uma lei municipal resultante da participação conjunta e efetiva da comunidade e de técnicos/profissionais, que define o ordenamento do uso e da ocupação do solo",
    "explanation": "O texto afirma que \"o plano diretor é uma lei municipal resultante da participação conjunta e efetiva da comunidade e de técnicos/profissionais. Esse instrumento define o ordenamento do uso e da ocupação do solo\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que apresenta a Lei Federal nº 10.257/2001, o Estatuto da Cidade, como diretriz principal?",
    "options": [
      "A formulação de políticas de gestão para a cidade de forma democrática e planejada",
      "A privatização dos serviços públicos municipais",
      "A eliminação da necessidade de plano diretor",
      "A centralização do planejamento urbano no governo federal"
    ],
    "correct_answer": "A formulação de políticas de gestão para a cidade de forma democrática e planejada",
    "explanation": "O texto afirma que \"o Estatuto da Cidade tem como diretriz principal a formulação de políticas de gestão para a cidade de forma democrática e planejada\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo Sakr, Sherif e El-Haggar (2010), citados no texto, pelo que o setor da construção civil é responsável, em termos ambientais?",
    "options": [
      "Por provocar significativos impactos ambientais, além de consumir e descartar grande quantidade de bens naturais ou manufaturados",
      "Apenas por impactos econômicos, sem relação direta com o meio ambiente",
      "Por impactos exclusivamente sociais relacionados à geração de empregos",
      "Por impactos restritos apenas à fase de operação dos edifícios"
    ],
    "correct_answer": "Por provocar significativos impactos ambientais, além de consumir e descartar grande quantidade de bens naturais ou manufaturados",
    "explanation": "O texto afirma que, segundo os autores, o setor \"é responsável por provocar significativos impactos ambientais, bem como por consumir e descartar uma ampla quantidade de bens naturais ou manufaturados\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo Sánchez (2008), citado no texto, quais são as quatro fases do ciclo de vida de um empreendimento?",
    "options": [
      "Planejamento e projeto; implantação e construção; operação e funcionamento; desativação e fechamento",
      "Concepção, execução, entrega e garantia",
      "Licenciamento, construção, uso e demolição",
      "Estudo, aprovação, obra e manutenção"
    ],
    "correct_answer": "Planejamento e projeto; implantação e construção; operação e funcionamento; desativação e fechamento",
    "explanation": "O texto afirma que, para Sánchez (2008), \"o ciclo de vida de um empreendimento compreende as fases de: planejamento e projeto; implantação e construção; operação e funcionamento; e, por fim, desativação e fechamento\"."
  }
];

const q_lesson_construcoes_sustentaveis_u2_p2 = [
  {
    "page": 12,
    "difficulty": "hard",
    "prompt": "Segundo Ribeiro (2004), citada no texto, o que deve determinar, prever, interpretar, atenuar e monitorar a avaliação de impacto ambiental (AIA)?",
    "options": [
      "Os efeitos ambientais de uma atividade proposta, seja esta uma política, um programa ou um projeto",
      "Exclusivamente os efeitos econômicos de uma obra pública",
      "Apenas os efeitos sobre a fauna silvestre local",
      "Somente os efeitos financeiros para o empreendedor"
    ],
    "correct_answer": "Os efeitos ambientais de uma atividade proposta, seja esta uma política, um programa ou um projeto",
    "explanation": "O texto afirma que, \"para Ribeiro (2004), a AIA deve determinar, prever, interpretar, atenuar e monitorar os efeitos ambientais de uma atividade proposta, seja esta uma política, um programa ou um projeto\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Em que ano foi aprovada a Lei nº 6.938, segundo o texto, tornando o estudo de impacto ambiental um importante instrumento da Política Nacional do Meio Ambiente?",
    "options": [
      "1981",
      "1986",
      "1988",
      "1997"
    ],
    "correct_answer": "1981",
    "explanation": "O texto afirma que \"em 1981, com a aprovação da Lei nº 6.938, o estudo de impacto ambiental passou a ser um importante instrumento da Política Nacional do Meio Ambiente\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo o art. 1º da Resolução Conama nº 01/86, citado no texto, o que é impacto ambiental?",
    "options": [
      "Qualquer alteração das propriedades físicas, químicas e biológicas do meio ambiente, causada por matéria ou energia resultante de atividades humanas",
      "Somente a poluição do ar causada por indústrias",
      "Exclusivamente o desmatamento de áreas de preservação permanente",
      "Apenas os danos financeiros causados por uma obra"
    ],
    "correct_answer": "Qualquer alteração das propriedades físicas, químicas e biológicas do meio ambiente, causada por matéria ou energia resultante de atividades humanas",
    "explanation": "O texto cita literalmente essa definição do art. 1º da Resolução Conama nº 01/1986."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo Milaré e Benjamin (1993), citados no texto, o que é o EIA/RIMA?",
    "options": [
      "Um estudo das prováveis modificações nas diversas características socioeconômicas e biofísicas do meio ambiente que podem derivar de um projeto proposto",
      "Um documento exclusivamente financeiro exigido pelos bancos para liberar crédito",
      "Um certificado de conclusão de obra emitido pela prefeitura",
      "Um manual técnico de segurança do trabalho em canteiros de obras"
    ],
    "correct_answer": "Um estudo das prováveis modificações nas diversas características socioeconômicas e biofísicas do meio ambiente que podem derivar de um projeto proposto",
    "explanation": "O texto afirma que, \"de acordo com Milaré e Benjamin (1993), o EIA/RIMA nada mais é do que um estudo das prováveis modificações nas diversas características socioeconômicas e biofísicas do meio ambiente que podem derivar de um projeto proposto\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os três tipos de meio considerados no estudo de impacto ambiental (EIA/RIMA)?",
    "options": [
      "Físico, biológico e socioeconômico",
      "Urbano, rural e industrial",
      "Público, privado e misto",
      "Terrestre, aquático e aéreo"
    ],
    "correct_answer": "Físico, biológico e socioeconômico",
    "explanation": "O texto afirma que \"o estudo de impacto ambiental (EIA/RIMA) leva em consideração o meio físico, biológico e socioeconômico\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "De acordo com Mukai (1992), citado no texto, o que o Estado detém por meio do licenciamento ambiental?",
    "options": [
      "O poder de limitar o direito individual em prol da coletividade",
      "O poder de arrecadar impostos sobre construções",
      "O poder de desapropriar terrenos sem indenização",
      "O poder de vetar qualquer atividade econômica"
    ],
    "correct_answer": "O poder de limitar o direito individual em prol da coletividade",
    "explanation": "O texto afirma que, \"de acordo com Mukai (1992), por meio do licenciamento ambiental, o Estado detém o poder de limitar o direito individual em prol da coletividade\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as três licenças obtidas sequencialmente no processo tradicional de licenciamento ambiental?",
    "options": [
      "Licença prévia, licença de instalação e licença de operação",
      "Licença de projeto, licença de execução e licença de entrega",
      "Licença ambiental única, válida para todas as fases",
      "Licença simplificada e licença complexa, apenas"
    ],
    "correct_answer": "Licença prévia, licença de instalação e licença de operação",
    "explanation": "O texto descreve que \"as licenças são obtidas sequencialmente. A licença prévia é a primeira... Após a concessão da licença prévia é que se solicita a licença de instalação... Por fim, a licença de operação é requerida\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo Moreira (1999), citado no texto, como é definido o conceito de impacto?",
    "options": [
      "Qualquer alteração produzida pelos homens e suas atividades nas relações constitutivas do ambiente que exceda a capacidade de absorção",
      "Apenas alterações causadas por desastres naturais",
      "Exclusivamente mudanças na legislação urbanística municipal",
      "Somente efeitos visíveis a olho nu na paisagem urbana"
    ],
    "correct_answer": "Qualquer alteração produzida pelos homens e suas atividades nas relações constitutivas do ambiente que exceda a capacidade de absorção",
    "explanation": "O texto afirma que \"Moreira (1999) define o conceito de impacto como qualquer alteração produzida pelos homens e suas atividades nas relações constitutivas do ambiente que exceda a capacidade de absorção\"."
  },
  {
    "page": 19,
    "difficulty": "hard",
    "prompt": "Segundo o texto, por que o conceito de vizinhança, na abordagem de um EIV, é considerado flexível?",
    "options": [
      "Porque sua extensão varia conforme a natureza do impacto analisado — pode ser os vizinhos imediatos, as vias de tráfego ou até a bacia hidrográfica",
      "Porque cada prefeitura define seu próprio significado sem qualquer critério técnico",
      "Porque depende exclusivamente da opinião do empreendedor responsável pela obra",
      "Porque é sinônimo de área de preservação permanente"
    ],
    "correct_answer": "Porque sua extensão varia conforme a natureza do impacto analisado — pode ser os vizinhos imediatos, as vias de tráfego ou até a bacia hidrográfica",
    "explanation": "O texto afirma que \"o conceito de vizinhança poderá ser flexível a depender do item analisado\", exemplificando com edificação, tráfego e abastecimento de água."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o adensamento populacional analisado em um EIV pode ser classificado em quatro tipos. Quais são eles?",
    "options": [
      "Temporário, permanente, flutuante e ocasional",
      "Direto, indireto, misto e nulo",
      "Alto, médio, baixo e nulo",
      "Urbano, rural, litorâneo e histórico"
    ],
    "correct_answer": "Temporário, permanente, flutuante e ocasional",
    "explanation": "O texto afirma que \"o adensamento pode ser considerado temporário, permanente, flutuante ou ocasional\", detalhando cada tipo em seguida."
  }
];

const q_lesson_construcoes_sustentaveis_u2_p3 = [
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza o \"adensamento flutuante\", um dos quatro tipos de adensamento populacional analisados em um EIV?",
    "options": [
      "Ocorre quando um empreendimento é utilizado em uma determinada época do ano, como é comum em cidades litorâneas ou históricas em períodos de férias",
      "Ocorre de forma contínua, decorrente do uso residencial do empreendimento",
      "É rotineiro em dias e horários específicos, como o gerado por escolas",
      "Ocorre eventualmente, sem regularidade, como em centros de convenções ou teatros"
    ],
    "correct_answer": "Ocorre quando um empreendimento é utilizado em uma determinada época do ano, como é comum em cidades litorâneas ou históricas em períodos de férias",
    "explanation": "O texto define: \"o adensamento flutuante se dá quando um empreendimento é utilizado em uma determinada época do ano, como é comum em cidades litorâneas ou históricas em períodos de férias\"."
  },
  {
    "page": 22,
    "difficulty": "hard",
    "prompt": "Segundo Davidson e Acioly (1998), citados no texto, quais são citadas como vantagens da alta densidade urbana?",
    "options": [
      "Eficiência na oferta da infraestrutura, uso eficiente da terra, geração de receitas e vitalidade urbana",
      "Redução total da criminalidade e da poluição na área urbana",
      "Ausência de congestionamentos e menor pressão sobre áreas de estacionamento",
      "Menor custo de manutenção dos serviços públicos em qualquer situação"
    ],
    "correct_answer": "Eficiência na oferta da infraestrutura, uso eficiente da terra, geração de receitas e vitalidade urbana",
    "explanation": "O texto lista como vantagens da alta densidade: \"eficiência na oferta da infraestrutura, uso eficiente da terra, geração de receitas, vitalidade urbana, economia de escala, maior controle social...\" (Davidson; Acioly, 1998)."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o Denatran (2001), citado no texto, o que são os polos geradores de tráfego (PGT)?",
    "options": [
      "Empreendimentos de grande porte que atraem ou produzem um grande número de viagens, causando reflexos negativos na circulação viária do entorno",
      "Vias exclusivas para pedestres em centros históricos das cidades",
      "Terminais rodoviários interestaduais de pequeno porte",
      "Sistemas de sinalização eletrônica de trânsito instalados em cruzamentos"
    ],
    "correct_answer": "Empreendimentos de grande porte que atraem ou produzem um grande número de viagens, causando reflexos negativos na circulação viária do entorno",
    "explanation": "O texto afirma que, \"segundo o Departamento Nacional de Trânsito (Denatran, 2001), os polos geradores de tráfego são empreendimentos de grande porte que atraem ou produzem um grande número de viagens, causando reflexos negativos na circulação viária em seu entorno imediato\"."
  },
  {
    "page": 27,
    "difficulty": "hard",
    "prompt": "Segundo Moraes (2001 apud Campos, 2005), citado no texto, um dos fatores a considerar na análise da paisagem urbana em um EIV é a repercussão da implantação sobre qual aspecto?",
    "options": [
      "A permeabilidade visual em relação ao elemento relevante do cenário urbano",
      "O valor de revenda dos imóveis vizinhos ao empreendimento",
      "A quantidade de vagas de estacionamento disponíveis no entorno",
      "O consumo de energia elétrica do próprio empreendimento"
    ],
    "correct_answer": "A permeabilidade visual em relação ao elemento relevante do cenário urbano",
    "explanation": "O texto lista, entre os fatores de Moraes (2001 apud Campos, 2005), \"a repercussão da implantação sobre a permeabilidade visual em relação ao elemento relevante do cenário urbano\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as cinco etapas sugeridas para a elaboração de um estudo de impacto de vizinhança?",
    "options": [
      "Descrição do projeto; descrição do ambiente na área de influência; identificação e avaliação dos impactos; proposição de medidas de adequação; e estudos ambientais",
      "Aprovação, licenciamento, construção, operação e desativação",
      "Diagnóstico, prognóstico, mitigação, monitoramento e encerramento",
      "Vistoria, laudo, parecer, recurso e sentença"
    ],
    "correct_answer": "Descrição do projeto; descrição do ambiente na área de influência; identificação e avaliação dos impactos; proposição de medidas de adequação; e estudos ambientais",
    "explanation": "O texto lista exatamente essas cinco etapas sugeridas para a elaboração de um EIV."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são alguns dos principais impactos ambientais provocados por obras de infraestrutura?",
    "options": [
      "Desmatamento e perda de habitats, poluição do ar e da água, alterações no ciclo hidrológico e impactos sobre a biodiversidade",
      "Exclusivamente a valorização imobiliária do entorno da obra",
      "Apenas a geração de empregos temporários durante a construção",
      "Somente mudanças na sinalização viária local"
    ],
    "correct_answer": "Desmatamento e perda de habitats, poluição do ar e da água, alterações no ciclo hidrológico e impactos sobre a biodiversidade",
    "explanation": "O texto lista esses como \"alguns dos principais impactos ambientais provocados por obras de infraestrutura\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "De acordo com Prata (2020), citado no texto, o que caracteriza a Licença Prévia (LP) no processo de licenciamento ambiental?",
    "options": [
      "É obtida na fase de projeto e avalia a localização e viabilidade ambiental do empreendimento",
      "É emitida somente após a conclusão total da obra",
      "Autoriza exclusivamente pesquisas sísmicas marítimas e em zonas de transição",
      "Substitui integralmente a necessidade de uma licença de instalação"
    ],
    "correct_answer": "É obtida na fase de projeto e avalia a localização e viabilidade ambiental do empreendimento",
    "explanation": "O texto define a Licença Prévia (LP) como aquela \"obtida na fase de projeto e avalia a localização e viabilidade ambiental do empreendimento\" (Prata, 2020)."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "De acordo com Prata (2020), citado no texto, o que caracteriza a Licença de Operação (LO)?",
    "options": [
      "É emitida após a conclusão da construção, confirmando que a obra foi realizada conforme planejado, e autoriza o funcionamento do empreendimento",
      "É a primeira licença obtida, antes mesmo da elaboração do projeto",
      "Autoriza exclusivamente estudos de viabilidade financeira do empreendimento",
      "Substitui integralmente a necessidade de EIA/RIMA em qualquer caso"
    ],
    "correct_answer": "É emitida após a conclusão da construção, confirmando que a obra foi realizada conforme planejado, e autoriza o funcionamento do empreendimento",
    "explanation": "O texto define a LO como aquela \"emitida após a conclusão da construção, confirma que a obra foi realizada conforme o que foi planejado... Além de autorizar o funcionamento do empreendimento, estabelece regras contínuas para sua operação\"."
  },
  {
    "page": 32,
    "difficulty": "hard",
    "prompt": "Segundo Prata (2020), citado no texto, qual é a validade típica da Licença de Operação (LO)?",
    "options": [
      "De 4 a 10 anos",
      "De 1 a 2 anos",
      "Vitalícia, sem necessidade de renovação",
      "De 6 meses"
    ],
    "correct_answer": "De 4 a 10 anos",
    "explanation": "O texto afirma que a validade da LO \"varia de 4 a 10 anos\" (Prata, 2020)."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo Melo Filho, Espindola e Façanha (2021), citados no texto, em que ano foi estabelecida a Lei nº 6.938/81, que trata da Política Nacional do Meio Ambiente (PNMA)?",
    "options": [
      "1981",
      "1986",
      "1988",
      "1997"
    ],
    "correct_answer": "1981",
    "explanation": "O texto afirma que \"em 1981, foi estabelecida a Lei nº 6.938/81, que trata da Política Nacional do Meio Ambiente (PNMA)\"."
  }
];

const q_lesson_construcoes_sustentaveis_u2_p4 = [
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo o art. 2º da Resolução nº 1/1986 do Conama, citado no texto, qual das seguintes atividades exige elaboração de EIA/RIMA?",
    "options": [
      "Estradas de rodagem com duas ou mais faixas de rolamento",
      "Reforma de residência unifamiliar de pequeno porte",
      "Construção de calçadas em vias urbanas já pavimentadas",
      "Instalação de comércio de pequeno porte em zona residencial"
    ],
    "correct_answer": "Estradas de rodagem com duas ou mais faixas de rolamento",
    "explanation": "O texto lista \"estradas de rodagem com duas ou mais faixas de rolamento\" entre as atividades que exigem EIA/RIMA, segundo o art. 2º da Resolução nº 1/1986."
  },
  {
    "page": 34,
    "difficulty": "hard",
    "prompt": "Segundo o texto (Resolução nº 1/1986 do Conama), a partir de que potência as usinas de geração de eletricidade passam a exigir EIA/RIMA, qualquer que seja a fonte de energia primária?",
    "options": [
      "Acima de 10 MW",
      "Acima de 100 MW",
      "Acima de 1 MW",
      "Acima de 500 kW"
    ],
    "correct_answer": "Acima de 10 MW",
    "explanation": "O texto lista \"usinas de geração de eletricidade, qualquer que seja a fonte de energia primária, acima de 10 MW\" entre as atividades sujeitas a EIA/RIMA."
  },
  {
    "page": 35,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual lei é conhecida como Estatuto da Cidade?",
    "options": [
      "Lei nº 10.257, de 2001",
      "Lei nº 6.938, de 1981",
      "Lei nº 12.305, de 2010",
      "Lei nº 9.605, de 1998"
    ],
    "correct_answer": "Lei nº 10.257, de 2001",
    "explanation": "O texto afirma que \"a Lei nº 10.257, conhecida como Estatuto da Cidade, propõe o estudo de impacto de vizinhança (EIV)\"."
  },
  {
    "page": 36,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que condição o EIA/RIMA é exigido para fins de licenciamento ambiental?",
    "options": [
      "Quando o projeto for considerado um gerador de significativo impacto ambiental",
      "Apenas quando se trata de obra pública, de qualquer porte",
      "Somente quando o empreendimento está localizado em área rural",
      "Exclusivamente para atividades industriais de pequeno porte"
    ],
    "correct_answer": "Quando o projeto for considerado um gerador de significativo impacto ambiental",
    "explanation": "O texto afirma que o EIA/RIMA \"é exigido para fins de licenciamento ambiental, quando o projeto for considerado um gerador de significativo impacto ambiental\"."
  }
];

// ---------------------------------------------------------------------------
// track_s01_construcoes_sustentaveis — Unidade 4 — Diretrizes para Sustentabilidade das Edificações (35 perguntas, fonte: q_construcoes_sustentaveis_u4.json)
// ---------------------------------------------------------------------------
const q_lesson_construcoes_sustentaveis_u4_p1 = [
  {
    "page": 1,
    "difficulty": "easy",
    "prompt": "Qual é o título da Unidade 4 do material de Construções Sustentáveis, segundo o texto?",
    "options": [
      "Diretrizes para Sustentabilidade das Edificações",
      "Construção Civil e Desenvolvimento Sustentável",
      "Planejamento e Viabilidade da Implantação de Empreendimentos",
      "Consumo Energético e Certificação Ambiental"
    ],
    "correct_answer": "Diretrizes para Sustentabilidade das Edificações",
    "explanation": "O texto identifica \"Unidade 4 - Diretrizes para Sustentabilidade das Edificações\" como título desta unidade."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo a NR 18 (Brasil, 1995), citada no texto, como é definido canteiro de obras?",
    "options": [
      "\"área de trabalho fixa e temporária onde se desenvolvem operações de apoio e execução de uma obra\"",
      "\"qualquer terreno urbano destinado à construção civil, independente de uso\"",
      "\"local exclusivo para armazenamento de materiais de construção\"",
      "\"espaço de convivência dos trabalhadores em uma obra\""
    ],
    "correct_answer": "\"área de trabalho fixa e temporária onde se desenvolvem operações de apoio e execução de uma obra\"",
    "explanation": "O texto cita literalmente essa definição da NR 18 (Brasil, 1995)."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Souza et al. (1997), citados no texto, em quantos grupos são agrupados os principais elementos presentes nos canteiros de obras de construção de edifícios?",
    "options": [
      "Sete",
      "Três",
      "Cinco",
      "Dez"
    ],
    "correct_answer": "Sete",
    "explanation": "O texto lista sete grupos: ligados à produção, de apoio à produção, sistemas de transporte com/sem decomposição de movimento, de apoio técnico/administrativo, áreas de vivência e outros elementos."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "De acordo com Degani (2003), citado no texto, os aspectos e impactos ambientais de um canteiro de obras podem ser verificados a partir de quais macroatividades ao longo do ciclo de vida dos edifícios?",
    "options": [
      "Investigação e preparação do terreno, atividades de produção, gestão de recursos humanos e suprimentos, manutenção e reabilitação, descarte de resíduos, entre outras",
      "Exclusivamente a fase de acabamento da obra",
      "Somente as atividades administrativas do canteiro de obras",
      "Apenas o transporte de materiais até o canteiro"
    ],
    "correct_answer": "Investigação e preparação do terreno, atividades de produção, gestão de recursos humanos e suprimentos, manutenção e reabilitação, descarte de resíduos, entre outras",
    "explanation": "O texto lista essas macroatividades como fonte dos aspectos e impactos ambientais, segundo Degani (2003, p. 151)."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Araújo (2009), citada no texto, os aspectos ambientais detectados por Degani (2003) foram divididos em quatro temas. Quais são eles?",
    "options": [
      "Recursos; incômodos e poluições; resíduos; e infraestrutura do canteiro de obras",
      "Água, energia, materiais e mão de obra",
      "Planejamento, execução, entrega e garantia",
      "Segurança, qualidade, custo e prazo"
    ],
    "correct_answer": "Recursos; incômodos e poluições; resíduos; e infraestrutura do canteiro de obras",
    "explanation": "O texto afirma que \"Araújo (2009, p. 44), a partir dos aspectos ambientais detectados por Degani (2003), elaborou uma divisão em quatro temas: 1. Recursos. 2. Incômodos e poluições. 3. Resíduos. 4. Infraestrutura do canteiro de obras\"."
  },
  {
    "page": 6,
    "difficulty": "hard",
    "prompt": "Segundo Araújo (2009), citada no texto, o que a emissão de material particulado pode gerar nas edificações?",
    "options": [
      "\"patologias nas edificações, tais como a corrosão de metais, danos a pedras calcárias, concretos, argamassas, superfícies pintadas, etc.\"",
      "Exclusivamente problemas respiratórios nos trabalhadores da obra",
      "Apenas a redução da visibilidade dentro do canteiro de obras",
      "Somente o aumento do custo de limpeza da obra"
    ],
    "correct_answer": "\"patologias nas edificações, tais como a corrosão de metais, danos a pedras calcárias, concretos, argamassas, superfícies pintadas, etc.\"",
    "explanation": "O texto cita literalmente essa afirmação de Araújo (2009, p. 51)."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o Quadro 1 do texto (adaptado de Degani, 2003), quais impactos são atribuídos ao meio físico do solo em um canteiro de obras?",
    "options": [
      "Alteração das propriedades físicas do solo e contaminação química do solo",
      "Poluição sonora e alteração da qualidade paisagística",
      "Escassez de água e de energia elétrica",
      "Geração de emprego e renda"
    ],
    "correct_answer": "Alteração das propriedades físicas do solo e contaminação química do solo",
    "explanation": "O Quadro 1 do texto lista, para o \"meio físico (solo)\": \"alteração das propriedades físicas do solo\" e \"contaminação química do solo\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais ações são recomendadas para reduzir o consumo e desperdício de água em um canteiro de obras?",
    "options": [
      "Usar dispositivos de redução de pressão, tecnologias economizadoras de água, medidores individuais e fontes alternativas como coleta de águas pluviais",
      "Proibir totalmente o uso de água potável na obra, sem exceções",
      "Instalar apenas torneiras convencionais sem qualquer regulagem",
      "Aumentar a pressão da rede hidráulica para reduzir o tempo de uso"
    ],
    "correct_answer": "Usar dispositivos de redução de pressão, tecnologias economizadoras de água, medidores individuais e fontes alternativas como coleta de águas pluviais",
    "explanation": "O texto lista essas ações entre as diretrizes relacionadas ao \"consumo e desperdício de água\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo Andrade (2004), citado no texto, quais ações são propostas para reduzir os incômodos causados pela emissão de ruídos em um canteiro de obras?",
    "options": [
      "Realizar atividades em horários que causem menos desconforto, instalar silenciadores, manter equipamentos desligados quando não em uso e prever barreiras físicas",
      "Proibir totalmente o uso de qualquer equipamento motorizado na obra",
      "Realizar todas as atividades ruidosas exclusivamente durante a madrugada",
      "Aumentar a potência dos equipamentos para reduzir o tempo total de execução"
    ],
    "correct_answer": "Realizar atividades em horários que causem menos desconforto, instalar silenciadores, manter equipamentos desligados quando não em uso e prever barreiras físicas",
    "explanation": "O texto lista essas ações propostas por Andrade (2004) para a redução de incômodos pela emissão de ruídos."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo Yeang (2001), citado no texto, o que o projeto ecológico deve buscar?",
    "options": [
      "O menor impacto ambiental, considerando a edificação em todo o seu ciclo de vida (produção, construção, funcionamento e recuperação)",
      "Exclusivamente a redução de custos de construção",
      "Apenas a valorização estética da fachada do edifício",
      "Somente a conformidade com normas de segurança contra incêndio"
    ],
    "correct_answer": "O menor impacto ambiental, considerando a edificação em todo o seu ciclo de vida (produção, construção, funcionamento e recuperação)",
    "explanation": "O texto afirma que, \"para Yeang (2001), o projeto ecológico deve buscar o menor impacto ambiental e considerar a edificação em todo o seu ciclo de vida, contemplando as etapas de produção, construção, funcionamento e recuperação\"."
  }
];

const q_lesson_construcoes_sustentaveis_u4_p2 = [
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "A partir de Triana (2005), citada no texto, quais categorias devem ser implementadas para que um projeto arquitetônico se torne sustentável?",
    "options": [
      "Escolha de um entorno sustentável; uso racional dos recursos naturais; manutenção da qualidade ambiental interna; e características do projeto e seus aspectos socioeconômicos",
      "Escolha do terreno mais barato disponível; uso de qualquer material; e ausência de acessibilidade",
      "Apenas a escolha de materiais reciclados na fachada",
      "Somente a redução do custo total da obra"
    ],
    "correct_answer": "Escolha de um entorno sustentável; uso racional dos recursos naturais; manutenção da qualidade ambiental interna; e características do projeto e seus aspectos socioeconômicos",
    "explanation": "O texto lista exatamente essas quatro categorias identificadas a partir de Triana (2005)."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo Triana (2005), citada no texto, quais são as quatro estratégias de obtenção de ventilação natural descritas?",
    "options": [
      "Ventilação cruzada, efeito chaminé, pátio ou átrio, e ventilação na cobertura",
      "Ventilação mecânica, ventilação forçada, ventilação natural e ventilação artificial",
      "Refrigeração passiva, refrigeração ativa, aquecimento passivo e aquecimento ativo",
      "Aberturas zenitais, aberturas laterais, aberturas frontais e aberturas traseiras"
    ],
    "correct_answer": "Ventilação cruzada, efeito chaminé, pátio ou átrio, e ventilação na cobertura",
    "explanation": "O texto descreve exatamente essas quatro estratégias, segundo Triana (2005, p. 163)."
  },
  {
    "page": 17,
    "difficulty": "hard",
    "prompt": "Segundo o texto, quem projetou o Hospital Sarah Kubitschek, em Fortaleza, destacado como exemplo de interação entre ventilação e iluminação naturais?",
    "options": [
      "João Filgueiras Lima (Lelé)",
      "Oscar Niemeyer",
      "Lina Bo Bardi",
      "Ken Yeang"
    ],
    "correct_answer": "João Filgueiras Lima (Lelé)",
    "explanation": "O texto afirma que \"as soluções de projeto do Hospital Sarah Kubitschek, em Fortaleza, são de autoria do arquiteto João Filgueiras Lima, popularmente conhecido como Lelé\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Lamberts, Pereira e Dutra (1997), citados no texto, quais recomendações são feitas para a iluminação artificial?",
    "options": [
      "Dispor a iluminação paralelamente às janelas, projetar a profundidade do espaço menor que 2,5 vezes a altura do piso, e posicionar atividades que exijam maior iluminação perto das janelas",
      "Utilizar exclusivamente lâmpadas incandescentes em todos os ambientes",
      "Eliminar totalmente a iluminação artificial em favor exclusivamente da natural",
      "Instalar luminárias apenas no centro geométrico do ambiente"
    ],
    "correct_answer": "Dispor a iluminação paralelamente às janelas, projetar a profundidade do espaço menor que 2,5 vezes a altura do piso, e posicionar atividades que exijam maior iluminação perto das janelas",
    "explanation": "O texto lista essas três recomendações de Lamberts, Pereira e Dutra (1997)."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os três grupos de requisitos dos usuários que devem ser atendidos conforme a NBR 15575 (ABNT, 2013)?",
    "options": [
      "Segurança, habitabilidade e sustentabilidade",
      "Custo, prazo e qualidade",
      "Projeto, execução e manutenção",
      "Estética, funcionalidade e economia"
    ],
    "correct_answer": "Segurança, habitabilidade e sustentabilidade",
    "explanation": "O texto afirma que \"os requisitos dos usuários devem ser atendidos para promover segurança, habitabilidade e sustentabilidade\", detalhando os fatores de cada grupo (ABNT, 2013)."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é recomendado quanto à escolha de materiais em um projeto sustentável?",
    "options": [
      "Priorizar materiais encontrados na região, para evitar gastos e aumento da poluição decorrentes do transporte",
      "Priorizar exclusivamente materiais importados de alta tecnologia",
      "Utilizar apenas um único tipo de material em toda a edificação",
      "Evitar totalmente o uso de materiais pré-fabricados"
    ],
    "correct_answer": "Priorizar materiais encontrados na região, para evitar gastos e aumento da poluição decorrentes do transporte",
    "explanation": "O texto afirma que \"devem-se priorizar materiais encontrados na região, a fim de evitar gastos e aumento da poluição decorrentes do transporte de itens\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "De acordo com Cardoso (2006), citado no texto, quais impactos ambientais são atribuídos ao meio antrópico da vizinhança em obras de canteiro?",
    "options": [
      "Alteração da qualidade da paisagem, diminuição das condições de saúde, incômodo para a comunidade, alteração do tráfego local e escassez de recursos",
      "Exclusivamente impactos financeiros para o empreendedor da obra",
      "Apenas mudanças na fauna e flora local do entorno",
      "Somente riscos trabalhistas para os funcionários da obra"
    ],
    "correct_answer": "Alteração da qualidade da paisagem, diminuição das condições de saúde, incômodo para a comunidade, alteração do tráfego local e escassez de recursos",
    "explanation": "O texto lista esses impactos \"no meio antrópico da vizinhança\", segundo Cardoso (2006)."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são algumas das diretrizes de sustentabilidade citadas para a etapa de execução de obra?",
    "options": [
      "Evitar a supressão da cobertura vegetal, controlar a geração de poeira, cobrir caminhões e pilhas de materiais, usar tintas não tóxicas e não queimar resíduos no canteiro",
      "Utilizar exclusivamente materiais importados certificados internacionalmente",
      "Concentrar toda a obra em um único turno noturno de trabalho",
      "Eliminar totalmente o uso de equipamentos elétricos na obra"
    ],
    "correct_answer": "Evitar a supressão da cobertura vegetal, controlar a geração de poeira, cobrir caminhões e pilhas de materiais, usar tintas não tóxicas e não queimar resíduos no canteiro",
    "explanation": "O texto lista exatamente essas diretrizes entre as recomendadas para a etapa de execução de obra."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Para Abiko, Gonçalves e Cardoso (2003), citados no texto, quais fatores dificultam o desenvolvimento da qualidade no setor da construção civil no Brasil?",
    "options": [
      "A baixa produtividade, a falta de qualidade de produtos e a necessidade de manutenções periódicas após a entrega da obra",
      "A ausência total de mão de obra disponível no mercado de trabalho",
      "O excesso de regulamentação ambiental sobre o setor",
      "A falta de demanda por novos empreendimentos imobiliários"
    ],
    "correct_answer": "A baixa produtividade, a falta de qualidade de produtos e a necessidade de manutenções periódicas após a entrega da obra",
    "explanation": "O texto afirma que, \"para Abiko, Gonçalves e Cardoso (2003), no Brasil, diversos fatores dificultam o desenvolvimento da qualidade no setor da construção civil, como a baixa produtividade, a falta de qualidade de produtos... e a necessidade de manutenções periódicas\"."
  },
  {
    "page": 27,
    "difficulty": "medium",
    "prompt": "Segundo Formoso et al. (2006), citados no texto, o que caracteriza as \"perdas por substituição\" na construção civil?",
    "options": [
      "Decorrem da utilização de um material com valor ou características de desempenho superiores ao especificado",
      "Ocorrem quando há produção em quantidades superiores às necessárias",
      "Originam-se de movimentos desnecessários realizados pelos trabalhadores",
      "Estão associadas à existência de estoques excessivos de materiais"
    ],
    "correct_answer": "Decorrem da utilização de um material com valor ou características de desempenho superiores ao especificado",
    "explanation": "O texto define: \"perdas por substituição: decorrem da utilização de um material com valor ou características de desempenho superiores ao especificado\" (Formoso et al., 2006)."
  }
];

const q_lesson_construcoes_sustentaveis_u4_p3 = [
  {
    "page": 29,
    "difficulty": "easy",
    "prompt": "Segundo o texto, desde que ano está em vigor a norma NBR 15575?",
    "options": [
      "2013",
      "2001",
      "1997",
      "2020"
    ],
    "correct_answer": "2013",
    "explanation": "O texto afirma que \"em vigor desde 2013, a norma NBR 15575 (ABNT, 2013) estabelece os requisitos que servem como parâmetros para aferir a qualidade de uma construção\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo o texto, a NBR 15575/2013 é baseada em requisitos e critérios de desempenho expressos em quantos níveis?",
    "options": [
      "Três (mínimo, intermediário e superior)",
      "Dois (aprovado e reprovado)",
      "Cinco (A, B, C, D e E)",
      "Um único nível padrão"
    ],
    "correct_answer": "Três (mínimo, intermediário e superior)",
    "explanation": "O texto afirma que a norma \"é baseada em requisitos e critérios de desempenho expressos em três níveis (mínimo, intermediário e superior)\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os seis requisitos e critérios definidos pela norma de desempenho NBR 15575, partes 1 a 6?",
    "options": [
      "Requisitos gerais; sistemas estruturais; sistemas de pisos; sistemas de vedações verticais; sistemas de coberturas; e sistemas hidrossanitários",
      "Fundação, estrutura, alvenaria, cobertura, pintura e acabamento",
      "Projeto, orçamento, execução, entrega, garantia e manutenção",
      "Segurança, conforto, estética, custo, prazo e qualidade"
    ],
    "correct_answer": "Requisitos gerais; sistemas estruturais; sistemas de pisos; sistemas de vedações verticais; sistemas de coberturas; e sistemas hidrossanitários",
    "explanation": "O texto lista exatamente esses seis requisitos e critérios definidos pelas partes 1 a 6 da norma."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 15.220-3 (ABNT, 2005), citada no texto, o zoneamento bioclimático brasileiro é composto por quantas zonas diferentes?",
    "options": [
      "Oito",
      "Cinco",
      "Doze",
      "Quatro"
    ],
    "correct_answer": "Oito",
    "explanation": "O texto afirma que \"o zoneamento bioclimático brasileiro é composto por oito diferentes zonas\"."
  },
  {
    "page": 33,
    "difficulty": "hard",
    "prompt": "Segundo a NBR 15575 (ABNT, 2013), citada no texto, para preservar o conforto térmico no inverno, os valores mínimos diários de temperatura interna devem ser iguais ou superiores à temperatura mínima externa acrescida de quantos graus?",
    "options": [
      "3 °C",
      "1 °C",
      "5 °C",
      "10 °C"
    ],
    "correct_answer": "3 °C",
    "explanation": "O texto afirma que os valores mínimos diários de temperatura interna \"devem sempre ser iguais ou superiores à temperatura mínima externa, acrescida de 3 °C\"."
  },
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em quais zonas bioclimáticas não é obrigatória a avaliação de desempenho térmico para o inverno, conforme a NBR 15575?",
    "options": [
      "Zonas 6, 7 e 8",
      "Zonas 1, 2 e 3",
      "Todas as zonas exigem essa avaliação, sem exceção",
      "Apenas a zona 8"
    ],
    "correct_answer": "Zonas 6, 7 e 8",
    "explanation": "O texto afirma que \"nas áreas 6, 7 e 8, não é obrigatória a avaliação de desempenho térmico para o inverno\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 15575 (ABNT, 2013), citada no texto, quais medidas podem atender aos requisitos de iluminância natural?",
    "options": [
      "Correta orientação geográfica da edificação, dimensionamento e posição das aberturas, tipos de janelas e envidraçamentos, rugosidade e cores dos elementos, e poços de ventilação e iluminação",
      "Exclusivamente o uso de lâmpadas de LED de alta potência",
      "Apenas a redução do número de pavimentos do edifício",
      "Somente a pintura externa em cores escuras"
    ],
    "correct_answer": "Correta orientação geográfica da edificação, dimensionamento e posição das aberturas, tipos de janelas e envidraçamentos, rugosidade e cores dos elementos, e poços de ventilação e iluminação",
    "explanation": "O texto lista exatamente essas medidas como forma de atender aos requisitos de iluminância natural (ABNT, 2013, p. 29)."
  },
  {
    "page": 38,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 15575 (ABNT, 2013), citada no texto, qual é o pé-direito mínimo determinado para ambientes habitacionais como salas, quartos e cozinhas?",
    "options": [
      "2,50 m",
      "2,00 m",
      "3,00 m",
      "2,20 m"
    ],
    "correct_answer": "2,50 m",
    "explanation": "O texto afirma que \"a NBR 15575 determina o pé direito mínimo para os ambientes habitacionais: 2,50 m para ambientes como salas, quartos, cozinhas, etc.\"."
  },
  {
    "page": 38,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 15575 (ABNT, 2013), citada no texto, qual é a altura mínima permitida em vestíbulos, halls, corredores, instalações sanitárias e despensas?",
    "options": [
      "2,30 m",
      "2,50 m",
      "2,10 m",
      "2,70 m"
    ],
    "correct_answer": "2,30 m",
    "explanation": "O texto afirma que esses ambientes \"podendo ter altura mínima de 2,30 m em vestíbulos, halls, corredores, instalações sanitárias e despensas\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quem é responsável por especificar materiais, produtos e processos que atendam aos requisitos mínimos da NBR 15575 (ABNT, 2013)?",
    "options": [
      "O projetista",
      "Exclusivamente o usuário final",
      "Apenas o fabricante dos materiais",
      "Somente a empresa de manutenção"
    ],
    "correct_answer": "O projetista",
    "explanation": "O texto afirma que \"o projetista é responsável por especificar materiais, produtos e processos que atendam aos requisitos mínimos da NBR 15575 (ABNT, 2013)\"."
  }
];

const q_lesson_construcoes_sustentaveis_u4_p4 = [
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 15575 (ABNT, 2013), citada no texto, de quem é a responsabilidade de identificar riscos previsíveis na época do projeto, como presença de aterro sanitário ou contaminação do lençol freático na área de implantação?",
    "options": [
      "Do incorporador",
      "Do usuário final da unidade",
      "Exclusivamente do fabricante de materiais",
      "Da empresa especializada em manutenção"
    ],
    "correct_answer": "Do incorporador",
    "explanation": "O texto afirma que \"é de responsabilidade do incorporador a identificação dos riscos previsíveis na época do projeto, como presença de aterro sanitário na área de implantação do empreendimento, contaminação do lençol freático\"."
  },
  {
    "page": 40,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quem é responsável por realizar a manutenção necessária no edifício, conforme a ABNT NBR 5674 e os manuais entregues pelo construtor?",
    "options": [
      "O usuário",
      "Exclusivamente o incorporador",
      "Apenas o projetista responsável pela obra",
      "Somente o fabricante dos materiais empregados"
    ],
    "correct_answer": "O usuário",
    "explanation": "O texto afirma que \"cabe ao usuário realizar a manutenção necessária no edifício, conforme a ABNT NBR 5674 e os manuais entregues pelo construtor\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são algumas das principais ações de planejamento em canteiros de obras citadas?",
    "options": [
      "Separação dos materiais, utilização de baias para estocagem de britas e areias, treinamento da equipe para limpeza diária e horários específicos para subida e descida de material",
      "Concentração de todos os materiais em um único local sem qualquer separação",
      "Eliminação total de horários fixos para as atividades do canteiro",
      "Ausência de qualquer treinamento da equipe de trabalho"
    ],
    "correct_answer": "Separação dos materiais, utilização de baias para estocagem de britas e areias, treinamento da equipe para limpeza diária e horários específicos para subida e descida de material",
    "explanation": "O texto lista exatamente essas ações entre as \"principais ações de planejamento em canteiros de obras\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo Triana (2005), citada no texto, quais estratégias são recomendadas para maximizar a iluminação natural na edificação?",
    "options": [
      "Aumentar o perímetro do edifício, usar cores claras para alta reflexão de luz, utilizar vidros de alta transparência e garantir o recuo mínimo",
      "Reduzir ao máximo o número de aberturas na fachada",
      "Utilizar exclusivamente cores escuras nas paredes internas",
      "Eliminar completamente o uso de vidros nas fachadas do edifício"
    ],
    "correct_answer": "Aumentar o perímetro do edifício, usar cores claras para alta reflexão de luz, utilizar vidros de alta transparência e garantir o recuo mínimo",
    "explanation": "O texto lista essas estratégias entre as apontadas por Triana (2005, p. 168) para maximizar a iluminação natural."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza o \"efeito chaminé\" como estratégia de ventilação natural?",
    "options": [
      "Promove uma extração de ar mais quente a partir de aberturas conectadas a um duto de extração vertical, com entrada de ar frio por aberturas inferiores",
      "Consiste apenas em abrir janelas em uma única fachada da edificação",
      "Depende exclusivamente de ventiladores mecânicos instalados na cobertura",
      "Ocorre apenas em edificações que possuem pátio interno ajardinado"
    ],
    "correct_answer": "Promove uma extração de ar mais quente a partir de aberturas conectadas a um duto de extração vertical, com entrada de ar frio por aberturas inferiores",
    "explanation": "O texto descreve que no efeito chaminé \"o ar frio (mais denso) entra no ambiente a partir de aberturas inferiores. Já a saída do ar (mais quente) acontece por meio de aberturas conectadas a um duto de extração vertical\"."
  }
];

// ---------------------------------------------------------------------------
// track_s02_desenho_arquitetura_urbanismo — Unidade 1 — Introdução ao Desenho de Arquitetura e Urbanismo (34 perguntas, fonte: q_desenho_arquitetura_urbanismo_u1.json)
// ---------------------------------------------------------------------------
const q_lesson_desenho_arquitetura_urbanismo_u1_p1 = [
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Francis D. K. Ching (2012), citado no texto, como é definido \"desenhar\"?",
    "options": [
      "\"o processo ou a técnica de representação de alguma coisa – um objeto, uma cena ou uma ideia – por meio de linhas em uma superfície\"",
      "\"a habilidade inata que apenas alguns profissionais possuem desde o nascimento\"",
      "\"o uso exclusivo de programas de CAD para criar projetos arquitetônicos\"",
      "\"a etapa final do processo de projeto, após a aprovação do cliente\""
    ],
    "correct_answer": "\"o processo ou a técnica de representação de alguma coisa – um objeto, uma cena ou uma ideia – por meio de linhas em uma superfície\"",
    "explanation": "O texto cita literalmente essa definição de Ching (2012, p. 1), na obra Desenho para Arquitetos."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Kowaltowski (2011), citada no texto, o que faz parte da construção cognitiva do arquiteto no processo criativo?",
    "options": [
      "A coleta e análise de dados, entrevistas com os envolvidos e comparações com outras referências arquitetônicas",
      "Exclusivamente o talento artístico inato do profissional",
      "Apenas o uso de softwares de modelagem 3D",
      "Somente a experiência financeira do escritório"
    ],
    "correct_answer": "A coleta e análise de dados, entrevistas com os envolvidos e comparações com outras referências arquitetônicas",
    "explanation": "O texto afirma que \"a coleta e análise de dados realizada pelo arquiteto, entrevistas com os envolvidos e comparações com outras referências arquitetônicas, aumento de repertório, fazem parte da construção cognitiva do profissional\" (Kowaltowski, 2011)."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o desenho artístico e o desenho técnico têm objetivos diferentes. Qual é a principal diferença apontada?",
    "options": [
      "O desenho técnico deve transmitir com exatidão todas as características de um objeto para ser interpretado igualmente por diferentes profissionais, enquanto o artístico expressa o sentimento do artista",
      "Não há diferença real entre os dois tipos de desenho",
      "O desenho artístico é sempre mais preciso dimensionalmente do que o técnico",
      "O desenho técnico não pode ser feito à mão, apenas digitalmente"
    ],
    "correct_answer": "O desenho técnico deve transmitir com exatidão todas as características de um objeto para ser interpretado igualmente por diferentes profissionais, enquanto o artístico expressa o sentimento do artista",
    "explanation": "O texto afirma que \"o desenho artístico geralmente expressa o sentimento do artista... enquanto o desenho técnico deve transmitir com exatidão todas as características de um objeto, para poder ser interpretado igualmente por distintos profissionais, tornando-o universal\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são citadas como formas de estimular a criatividade no desenvolvimento de projeto arquitetônico?",
    "options": [
      "Brainstorming, Mapa Mental e Teoria da Solução Inventiva de Problemas (TRIZ)",
      "Exclusivamente cursos de pós-graduação em arquitetura",
      "Apenas a repetição de projetos já existentes no escritório",
      "Somente a consulta a normas técnicas da ABNT"
    ],
    "correct_answer": "Brainstorming, Mapa Mental e Teoria da Solução Inventiva de Problemas (TRIZ)",
    "explanation": "O texto lista essas técnicas entre as \"outras formas de se estimular a criatividade\" no desenvolvimento de projeto arquitetônico."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é o programa arquitetônico (ou programa de necessidades)?",
    "options": [
      "Uma lista dos cômodos que devem conter no projeto arquitetônico, entendendo a função de cada item",
      "Um documento exclusivamente financeiro que define o orçamento da obra",
      "Um conjunto de plantas já finalizadas prontas para execução",
      "Um relatório de vistoria da obra concluída"
    ],
    "correct_answer": "Uma lista dos cômodos que devem conter no projeto arquitetônico, entendendo a função de cada item",
    "explanation": "O texto afirma que \"o programa arquitetônico nada mais é do que uma lista dos cômodos que devem conter no projeto arquitetônico a ser elaborado\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para construir uma residência unifamiliar, qual norma técnica deve ser consultada para definir o programa arquitetônico básico?",
    "options": [
      "NBR 16636",
      "NBR 6492",
      "NBR 15575",
      "NBR 9050"
    ],
    "correct_answer": "NBR 16636",
    "explanation": "O texto afirma que \"para construir uma residência unifamiliar é necessário consultar a NBR 16636 (elaboração e desenvolvimento de serviços técnicos especializados de projetos arquitetônicos e urbanísticos)\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é o papel dos \"planos de massas\" no processo de projeto?",
    "options": [
      "Distribuir espacialmente, sem escala ou definição, o estudo que o arquiteto está realizando sobre um projeto",
      "Apresentar o orçamento final da obra ao cliente",
      "Substituir totalmente a necessidade de desenhos técnicos finais",
      "Definir exclusivamente a paleta de cores da fachada"
    ],
    "correct_answer": "Distribuir espacialmente, sem escala ou definição, o estudo que o arquiteto está realizando sobre um projeto",
    "explanation": "O texto afirma que \"os planos de massas têm o papel de distribuir espacialmente, sem escala ou definição, o estudo que o arquiteto está realizando sobre um projeto\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que significa a escala 1:25 em um desenho técnico?",
    "options": [
      "O desenho está representado vinte e cinco vezes menor que a dimensão real do objeto",
      "O desenho está representado vinte e cinco vezes maior que a dimensão real do objeto",
      "O desenho tem exatamente 25 cm de largura",
      "O desenho utiliza 25 camadas de sobreposição gráfica"
    ],
    "correct_answer": "O desenho está representado vinte e cinco vezes menor que a dimensão real do objeto",
    "explanation": "O texto afirma que \"a escala 1:25 significa que o desenho está representado vinte e cinco vezes menor que a dimensão real do objeto\"."
  },
  {
    "page": 13,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual escala é comumente utilizada para mostrar um sistema de encaixe entre peças de marcenaria, representando o desenho duas vezes maior que a dimensão real do objeto?",
    "options": [
      "2:1",
      "1:2",
      "1:25",
      "1:50"
    ],
    "correct_answer": "2:1",
    "explanation": "O texto afirma que \"a escala 2:1 apresenta um desenho representado duas vezes maior que a dimensão real do objeto – escala comumente utilizada para mostrar um sistema de encaixe entre peças de marcenaria\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2017), citado no texto, quais três tipos distintos de sistemas de desenho evoluíram para representar formas, construções e espaços tridimensionais em duas dimensões?",
    "options": [
      "Desenhos de vistas múltiplas, de linhas paralelas e em perspectivas cônicas",
      "Desenho artístico, desenho técnico e desenho digital",
      "Planta, corte e fachada",
      "Croqui, anteprojeto e projeto executivo"
    ],
    "correct_answer": "Desenhos de vistas múltiplas, de linhas paralelas e em perspectivas cônicas",
    "explanation": "O texto cita Ching (2017, p. 29): \"três tipos distintos de sistemas de desenho evoluíram ao longo do tempo para cumprir essa missão: desenhos de vistas múltiplas, de linhas paralelas e em perspectivas cônicas\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u1_p2 = [
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que define a norma NBR 6492 no contexto da representação gráfica em arquitetura?",
    "options": [
      "Todos os parâmetros para a representação em arquitetura em todo o território nacional, garantindo padronização dos projetos",
      "Exclusivamente as normas de segurança do trabalho em canteiros de obras",
      "Apenas os requisitos de acessibilidade para edificações públicas",
      "Somente os critérios de desempenho térmico das edificações"
    ],
    "correct_answer": "Todos os parâmetros para a representação em arquitetura em todo o território nacional, garantindo padronização dos projetos",
    "explanation": "O texto afirma que a NBR 6492 \"define todos os parâmetros para a representação em arquitetura em todo o território nacional, garantindo assim uma padronização dos projetos executados no Brasil\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as três formas básicas em que o desenho pode ser utilizado pelo arquiteto?",
    "options": [
      "Desenho de observação, desenho de concepção e desenho de comunicação",
      "Desenho manual, desenho digital e desenho misto",
      "Planta, corte e elevação",
      "Croqui, maquete e renderização"
    ],
    "correct_answer": "Desenho de observação, desenho de concepção e desenho de comunicação",
    "explanation": "O texto afirma que \"o desenho para o arquiteto pode ser utilizado basicamente de três formas: desenho de observação, desenho de concepção e desenho de comunicação\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza os \"desenhos de concepção\", também chamados de croquis?",
    "options": [
      "São os mais livres, variam de acordo com a prática pessoal e têm como função principal o desenvolvimento de uma ideia",
      "Devem seguir rigorosamente as normas técnicas da ABNT desde o primeiro traço",
      "Substituem totalmente a necessidade de um projeto executivo",
      "São elaborados exclusivamente com auxílio de programas de CAD"
    ],
    "correct_answer": "São os mais livres, variam de acordo com a prática pessoal e têm como função principal o desenvolvimento de uma ideia",
    "explanation": "O texto afirma que \"os desenhos de concepção são os mais livres, pois vão variar de acordo com a sua prática pessoal... têm como função principal o desenvolvimento de uma ideia\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quando se trata de desenhos de comunicação, quais representações são comumente realizadas?",
    "options": [
      "Projeções ortogonais e perspectivas isométricas",
      "Exclusivamente croquis à mão livre sem qualquer rigor técnico",
      "Apenas fotografias do terreno a ser construído",
      "Somente maquetes físicas em escala reduzida"
    ],
    "correct_answer": "Projeções ortogonais e perspectivas isométricas",
    "explanation": "O texto afirma que \"quando tratamos de desenhos de comunicação, é comum realizarmos representações por meio de projeções ortogonais e perspectivas isométricas\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que são \"desenhos de orientação construtiva\"?",
    "options": [
      "Desenhos que visam à execução de algo, obedecendo a um rigor dimensional e contando com informações textuais",
      "Desenhos artísticos destinados exclusivamente à apresentação ao cliente",
      "Desenhos preliminares sem qualquer compromisso com a proporção",
      "Desenhos usados apenas para registro histórico da obra"
    ],
    "correct_answer": "Desenhos que visam à execução de algo, obedecendo a um rigor dimensional e contando com informações textuais",
    "explanation": "O texto afirma que \"desenhos de orientação construtiva devem obedecer a um rigor dimensional e contar com informações textuais para que sejam possíveis de serem executados\"."
  },
  {
    "page": 43,
    "difficulty": "hard",
    "prompt": "Segundo Jan Gehl (2013), citado no texto, o que ele chama de \"síndrome de Brasília\"?",
    "options": [
      "O planejamento das cidades visto somente de cima, ignorando a escala do pedestre e do usuário",
      "A falta de áreas verdes em capitais planejadas do país",
      "O excesso de tráfego de veículos em centros urbanos antigos",
      "A ausência de patrimônio histórico em cidades modernistas"
    ],
    "correct_answer": "O planejamento das cidades visto somente de cima, ignorando a escala do pedestre e do usuário",
    "explanation": "O texto afirma que Jan Gehl \"critica o planejamento das cidades vistas somente de cima e ignorando a escala do pedestre e do usuário. Ele chama isso de 'síndrome de Brasília'\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo Jane Jacobs, citada no texto, em seu livro Morte e vida das grandes cidades, o que ela analisou sobre as cidades modernistas?",
    "options": [
      "Como a tomada dos automóveis do espaço público e a ideologia urbana do modernismo colocavam em risco a vida urbana das cidades",
      "Exclusivamente os problemas de habitação popular nas periferias",
      "Apenas a falta de saneamento básico nas cidades brasileiras",
      "Somente o crescimento populacional acelerado do século XX"
    ],
    "correct_answer": "Como a tomada dos automóveis do espaço público e a ideologia urbana do modernismo colocavam em risco a vida urbana das cidades",
    "explanation": "O texto afirma que Jane Jacobs \"analisou como a tomada dos automóveis do espaço público e a ideologia urbana do modernismo estavam colocando em risco a vida urbana das cidades\"."
  },
  {
    "page": 45,
    "difficulty": "hard",
    "prompt": "Segundo o texto, o que Euclides criou, em 300 a.C., ao tentar estudar a proporção perfeita?",
    "options": [
      "A Seção Áurea",
      "O Modulor",
      "As Ordens Clássicas",
      "A Antropometria"
    ],
    "correct_answer": "A Seção Áurea",
    "explanation": "O texto afirma que \"Euclides, em 300 a.C., criou a Seção Áurea em uma tentativa de estudar o que seria a proporção perfeita\"."
  },
  {
    "page": 46,
    "difficulty": "medium",
    "prompt": "Segundo Panero e Zellik (2002), citados no texto, como Vitrúvio relacionou o corpo humano a proporções?",
    "options": [
      "\"o comprimento do pé é 1/6 da altura do corpo; o antebraço, ¼, e a altura do peito, também ¼\"",
      "O corpo humano não tem qualquer relação proporcional válida, segundo Vitrúvio",
      "A altura total do corpo é sempre igual à largura dos ombros",
      "A cabeça corresponde a 1/2 da altura total do corpo"
    ],
    "correct_answer": "\"o comprimento do pé é 1/6 da altura do corpo; o antebraço, ¼, e a altura do peito, também ¼\"",
    "explanation": "O texto cita literalmente essa relação de Vitrúvio, segundo Panero e Zellik (2002)."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quem criou o desenho do homem a partir do estudo de Vitrúvio, durante a Renascença?",
    "options": [
      "Leonardo Da Vinci",
      "Le Corbusier",
      "Francis D. K. Ching",
      "Cenino Cenine"
    ],
    "correct_answer": "Leonardo Da Vinci",
    "explanation": "O texto afirma que \"Leonardo Da Vinci, durante a Renascença, criou o desenho do homem a partir do estudo de Vitrúvio\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u1_p3 = [
  {
    "page": 48,
    "difficulty": "medium",
    "prompt": "Segundo o texto, no século XX, o que Le Corbusier criou como sistema de proporções baseado no homem?",
    "options": [
      "O Modulor",
      "A Seção Áurea",
      "O Ken",
      "As Ordens Clássicas"
    ],
    "correct_answer": "O Modulor",
    "explanation": "O texto afirma que \"no século XX, Le Corbusier faz o Modulor, seguindo os princípios modernistas da funcionalidade\"."
  },
  {
    "page": 49,
    "difficulty": "hard",
    "prompt": "Segundo o texto, na relação matemática de proporção, se um edifício tem uma altura x e uma largura 3x, qual é a relação entre altura e largura?",
    "options": [
      "1/3",
      "3/1",
      "1/1",
      "3/3"
    ],
    "correct_answer": "1/3",
    "explanation": "O texto afirma: \"se um edifício tem uma altura x e uma largura 3x, pode-se dizer que a relação entre a altura e a largura é de 1/3\"."
  },
  {
    "page": 49,
    "difficulty": "hard",
    "prompt": "Segundo Jan Gehl (2013), citado no texto, quais são as três escalas possíveis de atuação na cidade?",
    "options": [
      "Grande escala, escala média e escala pequena (da paisagem humana)",
      "Escala urbana, escala rural e escala mista",
      "Escala 1:100, escala 1:500 e escala 1:1000",
      "Escala pública, escala privada e escala institucional"
    ],
    "correct_answer": "Grande escala, escala média e escala pequena (da paisagem humana)",
    "explanation": "O texto descreve as três escalas de Jan Gehl (2013): a grande escala (tratamento holístico da cidade), a escala média (do desenvolvimento/bairros) e a escala pequena (da paisagem humana, ao nível dos olhos)."
  },
  {
    "page": 59,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual é o formato de papel que serve de base para os demais formatos da série \"A\" utilizados em desenho técnico?",
    "options": [
      "A0",
      "A4",
      "A3",
      "A1"
    ],
    "correct_answer": "A0",
    "explanation": "O texto afirma que \"os formatos da série 'A' têm como base o formato A0... que corresponde a um retângulo de área igual a 1 m²\"."
  },
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as dimensões do formato A4, usado como padrão mínimo para pranchas de desenho técnico?",
    "options": [
      "210 x 297 mm",
      "297 x 420 mm",
      "420 x 594 mm",
      "594 x 841 mm"
    ],
    "correct_answer": "210 x 297 mm",
    "explanation": "O texto lista os formatos da série A, incluindo \"A4: 210 x 297 mm\"."
  },
  {
    "page": 63,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que estabelece a norma NBR 8403/2021, citada no material?",
    "options": [
      "Tipos e o escalonamento de larguras de linhas para uso em desenhos técnicos",
      "Os requisitos de acessibilidade em edificações públicas",
      "Os parâmetros de desempenho térmico de edificações",
      "Os critérios de dimensionamento de escadas e rampas"
    ],
    "correct_answer": "Tipos e o escalonamento de larguras de linhas para uso em desenhos técnicos",
    "explanation": "O texto afirma que a NBR 8403/2021 \"fixa tipos e o escalonamento de larguras de linhas para uso em desenhos técnicos e documentos semelhantes\"."
  },
  {
    "page": 67,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que servem os \"gabaritos\" no desenho técnico manual?",
    "options": [
      "São peças de acrílico com elementos vazados que permitem a reprodução de figuras geométricas e símbolos, como aparelhos sanitários, em várias escalas",
      "Servem exclusivamente para medir ângulos com precisão",
      "São usados apenas para apagar traços indesejados do papel",
      "Servem para fixar o papel na mesa de desenho"
    ],
    "correct_answer": "São peças de acrílico com elementos vazados que permitem a reprodução de figuras geométricas e símbolos, como aparelhos sanitários, em várias escalas",
    "explanation": "O texto afirma que \"gabaritos: são peças de acrílico com elementos vazados, os quais permitem a reprodução desses nos desenhos... assim como símbolos para aparelhos sanitários e acessórios em várias escalas\"."
  },
  {
    "page": 69,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021a), citada no texto, qual é a altura recomendada para o título de prancha, em milímetros?",
    "options": [
      "7 mm",
      "3,5 mm",
      "2,5 mm",
      "14 mm"
    ],
    "correct_answer": "7 mm",
    "explanation": "O texto lista \"Título de prancha: 7 (mm) – 28 (pt)\" como tamanho correto para essa aplicação, segundo a NBR 6492."
  },
  {
    "page": 85,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza a \"régua paralela\", um dos instrumentos de desenho técnico manual?",
    "options": [
      "É equipada com um sistema de cabos e roldanas que permite que a régua se desloque ao longo da mesa de forma paralela, possibilitando desenhar com maior velocidade e precisão",
      "É uma régua portátil usada exclusivamente para medir ângulos",
      "É um instrumento usado somente para criar circunferências e arcos",
      "É uma peça de acrílico com elementos vazados para reprodução de símbolos"
    ],
    "correct_answer": "É equipada com um sistema de cabos e roldanas que permite que a régua se desloque ao longo da mesa de forma paralela, possibilitando desenhar com maior velocidade e precisão",
    "explanation": "O texto define: \"régua paralela: equipada com um sistema de cabos e roldanas que permitem que a régua se desloque ao longo da mesa de forma paralela. Possibilita desenhar com maior velocidade e precisão\"."
  },
  {
    "page": 88,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o \"escalímetro\"?",
    "options": [
      "Para realizar marcações e medições, contemplando seis escalas diferentes em seu formato triangular",
      "Para traçar curvas de raio variável em um desenho",
      "Para medir ângulos em um desenho técnico",
      "Para apagar traços indesejados no papel"
    ],
    "correct_answer": "Para realizar marcações e medições, contemplando seis escalas diferentes em seu formato triangular",
    "explanation": "O texto descreve o escalímetro como \"utilizado para realizar marcações e medições... contempla seis escalas diferentes em seu formato triangular\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u1_p4 = [
  {
    "page": 90,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais graduações de grafite são recomendadas para desenhos técnicos, por garantirem um traço mais preciso?",
    "options": [
      "Grafites mais duros (4H a 9H)",
      "Grafites mais macios (2B a 8B)",
      "Grafites de consistência média (F e HB)",
      "Qualquer graduação, pois não há recomendação específica"
    ],
    "correct_answer": "Grafites mais duros (4H a 9H)",
    "explanation": "O texto afirma que \"para os desenhos técnicos é mais comum o uso de grafites mais duros (4H a 9H) para o traço ser mais preciso\"."
  },
  {
    "page": 96,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual norma técnica é considerada imprescindível para a elaboração dos desenhos de arquitetura, tratando de planta, corte, fachada, detalhes e fases do projeto?",
    "options": [
      "NBR 6492:2021",
      "NBR 8403:2021",
      "NBR 16752:2020",
      "NBR 17068:2022"
    ],
    "correct_answer": "NBR 6492:2021",
    "explanation": "O texto afirma que a \"NBR 6492:2021... é uma norma imprescindível para a elaboração dos desenhos de arquitetura pois trata de assuntos essenciais para as representações de peças básicas como planta, corte, fachada (elevações), detalhes, etc.\"."
  },
  {
    "page": 99,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021a), citada no texto, o que a norma determina sobre o formato das folhas de desenho e seu dobramento?",
    "options": [
      "As folhas devem seguir a série A (de A0 a A4) e ser dobradas para sempre resultarem no formato A4, facilitando manuseio e arquivamento",
      "As folhas podem ter qualquer tamanho, desde que legíveis pelo leitor",
      "Apenas o formato A1 é aceito para desenhos de arquitetura",
      "O dobramento das pranchas é opcional e não previsto em norma"
    ],
    "correct_answer": "As folhas devem seguir a série A (de A0 a A4) e ser dobradas para sempre resultarem no formato A4, facilitando manuseio e arquivamento",
    "explanation": "O texto afirma que a norma \"determina que as folhas de papel devem seguir como padrão a série A, com formatos A0 (máximo) a A4 (mínimo), bem como a necessidade do dobramento das pranchas para sempre resultarem no formato A4\"."
  },
  {
    "page": 103,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são citadas como escalas usuais para desenhos técnicos de arquitetura?",
    "options": [
      "1:1, 1:2, 1:5, 1:10, 1:20, 1:25, 1:50, 1:100, 1:200, 1:250, 1:500, 1:1000 e 1:2000",
      "Apenas 1:50 e 1:100",
      "Exclusivamente escalas múltiplas de 10",
      "Somente 1:1 (tamanho real)"
    ],
    "correct_answer": "1:1, 1:2, 1:5, 1:10, 1:20, 1:25, 1:50, 1:100, 1:200, 1:250, 1:500, 1:1000 e 1:2000",
    "explanation": "O texto lista exatamente essas escalas como \"as escalas usuais\" para desenho técnico arquitetônico."
  }
];

// ---------------------------------------------------------------------------
// track_s02_desenho_arquitetura_urbanismo — Unidade 2 — Representação de Plantas (31 perguntas, fonte: q_desenho_arquitetura_urbanismo_u2.json)
// ---------------------------------------------------------------------------
const q_lesson_desenho_arquitetura_urbanismo_u2_p1 = [
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, em quais dois grupos se dividem os elementos básicos de um projeto arquitetônico?",
    "options": [
      "Peças gráficas e peças escritas",
      "Peças estruturais e peças decorativas",
      "Peças aprovadas e peças em análise",
      "Peças manuais e peças digitais"
    ],
    "correct_answer": "Peças gráficas e peças escritas",
    "explanation": "O texto afirma que \"os elementos básicos do projeto, segundo a NBR 6492 (ABNT, 2021), dividem-se em peças gráficas e peças escritas\"."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos compõem as \"peças escritas\" de um projeto arquitetônico, segundo a NBR 6492?",
    "options": [
      "Programa de necessidades, memorial justificativo, discriminação técnica, especificações, lista de materiais e orçamento",
      "Exclusivamente as plantas e cortes do projeto",
      "Apenas fotos do terreno antes da obra",
      "Somente o contrato assinado com o cliente"
    ],
    "correct_answer": "Programa de necessidades, memorial justificativo, discriminação técnica, especificações, lista de materiais e orçamento",
    "explanation": "O texto afirma que \"as peças escritas referem-se ao programa de necessidades, memorial justificativo, discriminação técnica, especificações, lista de materiais e orçamento\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definida \"planta\"?",
    "options": [
      "\"vista superior em projeção ortogonal da edificação ou outro objeto, em uma determinada altura\"",
      "\"vista frontal de uma edificação, representando sua fachada principal\"",
      "\"corte vertical que atravessa toda a edificação\"",
      "\"representação tridimensional em perspectiva cônica de um projeto\""
    ],
    "correct_answer": "\"vista superior em projeção ortogonal da edificação ou outro objeto, em uma determinada altura\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 2)."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, entre qual faixa de altura é comumente posicionado o plano secante horizontal que define a planta de pavimento?",
    "options": [
      "Entre 1,20m e 1,50m do piso de referência",
      "Entre 0,30m e 0,50m do piso de referência",
      "Entre 2,50m e 3,00m do piso de referência",
      "Sempre exatamente a 1,00m do piso de referência"
    ],
    "correct_answer": "Entre 1,20m e 1,50m do piso de referência",
    "explanation": "O texto afirma que a altura do plano secante \"é comumente utilizada entre 1,20m e 1,50m do piso de referência\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a escala usual para o desenho de uma planta baixa, podendo variar conforme as dimensões da edificação?",
    "options": [
      "1:50 (podendo ser 1:75 ou 1:100)",
      "1:500",
      "1:5",
      "1:1"
    ],
    "correct_answer": "1:50 (podendo ser 1:75 ou 1:100)",
    "explanation": "O texto afirma que \"a escala usual para o desenho de uma planta é de 1:50, entretanto, dependendo das dimensões da edificação, pode-se utilizar 1:75 ou 1:100\" (Xavier, 2021)."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Xavier (2021), citado no texto, por que se deve ter cuidado ao empregar hachuras sólidas na representação de paredes?",
    "options": [
      "Porque podem apresentar um peso visual excessivo dentro do contexto gráfico, comprometendo a leitura do projeto",
      "Porque são proibidas pela NBR 6492 em qualquer situação",
      "Porque encarecem o custo de impressão do projeto",
      "Porque não são compatíveis com programas de CAD"
    ],
    "correct_answer": "Porque podem apresentar um peso visual excessivo dentro do contexto gráfico, comprometendo a leitura do projeto",
    "explanation": "O texto afirma que \"Xavier (2021) ressalta que se deve ter cuidado ao empregar hachuras sólidas, pois, em algumas situações, podem vir a apresentar um peso visual excessivo dentro do contexto gráfico, comprometendo a leitura do projeto\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em projetos de reforma e/ou ampliação, quais cores são convencionadas pelos códigos de obras municipais para diferenciar paredes novas de paredes a demolir?",
    "options": [
      "Hachura vermelha para construção de novas paredes e amarela para demolição de paredes existentes",
      "Hachura azul para novas paredes e verde para demolição",
      "Hachura preta para todas as paredes, sem distinção de cor",
      "Hachura cinza para novas paredes e vermelha para demolição"
    ],
    "correct_answer": "Hachura vermelha para construção de novas paredes e amarela para demolição de paredes existentes",
    "explanation": "O texto afirma que os códigos de obras municipais estabelecem \"hachura vermelha para construção de novas paredes e amarela para demolição de paredes existentes\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo Corrêa (2019), citado no texto, como devem ser indicados os degraus e patamares de uma escada em planta, até 1,50m de altura?",
    "options": [
      "Em linha larga",
      "Em linha tracejada estreita",
      "Em linha extralarga pontilhada",
      "Sem qualquer indicação gráfica"
    ],
    "correct_answer": "Em linha larga",
    "explanation": "O texto afirma que uma escada tem \"representados em planta seus degraus e patamares até 1,50m de altura em linha larga\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, qual nomenclatura deve ser usada para identificar portas e janelas em um projeto?",
    "options": [
      "P1, P2, P3... para portas e J1, J2, J3... para janelas",
      "Somente números sequenciais, sem letras",
      "D1, D2, D3... para todas as aberturas, sem distinção",
      "Nomes descritivos livres, sem padronização"
    ],
    "correct_answer": "P1, P2, P3... para portas e J1, J2, J3... para janelas",
    "explanation": "O texto afirma que, segundo a NBR 6492, os detalhes das esquadrias \"devem atender à nomenclatura P1, P2, P3 e assim por diante para portas, e J1, J2, J3, para janelas\"."
  },
  {
    "page": 12,
    "difficulty": "hard",
    "prompt": "Segundo Corrêa (2019), citado no texto, como é representada a porta em plantas de escalas menores ou iguais a 1:50?",
    "options": [
      "Por um retângulo de linhas contínuas estreitas, com a menor dimensão igual a 3cm",
      "Por um círculo tracejado indicando o raio de abertura",
      "Por uma linha única sem espessura definida",
      "Por um retângulo de linhas contínuas largas, exclusivamente"
    ],
    "correct_answer": "Por um retângulo de linhas contínuas estreitas, com a menor dimensão igual a 3cm",
    "explanation": "O texto afirma que \"a porta pode ser representada por um retângulo de linhas contínuas estreitas para escalas menores ou iguais a 1:50, sendo a menor das dimensões igual a 3cm\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u2_p2 = [
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos de construção situados acima do plano de corte, ou com arestas não visíveis, devem ser representados em planta?",
    "options": [
      "Beirais das coberturas, vãos de aberturas e esquadrias, vigas, chaminés, alçapões, mezaninos e caixa-d'água, em linhas tracejadas estreitas",
      "Exclusivamente o mobiliário do ambiente",
      "Apenas elementos estruturais visíveis, nunca elementos ocultos",
      "Somente tubulações hidráulicas enterradas"
    ],
    "correct_answer": "Beirais das coberturas, vãos de aberturas e esquadrias, vigas, chaminés, alçapões, mezaninos e caixa-d'água, em linhas tracejadas estreitas",
    "explanation": "O texto lista exatamente esses elementos como \"acima do plano de corte ou com arestas e contornos não visíveis\", representados \"através de linhas tracejadas estreitas\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que compõe os \"elementos informativos\" de uma planta, diferentemente dos elementos construtivos?",
    "options": [
      "Nomes dos ambientes, áreas úteis, níveis ou posições dos planos de corte vertical, dimensões das aberturas e cotas",
      "Exclusivamente o mobiliário representado no desenho",
      "Apenas a paleta de cores utilizada no desenho",
      "Somente o logotipo do escritório de arquitetura"
    ],
    "correct_answer": "Nomes dos ambientes, áreas úteis, níveis ou posições dos planos de corte vertical, dimensões das aberturas e cotas",
    "explanation": "O texto afirma que \"os elementos informativos referem-se aos nomes dos ambientes, áreas úteis, níveis ou posições dos planos de corte vertical, dimensões das aberturas, cotas, dentre outras\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo Corrêa (2019), citado no texto, apesar de o chuveiro estar instalado em altura acima de 1,50m, como sua projeção é representada em planta?",
    "options": [
      "Em linha contínua larga, como os demais aparelhos",
      "Em linha tracejada estreita, por estar acima do plano de corte",
      "Não é representado em planta, apenas em corte",
      "Em linha pontilhada exclusiva para equipamentos hidráulicos"
    ],
    "correct_answer": "Em linha contínua larga, como os demais aparelhos",
    "explanation": "O texto afirma que \"apesar de o chuveiro estar em altura acima de 1,50m, sua projeção em planta é representada em linha contínua larga, tal como os outros aparelhos\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo Corrêa (2019), citado no texto, onde a representação de móveis, tapetes e outros objetos decorativos deve ser inserida, já que não aparece em plantas técnicas?",
    "options": [
      "Na planta humanizada, direcionada para apresentação ao cliente",
      "Exclusivamente na planta de situação",
      "Apenas no memorial descritivo do projeto",
      "Somente em desenhos de detalhe na escala 1:10"
    ],
    "correct_answer": "Na planta humanizada, direcionada para apresentação ao cliente",
    "explanation": "O texto afirma que \"a representação de móveis, tapetes e outros objetos decorativos não acontece em plantas técnicas, mas devem ser inseridas em planta humanizada, que é direcionada para apresentação ao cliente\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é o tamanho padrão para o nome de cada ambiente em uma planta, segundo Corrêa (2019) e Xavier (2021)?",
    "options": [
      "3,5 mm",
      "7 mm",
      "2,5 mm",
      "14 mm"
    ],
    "correct_answer": "3,5 mm",
    "explanation": "O texto afirma que \"cada ambiente da planta deve ter seu nome com tamanho de 3,5 mm\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, onde as linhas de chamada das cotas devem parar em relação ao ponto dimensionado?",
    "options": [
      "De 2 a 3 mm do ponto dimensionado",
      "Exatamente sobre o ponto dimensionado, sem distância",
      "A 10 mm do ponto dimensionado",
      "A distância é livre, sem padronização definida"
    ],
    "correct_answer": "De 2 a 3 mm do ponto dimensionado",
    "explanation": "O texto afirma que \"a NBR 6492 (ABNT, 2021) convenciona que as linhas de chamada... devem parar de 2 a 3 mm do ponto dimensionado\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo Xavier (2021), citado no texto, como as cotas de nível abaixo do nível de referência (nível zero) devem ser acompanhadas?",
    "options": [
      "Do sinal negativo",
      "Do sinal positivo, obrigatoriamente",
      "De um asterisco indicativo",
      "De parênteses coloridos"
    ],
    "correct_answer": "Do sinal negativo",
    "explanation": "O texto afirma que \"as cotas de nível... são acompanhadas do sinal negativo, caso se localizem abaixo do nível de referência (nível zero)\"."
  },
  {
    "page": 20,
    "difficulty": "easy",
    "prompt": "Segundo o texto, por convenção, como a planta deve ser orientada em relação ao norte?",
    "options": [
      "Com o norte para cima, na parte superior do desenho",
      "Com o norte sempre para a esquerda do desenho",
      "A orientação do norte é irrelevante para plantas arquitetônicas",
      "Com o norte para baixo, na parte inferior do desenho"
    ],
    "correct_answer": "Com o norte para cima, na parte superior do desenho",
    "explanation": "O texto afirma que \"por convenção, orienta-se a planta com o norte para cima na parte superior do desenho (Ching, 2011)\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definida a planta de implantação?",
    "options": [
      "\"planta que compreende a localização e as dimensões da edificação... indicando, em escala compatível, as dimensões do terreno, recuos, projeção da(s) cobertura(s) e áreas permeáveis e impermeáveis\"",
      "\"planta que representa exclusivamente a fachada frontal da edificação\"",
      "\"corte transversal que evidencia a estrutura do telhado\"",
      "\"representação tridimensional isométrica do entorno urbano\""
    ],
    "correct_answer": "\"planta que compreende a localização e as dimensões da edificação... indicando, em escala compatível, as dimensões do terreno, recuos, projeção da(s) cobertura(s) e áreas permeáveis e impermeáveis\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 3)."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto, de quantas maneiras diferentes a implantação de um projeto pode ser realizada?",
    "options": [
      "Três (planta de cobertura com terreno, planta baixa com entorno, ou simplificação da área construída)",
      "Apenas uma forma padronizada, sem variações",
      "Cinco formas distintas, sem exceção",
      "Duas formas, dependendo apenas da escala"
    ],
    "correct_answer": "Três (planta de cobertura com terreno, planta baixa com entorno, ou simplificação da área construída)",
    "explanation": "O texto afirma que \"a implantação pode ser realizada de três maneiras diferentes\", detalhando cada uma em seguida."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u2_p3 = [
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para representar acessos e áreas permeáveis em uma planta de implantação simplificada, o que deve ser feito?",
    "options": [
      "Utilizar hachuras com padrões diferentes para cada tipo de piso e criar uma legenda ao lado da implantação",
      "Deixar as áreas completamente em branco, sem qualquer indicação",
      "Usar exclusivamente a cor vermelha para todas as superfícies",
      "Representar apenas com texto descritivo, sem elementos gráficos"
    ],
    "correct_answer": "Utilizar hachuras com padrões diferentes para cada tipo de piso e criar uma legenda ao lado da implantação",
    "explanation": "O texto recomenda \"utilizar hachuras com padrões diferentes para cada tipo de piso e após concluído o desenho, realizar uma legenda com os tipos de hachura ao lado da implantação\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo o texto, onde podem ser encontrados os valores dos recuos de um município, usados na planta de implantação?",
    "options": [
      "Na Lei de Uso e Ocupação do Solo (LUOS) ou no Código de Obras e Edificações (COE) do município",
      "Exclusivamente no Estatuto da Cidade federal",
      "Apenas em contrato particular entre vizinhos",
      "Somente em normas internacionais de urbanismo"
    ],
    "correct_answer": "Na Lei de Uso e Ocupação do Solo (LUOS) ou no Código de Obras e Edificações (COE) do município",
    "explanation": "O texto afirma que \"os valores dos recuos do seu município de atuação podem normalmente ser encontrados na Lei de Uso e Ocupação do Solo (LUOS) ou no Código de Obras e Edificações (COE) do município\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como se indica o ponto de visualização de um corte em uma planta de implantação?",
    "options": [
      "Por uma linha do tipo traço-ponto, com setas nas extremidades indicando a direção do observador",
      "Por um círculo vermelho ao redor da área cortada",
      "Por uma legenda textual sem qualquer elemento gráfico",
      "Por uma linha contínua extralarga sem indicação de direção"
    ],
    "correct_answer": "Por uma linha do tipo traço-ponto, com setas nas extremidades indicando a direção do observador",
    "explanation": "O texto afirma que, \"para indicar onde é o ponto de visualização de cada corte, utilizamos uma linha do tipo traço ponto... nas extremidades desta linha, utilizamos setas para indicar para qual direção o observador está olhando\"."
  },
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a escala usual para a planta de implantação de um terreno inserido na malha urbana?",
    "options": [
      "1:100 ou 1:200",
      "1:10 ou 1:20",
      "1:2000 ou 1:5000",
      "1:1 (tamanho real)"
    ],
    "correct_answer": "1:100 ou 1:200",
    "explanation": "O texto afirma que, \"por se tratar de um desenho em que é necessário representar todo o terreno, a escala adotada para esse tipo de desenho costuma ser menor, normalmente 1:100 ou 1:200\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2011), citado no texto, o que é uma curva de nível?",
    "options": [
      "Uma linha imaginária que une os pontos de mesma elevação",
      "Uma linha que representa o limite legal do terreno",
      "Um símbolo que indica a posição do Norte no desenho",
      "Uma linha que demarca exclusivamente a rede elétrica subterrânea"
    ],
    "correct_answer": "Uma linha imaginária que une os pontos de mesma elevação",
    "explanation": "O texto afirma que, segundo o autor, \"essa convenção gráfica é uma linha imaginária que une os pontos de mesma elevação\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo Xavier (2021), citado no texto, quais informações devem constar em uma planta de implantação, segundo a seção \"Vamos Exercitar\"?",
    "options": [
      "Cotas totais do terreno, cotas gerais da edificação, cotas angulares, cotas de posicionamento da construção e marcação de acessos, entre outras",
      "Exclusivamente a planta baixa humanizada com mobiliário",
      "Apenas o memorial descritivo do projeto",
      "Somente informações financeiras do empreendimento"
    ],
    "correct_answer": "Cotas totais do terreno, cotas gerais da edificação, cotas angulares, cotas de posicionamento da construção e marcação de acessos, entre outras",
    "explanation": "O texto lista exatamente essas informações como necessárias na planta de implantação, segundo Xavier (2021)."
  },
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo Xavier (2021), citado no texto, como o contorno do terreno e o contorno da edificação são representados na planta de implantação, segundo a hierarquia de linhas?",
    "options": [
      "O contorno do terreno em linha contínua larga e o contorno da edificação em linha contínua extralarga",
      "Ambos em linha tracejada estreita, sem qualquer distinção",
      "O contorno do terreno em linha extralarga e o da edificação em linha estreita",
      "Nenhum dos dois elementos é representado com linhas contínuas"
    ],
    "correct_answer": "O contorno do terreno em linha contínua larga e o contorno da edificação em linha contínua extralarga",
    "explanation": "O texto afirma que \"o contorno do terreno é representado com linha contínua larga e o contorno da edificação com linha contínua extralarga, visto ser o elemento principal da planta\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definida a planta de situação?",
    "options": [
      "\"a planta com a função de situar a área de intervenção no terreno em relação às áreas vizinhas ou aos terrenos vizinhos que compõem a(s) quadra(s) e ao(s) logradouro(s) que a limita(m)\"",
      "\"a planta que detalha exclusivamente o sistema estrutural da edificação\"",
      "\"a planta que representa os acabamentos internos de cada ambiente\"",
      "\"a planta que indica somente a posição das instalações elétricas\""
    ],
    "correct_answer": "\"a planta com a função de situar a área de intervenção no terreno em relação às áreas vizinhas ou aos terrenos vizinhos que compõem a(s) quadra(s) e ao(s) logradouro(s) que a limita(m)\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 3)."
  },
  {
    "page": 46,
    "difficulty": "hard",
    "prompt": "Segundo Cornetet e Pires (2016), citados no texto, qual é a principal diferença entre a planta de situação e a planta de implantação?",
    "options": [
      "A planta de situação loca o terreno e traz seus dados cadastrais, enquanto a de implantação contém informações planialtimétricas e de locação da edificação",
      "Ambas são idênticas e podem ser usadas de forma intercambiável",
      "A planta de situação é sempre tridimensional; a de implantação é sempre bidimensional",
      "A planta de implantação só existe em projetos rurais"
    ],
    "correct_answer": "A planta de situação loca o terreno e traz seus dados cadastrais, enquanto a de implantação contém informações planialtimétricas e de locação da edificação",
    "explanation": "O texto afirma que, segundo os autores, \"a primeira loca o terreno e traz seus dados cadastrais, enquanto a segunda contém informações planialtimétricas e de locação\"."
  },
  {
    "page": 49,
    "difficulty": "medium",
    "prompt": "Segundo Kubba (2014), citado no texto, o que é um \"mapa de loteamento\"?",
    "options": [
      "Um desenho em escala que apresenta uma área específica de parte de uma cidade ou distrito, com a finalidade de parcelamento de uma gleba em diversos lotes",
      "Um documento exclusivamente textual sem qualquer representação gráfica",
      "Um mapa que representa apenas a rede viária de uma cidade inteira",
      "Um documento usado somente para fins de recenseamento populacional"
    ],
    "correct_answer": "Um desenho em escala que apresenta uma área específica de parte de uma cidade ou distrito, com a finalidade de parcelamento de uma gleba em diversos lotes",
    "explanation": "O texto afirma que \"esse é desenhado em escala..., apresentando uma área específica de parte de uma cidade ou distrito, com a finalidade, por exemplo, do parcelamento de uma gleba em diversos lotes\" (Kubba, 2014)."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u2_p4 = [
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que deve conter, no mínimo, uma planta de situação?",
    "options": [
      "O lote com suas dimensões básicas, o número do lote, a quadra em que está inserido, a identificação das ruas que o circundam e a indicação do Norte",
      "Exclusivamente a planta humanizada com mobiliário",
      "Apenas o memorial descritivo da obra",
      "Somente as cotas internas dos ambientes"
    ],
    "correct_answer": "O lote com suas dimensões básicas, o número do lote, a quadra em que está inserido, a identificação das ruas que o circundam e a indicação do Norte",
    "explanation": "O texto afirma que \"a planta de situação deve conter, no mínimo, o lote, com suas dimensões básicas; o número do lote; a quadra em que o lote está inserido, devidamente identificada; a identificação das ruas que o circundam e a indicação do Norte\"."
  }
];

// ---------------------------------------------------------------------------
// track_s02_desenho_arquitetura_urbanismo — Unidade 3 — Representação de Cortes e Fachadas (48 perguntas, fonte: q_desenho_arquitetura_urbanismo_u3.json)
// ---------------------------------------------------------------------------
const q_lesson_desenho_arquitetura_urbanismo_u3_p1 = [
  {
    "page": 1,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual é o título da Unidade 3 do material de Desenho de Arquitetura e Urbanismo?",
    "options": [
      "Representação de Cortes e Fachadas",
      "Introdução ao Desenho de Arquitetura e Urbanismo",
      "Representação de Plantas",
      "Desenho Assistido por Computador"
    ],
    "correct_answer": "Representação de Cortes e Fachadas",
    "explanation": "O texto identifica \"Unidade 3 - Representação de Cortes e Fachadas\" como título desta unidade."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que diferencia as plantas dos cortes, em termos do plano de projeção que representam?",
    "options": [
      "As plantas apresentam soluções horizontais de um projeto, enquanto os cortes direcionam a compreensão vertical dos espaços construídos",
      "Ambas representam exclusivamente o plano horizontal, apenas em escalas diferentes",
      "Os cortes nunca se relacionam com as plantas de um mesmo projeto",
      "As plantas são sempre tridimensionais; os cortes, bidimensionais"
    ],
    "correct_answer": "As plantas apresentam soluções horizontais de um projeto, enquanto os cortes direcionam a compreensão vertical dos espaços construídos",
    "explanation": "O texto afirma que \"enquanto as plantas apresentam soluções horizontais de um projeto, os cortes direcionam a compreensão vertical dos espaços construídos\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definido o corte?",
    "options": [
      "\"representação gráfica realizada a partir de um plano secante vertical que divide o edifício ou outro objeto em duas partes, no sentido longitudinal ou no transversal\"",
      "\"vista superior em projeção ortogonal da edificação, em uma determinada altura\"",
      "\"representação tridimensional da fachada de um edifício\"",
      "\"desenho que localiza o terreno em relação aos lotes vizinhos\""
    ],
    "correct_answer": "\"representação gráfica realizada a partir de um plano secante vertical que divide o edifício ou outro objeto em duas partes, no sentido longitudinal ou no transversal\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 1)."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a diferença entre corte longitudinal e corte transversal?",
    "options": [
      "O corte longitudinal acompanha a maior dimensão do espaço edificado, enquanto o transversal se realiza no menor sentido do projeto",
      "Ambos são idênticos, apenas com nomes diferentes",
      "O corte longitudinal é sempre horizontal; o transversal, sempre vertical",
      "O corte transversal representa apenas fachadas externas"
    ],
    "correct_answer": "O corte longitudinal acompanha a maior dimensão do espaço edificado, enquanto o transversal se realiza no menor sentido do projeto",
    "explanation": "O texto afirma que \"o corte longitudinal acompanha a maior dimensão do espaço edificado, enquanto o corte transversal é aquele que se realiza no menor sentido do projeto\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2017), citado no texto, qual é o principal objetivo do corte como desenho técnico?",
    "options": [
      "Estudar e revelar a relação vital entre cheios e vazios em pisos, paredes e tetos de uma edificação, suas dimensões verticais e relações em espaços internos",
      "Apresentar exclusivamente a fachada externa do edifício",
      "Indicar somente a localização do terreno na cidade",
      "Detalhar unicamente o sistema elétrico da edificação"
    ],
    "correct_answer": "Estudar e revelar a relação vital entre cheios e vazios em pisos, paredes e tetos de uma edificação, suas dimensões verticais e relações em espaços internos",
    "explanation": "O texto cita Ching (2017, p. 69): o corte é \"o principal desenho para se estudar e revelar a relação vital entre cheios e vazios em pisos, paredes e tetos de uma edificação, suas dimensões verticais e relações em espaços internos\"."
  },
  {
    "page": 4,
    "difficulty": "hard",
    "prompt": "Segundo Ching (2017), citado no texto, por que, em teoria, o plano de corte pode ter qualquer orientação, mas geralmente é considerado vertical?",
    "options": [
      "Para podermos distinguir um corte de uma planta baixa, outro tipo de desenho que também envolve uma seção",
      "Porque a norma técnica proíbe cortes horizontais em qualquer situação",
      "Porque cortes horizontais não podem ser representados em papel",
      "Porque apenas cortes verticais recebem numeração na prancha"
    ],
    "correct_answer": "Para podermos distinguir um corte de uma planta baixa, outro tipo de desenho que também envolve uma seção",
    "explanation": "O texto cita Ching (2017, p. 69): \"para podermos distinguir um corte de uma planta baixa – outro tipo de desenho que envolve uma seção – geralmente consideramos que o corte de uma edificação é na vertical\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como a \"hierarquia de traços\" se aplica aos cortes, já que não há profundidade real no desenho?",
    "options": [
      "Objetos mais próximos do observador e/ou de maior peso devem ser representados com traços mais espessos, e objetos mais distantes e/ou mais leves, com traços mais finos",
      "Todos os objetos devem ser representados com a mesma espessura de linha, sem exceção",
      "Apenas objetos coloridos recebem traços diferenciados",
      "A espessura da linha depende exclusivamente do material representado, nunca da distância"
    ],
    "correct_answer": "Objetos mais próximos do observador e/ou de maior peso devem ser representados com traços mais espessos, e objetos mais distantes e/ou mais leves, com traços mais finos",
    "explanation": "O texto afirma que \"objetos mais próximos do observador e/ou de maior peso, devem ser representados com traços mais espessos, e objetos mais distantes e/ou mais leves, devem ser representados por traços mais finos\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, até onde os cortes devem sempre mostrar a verticalidade da edificação?",
    "options": [
      "Do chão, ou subsolo (quando houver), até o topo da cobertura",
      "Apenas até o primeiro pavimento, independentemente da altura do edifício",
      "Somente até a altura do pé-direito do térreo",
      "Exclusivamente da fundação até a laje do primeiro pavimento"
    ],
    "correct_answer": "Do chão, ou subsolo (quando houver), até o topo da cobertura",
    "explanation": "O texto afirma que \"os cortes devem sempre mostrar a verticalidade da edificação em sua totalidade, ou seja, do chão, ou subsolo (quando houver) até o topo da cobertura\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (2017), citado no texto, quando deve ocorrer o desenvolvimento dos cortes em relação à planta?",
    "options": [
      "Em seguida à planta, como segundo elemento projetual",
      "Antes da planta, como primeiro elemento projetual",
      "Somente após a conclusão total da obra",
      "Junto com a aprovação do projeto na prefeitura, nunca antes"
    ],
    "correct_answer": "Em seguida à planta, como segundo elemento projetual",
    "explanation": "O texto afirma que, segundo Montenegro (2017), \"o desenvolvimento dos cortes deve ocorrer em seguida à planta, como segundo elemento projetual\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as escalas comumente utilizadas para a representação de um corte?",
    "options": [
      "1:50 ou 1:100 (podendo ser 1:200 ou 1:500 em edificações grandes, e 1:25 para detalhes)",
      "Exclusivamente 1:1000, sem outras opções",
      "Apenas 1:5 e 1:10",
      "Somente a escala 1:1 (tamanho real)"
    ],
    "correct_answer": "1:50 ou 1:100 (podendo ser 1:200 ou 1:500 em edificações grandes, e 1:25 para detalhes)",
    "explanation": "O texto afirma que a escala de corte é \"comumente apresentada nas escalas 1:50 ou 1:100... pode ser menor, como 1:200 ou 1:500... constroem-se cortes em escalas 1:25, pelo menos\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u3_p2 = [
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo Kubba (2014), citado no texto, o que caracteriza as linhas de corte?",
    "options": [
      "Indicam a superfície seccionada em uma vista de corte e geralmente têm pouca espessura, sendo mais finas do que as linhas de objeto",
      "São sempre as linhas mais espessas de todo o desenho técnico",
      "Representam exclusivamente elementos elétricos",
      "São usadas apenas em plantas, nunca em cortes"
    ],
    "correct_answer": "Indicam a superfície seccionada em uma vista de corte e geralmente têm pouca espessura, sendo mais finas do que as linhas de objeto",
    "explanation": "O texto cita Kubba (2014, p. 39): \"linhas de corte indicam a superfície seccionada em uma vista de corte. Elas geralmente têm pouca espessura (são mais finas do que as linhas de objeto)\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é representada a linha de corte na planta do pavimento?",
    "options": [
      "Por uma linha traço-ponto extralarga",
      "Por uma linha contínua estreita colorida",
      "Por um círculo pontilhado ao redor da área",
      "Por uma linha ondulada de espessura variável"
    ],
    "correct_answer": "Por uma linha traço-ponto extralarga",
    "explanation": "O texto afirma que \"a linha de corte é representada na planta do pavimento através de uma linha traço-ponto extralarga\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2017), citado no texto, o que caracteriza a \"hierarquia de pesos e linhas\" em um corte?",
    "options": [
      "Elementos cortados pela linha de corte apresentam linhas mais fortes, e os que estão apenas em vista são representados com peso menor ou intermediário",
      "Todos os elementos, cortados ou não, devem ter o mesmo peso de linha",
      "Apenas elementos estruturais recebem linhas fortes, independentemente de estarem cortados",
      "A hierarquia de linhas se aplica somente a desenhos coloridos"
    ],
    "correct_answer": "Elementos cortados pela linha de corte apresentam linhas mais fortes, e os que estão apenas em vista são representados com peso menor ou intermediário",
    "explanation": "O texto afirma que, na \"hierarquia de pesos e linhas\", \"os elementos cortados apresentam linhas mais fortes e os que estão em vista são representados com peso menor ou intermediário\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais elementos comumente têm suas cotas verticais representadas em um corte?",
    "options": [
      "Altura de portas, paredes, janelas, peitoris, pé-direito e alturas totais da edificação",
      "Exclusivamente a largura das paredes internas",
      "Apenas a área construída total em metros quadrados",
      "Somente a localização das tomadas elétricas"
    ],
    "correct_answer": "Altura de portas, paredes, janelas, peitoris, pé-direito e alturas totais da edificação",
    "explanation": "O texto afirma que \"em geral, representam-se as cotas de altura de portas, paredes, janelas, peitoris, pé-direito, alturas totais da edificação, etc.\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, nos cortes, diferentemente da planta, como as portas e janelas são representadas?",
    "options": [
      "Fechadas, e não mais abertas como na planta",
      "Sempre abertas, para mostrar o sentido de abertura",
      "Nunca são representadas em cortes",
      "Apenas com uma indicação textual, sem desenho gráfico"
    ],
    "correct_answer": "Fechadas, e não mais abertas como na planta",
    "explanation": "O texto afirma que, nos cortes, \"as portas e as janelas não são mais representadas abertas, e sim fechadas\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é desejável em relação à posição do plano de corte ao atravessar caixilhos (esquadrias)?",
    "options": [
      "Que o plano de corte \"passe\" no meio dos caixilhos, para melhor compreensão das aberturas e sua relação com os elementos estruturais",
      "Que o plano de corte nunca atravesse qualquer esquadria",
      "Que as esquadrias sejam sempre representadas fora da área de corte",
      "Que o plano de corte atravesse apenas o canto superior da esquadria"
    ],
    "correct_answer": "Que o plano de corte \"passe\" no meio dos caixilhos, para melhor compreensão das aberturas e sua relação com os elementos estruturais",
    "explanation": "O texto afirma que \"é desejável que o plano de corte do projeto 'passe' no meio dos caixilhos, justamente para melhor compreensão das aberturas do projeto e de como elas se relacionam com os elementos estruturais\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT (2021), citada no texto, o que é uma \"cota de nível\"?",
    "options": [
      "A \"indicação do nível altimétrico referenciado em peças gráficas de projetos arquitetônicos e urbanísticos\"",
      "A distância horizontal entre duas paredes de um ambiente",
      "O nome do ambiente representado na planta",
      "A escala geral de um desenho técnico"
    ],
    "correct_answer": "A \"indicação do nível altimétrico referenciado em peças gráficas de projetos arquitetônicos e urbanísticos\"",
    "explanation": "O texto cita literalmente essa definição da ABNT (2021, p. 2)."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as duas formas de indicar uma cota de nível em um corte?",
    "options": [
      "Nível Acabado (N.A.) e Em Osso (N.O.)",
      "Nível Superior (N.S.) e Nível Inferior (N.I.)",
      "Nível Externo (N.E.) e Nível Interno (N.I.)",
      "Nível Provisório (N.P.) e Nível Definitivo (N.D.)"
    ],
    "correct_answer": "Nível Acabado (N.A.) e Em Osso (N.O.)",
    "explanation": "O texto afirma que as cotas de nível \"podem ser indicadas em Nível Acabado (N.A.) ou Em Osso (N.O.)\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a diferença entre Nível Acabado (N.A.) e Nível em Osso (N.O.)?",
    "options": [
      "O Nível Acabado considera o revestimento em seu cálculo altimétrico, enquanto o Nível em Osso não considera a altura de revestimentos e/ou substratos",
      "São termos sinônimos, sem diferença técnica entre eles",
      "O Nível em Osso é usado exclusivamente em plantas, nunca em cortes",
      "O Nível Acabado se refere apenas a pavimentos térreos"
    ],
    "correct_answer": "O Nível Acabado considera o revestimento em seu cálculo altimétrico, enquanto o Nível em Osso não considera a altura de revestimentos e/ou substratos",
    "explanation": "O texto afirma que \"o Nível acabado considera o revestimento em seu cálculo altimétrico, enquanto o nível em osso não considera a altura de revestimentos e/ou substratos\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, o que caracteriza as linhas de chamada em um corte?",
    "options": [
      "São linhas com ângulos de 45º que trazem nomes de elementos representados no desenho",
      "São linhas sempre na horizontal, usadas exclusivamente para cotas",
      "São exclusivas para indicar a orientação do Norte",
      "Representam apenas elementos estruturais ocultos"
    ],
    "correct_answer": "São linhas com ângulos de 45º que trazem nomes de elementos representados no desenho",
    "explanation": "O texto afirma que \"as linhas de chamada, segundo a NBR 6492 (ABNT, 2021), são linhas com ângulos de 45º e que trazem nomes de elementos representados no desenho\"."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u3_p3 = [
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que consiste o desenho de \"cortes parciais\" de um projeto?",
    "options": [
      "A representação de apenas uma parte de um ambiente ou espaço interno, com sinalização clara do porquê e da localização",
      "Um corte que nunca pode ser usado em projetos executivos",
      "Um corte que substitui totalmente a necessidade de um corte completo",
      "Um corte usado exclusivamente para representar fundações"
    ],
    "correct_answer": "A representação de apenas uma parte de um ambiente ou espaço interno, com sinalização clara do porquê e da localização",
    "explanation": "O texto afirma que \"também é possível fazer cortes parciais de projeto, com a representação de apenas uma parte de um ambiente ou espaço interno... é fundamental que exista uma sinalização clara sobre isso\"."
  },
  {
    "page": 24,
    "difficulty": "hard",
    "prompt": "Segundo Ching (2012), citado no texto, o posicionamento da linha de corte deve ser revelador de quais questões que englobam o projeto?",
    "options": [
      "Mudanças de níveis, aberturas, coberturas, circulações verticais, áreas molhadas, alturas e qualquer outra situação especial",
      "Exclusivamente o valor de mercado do imóvel",
      "Apenas a orientação solar da fachada principal",
      "Somente a localização das instalações elétricas"
    ],
    "correct_answer": "Mudanças de níveis, aberturas, coberturas, circulações verticais, áreas molhadas, alturas e qualquer outra situação especial",
    "explanation": "O texto afirma que \"o posicionamento da linha de corte deve ser necessariamente revelador de todas as principais questões que englobam o projeto, sobretudo mudanças de níveis, aberturas, coberturas, circulações verticais, áreas molhadas, alturas e qualquer outra situação especial\" (Ching, 2012)."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021, p. 4), citada no texto, o que é permitido quando há necessidade de deslocamento do plano secante de um corte?",
    "options": [
      "Pode haver deslocamento do plano secante onde necessário, devendo ser assinalados de maneira precisa o seu início e o final",
      "O deslocamento do plano de corte é proibido pela norma em qualquer situação",
      "O deslocamento só é permitido em cortes transversais, nunca em longitudinais",
      "É necessário refazer toda a planta baixa quando há deslocamento do corte"
    ],
    "correct_answer": "Pode haver deslocamento do plano secante onde necessário, devendo ser assinalados de maneira precisa o seu início e o final",
    "explanation": "O texto cita a NBR 6492 (ABNT, 2021, p. 4): \"pode haver deslocamento do plano secante onde necessário, devendo ser assinalados, de maneira precisa, o seu início e o final\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como as hachuras são representadas nos cortes?",
    "options": [
      "Em linha contínua estreita",
      "Em linha tracejada extralarga",
      "Em linha pontilhada colorida",
      "Em linha ondulada de qualquer espessura"
    ],
    "correct_answer": "Em linha contínua estreita",
    "explanation": "O texto afirma que, \"de acordo com a NBR 6492 (ABNT, 2021), as hachuras são representadas em linha contínua estreita\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a diferença entre corte longitudinal e corte transversal quanto ao eixo que atravessam, na etapa de organização do desenho?",
    "options": [
      "O corte longitudinal atravessa o eixo principal (maior dimensão) do projeto, enquanto o transversal passa pelo eixo secundário (menor dimensão)",
      "Ambos atravessam sempre o mesmo eixo, apenas em direções opostas",
      "O corte transversal é usado exclusivamente em edificações térreas",
      "O corte longitudinal nunca é usado em conjunto com o corte transversal"
    ],
    "correct_answer": "O corte longitudinal atravessa o eixo principal (maior dimensão) do projeto, enquanto o transversal passa pelo eixo secundário (menor dimensão)",
    "explanation": "O texto reafirma que \"o corte longitudinal atravessa o eixo principal do projeto, ou seja, a maior dimensão do projeto, enquanto o corte transversal passa pelo eixo secundário, ou seja, pela menor dimensão do edifício\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (2017), citado no texto, qual é o primeiro passo no roteiro para desenvolver o desenho de um corte, partindo da planta do pavimento?",
    "options": [
      "Colocar papel-manteiga na planta",
      "Desenhar o telhado completo",
      "Inserir as cotas de nível",
      "Definir a escala final do desenho"
    ],
    "correct_answer": "Colocar papel-manteiga na planta",
    "explanation": "O texto lista o passo a passo de Montenegro (2017), cujo primeiro item é \"colocar papel-manteiga na planta\"."
  },
  {
    "page": 39,
    "difficulty": "hard",
    "prompt": "Segundo o roteiro de Montenegro (2017), citado no texto, em que etapa do desenvolvimento de um corte se desenham as paredes internas que são interceptadas pelo plano de corte?",
    "options": [
      "Na sétima etapa, após desenhar o limite da cobertura ou telhado",
      "Na primeira etapa, antes de qualquer outro elemento",
      "Na última etapa, depois de inserir todas as cotas",
      "Essa etapa não faz parte do processo descrito no texto"
    ],
    "correct_answer": "Na sétima etapa, após desenhar o limite da cobertura ou telhado",
    "explanation": "O texto lista o passo 7 como \"desenhar as paredes internas que são interceptadas pelo plano de corte\", logo após o passo 6, \"desenhar o limite da cobertura ou telhado\"."
  },
  {
    "page": 40,
    "difficulty": "medium",
    "prompt": "Segundo o texto, depois de representar todos os elementos \"em corte\", para onde o desenhista deve avançar na organização do desenho?",
    "options": [
      "Para a representação dos elementos que são apresentados \"em vista\", ou seja, aqueles não atravessados pelo plano de corte",
      "Diretamente para a impressão final da prancha",
      "Para o desenho da planta de situação do terreno",
      "Para a elaboração do memorial descritivo do projeto"
    ],
    "correct_answer": "Para a representação dos elementos que são apresentados \"em vista\", ou seja, aqueles não atravessados pelo plano de corte",
    "explanation": "O texto afirma que, \"uma vez que todos os elementos em corte estão representados, você deve partir para a representação dos elementos que são apresentados em vista\"."
  },
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que determina a quantidade de detalhes e a dimensão da hachura usada em um corte?",
    "options": [
      "A escala que está sendo usada no desenho",
      "Exclusivamente a preferência pessoal do desenhista",
      "O tipo de papel utilizado na impressão do desenho",
      "O horário em que o desenho foi produzido"
    ],
    "correct_answer": "A escala que está sendo usada no desenho",
    "explanation": "O texto afirma que \"a quantidade de detalhes e a dimensão da hachura dependerão da escala que está sendo usada no seu desenho\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definida uma \"elevação\"?",
    "options": [
      "\"representação gráfica em projeção vertical ortogonal de planos internos ou de elementos da edificação\"",
      "\"vista superior em projeção ortogonal da edificação, em uma determinada altura\"",
      "\"representação tridimensional isométrica de um ambiente interno\"",
      "\"corte horizontal que divide a edificação em dois pavimentos\""
    ],
    "correct_answer": "\"representação gráfica em projeção vertical ortogonal de planos internos ou de elementos da edificação\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 2)."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u3_p4 = [
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, como é definida uma \"fachada\"?",
    "options": [
      "\"representação gráfica por meio da projeção vertical ortogonal de cada um dos lados planos externos de uma edificação\"",
      "\"representação gráfica em projeção vertical ortogonal de planos internos ou de elementos da edificação\"",
      "\"vista superior esquemática do terreno e seu entorno\"",
      "\"plano secante vertical que divide o edifício em duas partes\""
    ],
    "correct_answer": "\"representação gráfica por meio da projeção vertical ortogonal de cada um dos lados planos externos de uma edificação\"",
    "explanation": "O texto cita literalmente essa definição da NBR 6492 (ABNT, 2021, p. 2)."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quem se posiciona de maneira paralela a cada uma das faces externas da edificação para a construção de uma fachada?",
    "options": [
      "Um observador imaginário, do lado de fora, olhando diretamente para a edificação",
      "Apenas o proprietário do imóvel, no momento da entrega da obra",
      "O engenheiro estrutural, durante a vistoria final",
      "Nenhum observador é necessário para esse tipo de desenho"
    ],
    "correct_answer": "Um observador imaginário, do lado de fora, olhando diretamente para a edificação",
    "explanation": "O texto afirma: \"imagine um observador que se posiciona de maneira paralela a cada uma das faces da edificação, do lado de fora, e olhando diretamente para esta mesma edificação\"."
  },
  {
    "page": 46,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2012), citado no texto, o que caracteriza fachadas e elevações como \"desenhos ortográficos\"?",
    "options": [
      "Não apresentam tridimensionalidade ou distorções de grandeza, estando em verdadeira grandeza ou escala real",
      "São sempre desenhados à mão livre, sem uso de instrumentos técnicos",
      "Representam exclusivamente o interior da edificação",
      "Não seguem qualquer padrão de escala definido em norma"
    ],
    "correct_answer": "Não apresentam tridimensionalidade ou distorções de grandeza, estando em verdadeira grandeza ou escala real",
    "explanation": "O texto afirma que, sendo \"desenhos ortográficos\" (Ching, 2012), \"as fachadas e elevações não apresentam tridimensionalidade ou distorções de grandeza, o que indica que as medidas apresentadas pelo desenho estão em verdadeira grandeza ou em escala real\"."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais escalas são mais comumente usadas para fachadas e elevações, podendo aumentar para 1:25 ou 1:10 quando se deseja mais detalhes?",
    "options": [
      "1:100 e 1:50",
      "1:1000 e 1:500",
      "1:5 e 1:2",
      "1:1 (tamanho real)"
    ],
    "correct_answer": "1:100 e 1:50",
    "explanation": "O texto afirma que \"normalmente, as escalas 1:100 e 1:50 são bastante usadas, mas caso se deseje apresentar uma maior quantidade de detalhes é possível adotar as escalas 1:25 ou 1:10\"."
  },
  {
    "page": 49,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021), citada no texto, qual é a função das elevações em relação à planta e aos cortes?",
    "options": [
      "Complementar informações que não ficaram claras o suficiente através da planta e dos cortes",
      "Substituir totalmente a necessidade de plantas e cortes em um projeto",
      "Servir exclusivamente para aprovação de projetos junto à prefeitura",
      "Representar apenas o entorno urbano da edificação"
    ],
    "correct_answer": "Complementar informações que não ficaram claras o suficiente através da planta e dos cortes",
    "explanation": "O texto afirma que \"as elevações são uma maneira de complementar informações que não ficaram claras o suficiente através da planta e dos cortes\"."
  },
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo o texto, por que geralmente não se cotam as esquadrias diretamente na fachada?",
    "options": [
      "Porque elas já estão apresentadas no Quadro de Aberturas, sendo as únicas cotas presentes na fachada as cotas de nível",
      "Porque a norma proíbe qualquer cotagem em desenhos de fachada",
      "Porque as esquadrias nunca aparecem em desenhos de fachada",
      "Porque cotar esquadrias na fachada tornaria o desenho ilegível em qualquer escala"
    ],
    "correct_answer": "Porque elas já estão apresentadas no Quadro de Aberturas, sendo as únicas cotas presentes na fachada as cotas de nível",
    "explanation": "O texto afirma que \"sobre a representação das esquadrias em fachadas, estas já estão apresentadas no Quadro de Aberturas, não é comum cotar estes elementos na fachada, sendo assim, as únicas cotas presentes são as cotas de níveis\"."
  },
  {
    "page": 57,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2017, p. 81), citado no texto, para que servem as hachuras em fachadas e elevações?",
    "options": [
      "Para ilustrar a textura e o padrão dos materiais de revestimento",
      "Para indicar exclusivamente a orientação cardeal do desenho",
      "Para substituir a necessidade de cotas de nível",
      "Para identificar apenas elementos estruturais ocultos"
    ],
    "correct_answer": "Para ilustrar a textura e o padrão dos materiais de revestimento",
    "explanation": "O texto cita Ching (2017, p. 81): as hachuras são usadas em fachadas e elevações para \"ilustrar a textura e o padrão dos materiais de revestimento\"."
  },
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a nomenclatura ou título adotado para um projeto de fachada ou elevação representa, além de uma simples identificação?",
    "options": [
      "Uma orientação de leitura projetual e de sua compreensão",
      "Apenas o nome fantasia do empreendimento",
      "O valor de venda estimado do imóvel",
      "A data de aprovação do projeto na prefeitura"
    ],
    "correct_answer": "Uma orientação de leitura projetual e de sua compreensão",
    "explanation": "O texto afirma que \"a nomenclatura ou o título adotado para um projeto não é simplesmente uma identificação de suas fachadas ou elevações, mas uma orientação de leitura projetual e de sua compreensão\"."
  },
  {
    "page": 65,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 17006 (ABNT, 2021b), citada no texto, na projeção do primeiro diedro usada em fachadas e elevações, onde fica posicionada a Vista Superior (VS) em relação à Vista Frontal (VF)?",
    "options": [
      "Acima",
      "Abaixo",
      "À esquerda",
      "À direita"
    ],
    "correct_answer": "Acima",
    "explanation": "O texto afirma que \"a Vista Superior (VS) fica acima\" da Vista Frontal, que é a principal, segundo a NBR 17006 (ABNT, 2021b)."
  },
  {
    "page": 65,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 17006 (ABNT, 2021b), citada no texto, quais são os três critérios pelos quais os métodos de projeção são definidos?",
    "options": [
      "Tipo de projetantes, posição do plano de projeção em relação às projetantes, e posição do objeto em relação ao plano de projeção",
      "Cor, textura e material do objeto representado",
      "Escala, formato de papel e tipo de linha",
      "Orientação cardeal, altitude e latitude do terreno"
    ],
    "correct_answer": "Tipo de projetantes, posição do plano de projeção em relação às projetantes, e posição do objeto em relação ao plano de projeção",
    "explanation": "O texto cita a NBR 17006 (ABNT, 2021b, p. 6), que define os métodos de projeção pelo tipo de projetantes, pela posição do plano de projeção em relação às projetantes, e pela posição do objeto em relação ao plano de projeção."
  }
];

const q_lesson_desenho_arquitetura_urbanismo_u3_p5 = [
  {
    "page": 66,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2012), citado no texto, com base em que as fachadas também podem receber nomenclaturas?",
    "options": [
      "Na orientação em que se encontram, como fachadas norte ou leste",
      "Exclusivamente na ordem de execução da obra",
      "No nome do cliente responsável pelo projeto",
      "No número de pavimentos da edificação"
    ],
    "correct_answer": "Na orientação em que se encontram, como fachadas norte ou leste",
    "explanation": "O texto afirma que \"segundo Ching (2012), as fachadas também podem receber nomenclaturas com base na orientação em que se encontram, como, por exemplo, fachadas norte ou leste\"."
  },
  {
    "page": 68,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2017), citado no texto, quais são os passos fundamentais para a montagem de fachadas e elevações, executados após plantas e cortes?",
    "options": [
      "Desenhar a linha de terreno/piso com medidas horizontais, transportar as medidas de altura dos cortes, e ajustar traços conforme a profundidade dos elementos",
      "Escolher a cor de acabamento, definir o mobiliário e finalizar com renderização 3D",
      "Solicitar aprovação do cliente antes de iniciar qualquer desenho",
      "Realizar o levantamento topográfico do terreno"
    ],
    "correct_answer": "Desenhar a linha de terreno/piso com medidas horizontais, transportar as medidas de altura dos cortes, e ajustar traços conforme a profundidade dos elementos",
    "explanation": "O texto lista exatamente esses três passos fundamentais, segundo Ching (2017), para a montagem das fachadas e elevações."
  },
  {
    "page": 71,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2012), citado no texto, o que os desenhos de fachada apresentam, além das formas gerais e massas edificadas?",
    "options": [
      "Detalhes de aberturas e esquadrias, o contexto ou terreno do projeto, e os materiais ou sistemas estruturais aparentes",
      "Exclusivamente informações financeiras do empreendimento",
      "Apenas a paleta de cores da pintura interna",
      "Somente o layout de mobiliário do ambiente"
    ],
    "correct_answer": "Detalhes de aberturas e esquadrias, o contexto ou terreno do projeto, e os materiais ou sistemas estruturais aparentes",
    "explanation": "O texto afirma que, segundo Ching (2012), \"os desenhos de fachada apresentam formas gerais e massas edificadas, com seus detalhes de aberturas e esquadrias (portas e janelas), o contexto ou terreno de projeto... e os materiais usados ou sistemas estruturais que estejam aparentes\"."
  },
  {
    "page": 72,
    "difficulty": "medium",
    "prompt": "Segundo o texto, no caso de uma representação de fachada destinada apenas à apresentação ao cliente (não à obra), o que pode ser utilizado para identificar profundidades e materialidades?",
    "options": [
      "Penumbras e sombras",
      "Exclusivamente cotas numéricas detalhadas",
      "Apenas texto descritivo, sem qualquer recurso gráfico",
      "Hachuras técnicas obrigatórias da NBR 6492"
    ],
    "correct_answer": "Penumbras e sombras",
    "explanation": "O texto afirma que, \"no caso de uma representação que será usada apenas para apresentação (desenho para clientes), podem ser utilizadas penumbras e sombras que ajudarão a identificar profundidades em elevações e fachadas, bem como materialidades\"."
  },
  {
    "page": 73,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 6492 (ABNT, 2021a), citada no texto, quais cotas devem ser usadas em desenhos de fachadas e elevações?",
    "options": [
      "Cotas de nível",
      "Cotas de dimensões internas dos ambientes",
      "Cotas de área construída",
      "Nenhuma cota é necessária em fachadas"
    ],
    "correct_answer": "Cotas de nível",
    "explanation": "O texto afirma que \"segundo a NBR 6492 (ABNT, 2021a), as cotas usadas devem ser de nível\" em fachadas e elevações."
  },
  {
    "page": 74,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 16752 (ABNT, 2020), citada no texto, entre qual intervalo de tamanhos de papel da série A devem ser feitas as pranchas de desenho de arquitetura?",
    "options": [
      "Entre A4 (menor) e A0 (maior formato)",
      "Entre A0 (menor) e A4 (maior formato)",
      "Exclusivamente no formato A3",
      "Qualquer tamanho, sem padronização pela norma"
    ],
    "correct_answer": "Entre A4 (menor) e A0 (maior formato)",
    "explanation": "O texto afirma que \"as pranchas de um desenho de arquitetura devem ser feitas em papel da série A, variando entre o tamanho A4 (menor) até o A0 (maior formato)\"."
  },
  {
    "page": 75,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 16752 (ABNT, 2020), citada no texto, quais informações devem compor a legenda de um desenho técnico?",
    "options": [
      "Título, número e responsável pelo projeto, entre outros dados como proprietário, autor, data e número da folha",
      "Exclusivamente o nome do software utilizado para o desenho",
      "Apenas a data de nascimento do projetista",
      "Somente o CEP do terreno"
    ],
    "correct_answer": "Título, número e responsável pelo projeto, entre outros dados como proprietário, autor, data e número da folha",
    "explanation": "O texto afirma que \"as legendas de um desenho técnico são compostas pelos principais dados sobre o desenho, tais como título, número e responsável pelo projeto\", além de proprietário, autor, data e número da folha."
  },
  {
    "page": 75,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para a escolha correta de revestimentos de paredes externas e fachadas, qual norma deve ser consultada?",
    "options": [
      "NBR 13755",
      "NBR 6492",
      "NBR 9050",
      "NBR 15575"
    ],
    "correct_answer": "NBR 13755",
    "explanation": "O texto afirma que \"para a escolha correta de revestimentos de paredes externas e fachadas, consulte a NBR 13755 (ABNT, 2017), que trata de Revestimentos cerâmicos de fachadas e paredes externas\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_projeto_arquitetura_cultural — Unidade 1 — Metodologia de Projeto e Criatividade (34 perguntas, fonte: q_projeto_arquitetura_cultural_u1.json)
// ---------------------------------------------------------------------------
const q_lesson_projeto_arquitetura_cultural_u1_p1 = [
  {
    "page": 1,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual é o título da Unidade 1 do material de Atelier de Projeto de Arquitetura Cultural?",
    "options": [
      "Metodologia de projeto e criatividade",
      "Informações iniciais de projeto",
      "Elaboração das plantas, cortes e fachadas de projeto",
      "Encerramento da disciplina"
    ],
    "correct_answer": "Metodologia de projeto e criatividade",
    "explanation": "O texto identifica \"Unidade 1 - Metodologia de projeto e criatividade\" como título desta unidade."
  },
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Choay (2001), citada no texto, o que museus, bibliotecas e centros culturais representam, além da função construtiva?",
    "options": [
      "Plataformas de expressão coletiva e instrumentos de fortalecimento comunitário",
      "Exclusivamente locais de armazenamento de acervo histórico",
      "Apenas espaços comerciais disfarçados de cultura",
      "Somente monumentos estáticos sem função social"
    ],
    "correct_answer": "Plataformas de expressão coletiva e instrumentos de fortalecimento comunitário",
    "explanation": "O texto afirma que \"museus, bibliotecas e centros culturais tornam-se plataformas de expressão coletiva e instrumentos de fortalecimento comunitário, indo além da função construtiva para representar identidades e valores sociais\" (Choay, 2001)."
  },
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Lefebvre (1991), citado no texto, por que é necessário mapear territórios, atores e dinâmicas culturais antes do desenho arquitetônico?",
    "options": [
      "Para evitar projetos genéricos e possibilitar respostas coerentes à realidade local",
      "Porque a lei exige esse mapeamento antes de qualquer projeto",
      "Apenas para fins de marketing do empreendimento",
      "Exclusivamente para reduzir o custo final da obra"
    ],
    "correct_answer": "Para evitar projetos genéricos e possibilitar respostas coerentes à realidade local",
    "explanation": "O texto afirma que essa abordagem \"evita projetos genéricos e possibilita respostas coerentes à realidade (Lefebvre, 1991)\"."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Villaça (2001), citado no texto, o que os métodos de projeto fazem ao integrar pesquisa qualitativa, participação social e experimentação espacial?",
    "options": [
      "Transformam necessidades em soluções projetuais verificáveis, transparentes e inclusivas",
      "Eliminam totalmente a necessidade de licenciamento do projeto",
      "Reduzem exclusivamente o tempo de execução da obra",
      "Substituem a atuação do arquiteto por processos automatizados"
    ],
    "correct_answer": "Transformam necessidades em soluções projetuais verificáveis, transparentes e inclusivas",
    "explanation": "O texto afirma que tais métodos \"transformam necessidades em soluções projetuais verificáveis, transparentes e inclusivas, reafirmando o papel da arquitetura como prática social e cultural\" (Villaça, 2001)."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Jacobs (1961), citada no texto, por que os espaços culturais não podem ser pensados de forma neutra?",
    "options": [
      "Porque são instrumentos de transformação social que moldam práticas culturais e fortalecem identidades coletivas",
      "Porque a legislação brasileira proíbe projetos neutros",
      "Porque isso encareceria desnecessariamente a obra",
      "Porque apenas espaços neutros recebem financiamento público"
    ],
    "correct_answer": "Porque são instrumentos de transformação social que moldam práticas culturais e fortalecem identidades coletivas",
    "explanation": "O texto afirma que tais espaços \"são instrumentos de transformação social, pois moldam práticas culturais e fortalecem identidades coletivas (Jacobs, 1961)\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, por que a gestão compartilhada de um espaço cultural é importante?",
    "options": [
      "Garante que o espaço se mantenha vivo e atualizado, evitando o risco de se tornar obsoleto ou distante da realidade local",
      "Elimina totalmente a necessidade de manutenção predial",
      "É exigida por lei em qualquer equipamento público",
      "Reduz o valor de mercado do imóvel"
    ],
    "correct_answer": "Garante que o espaço se mantenha vivo e atualizado, evitando o risco de se tornar obsoleto ou distante da realidade local",
    "explanation": "O texto afirma que \"a gestão compartilhada do espaço cultural garante que ele se mantenha vivo e atualizado, evitando o risco de se tornar obsoleto ou distante da realidade local (Littlefield, 2014)\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é o \"partido\" arquitetônico, na tradução do diagnóstico em programa arquitetônico?",
    "options": [
      "A ideia central que orienta a organização dos espaços, definindo a relação entre forma e função no projeto",
      "O documento legal de aprovação municipal do projeto",
      "O orçamento total estimado da obra",
      "O conjunto de normas técnicas aplicáveis ao projeto"
    ],
    "correct_answer": "A ideia central que orienta a organização dos espaços, definindo a relação entre forma e função no projeto",
    "explanation": "O texto define o partido como \"a ideia central que orienta a organização dos espaços, definindo a relação entre forma e função no projeto arquitetônico\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Zein (2006), citada no texto, o que caracteriza espaços \"duros\" e espaços \"moles\" em projetos culturais?",
    "options": [
      "Espaços \"duros\" são destinados a funções específicas, e espaços \"moles\" são aptos a se reinventarem conforme os usos",
      "Ambos os termos são sinônimos, sem distinção prática",
      "\"Duros\" referem-se a materiais de concreto; \"moles\", a materiais têxteis",
      "\"Duros\" são exclusivamente externos; \"moles\", exclusivamente internos"
    ],
    "correct_answer": "Espaços \"duros\" são destinados a funções específicas, e espaços \"moles\" são aptos a se reinventarem conforme os usos",
    "explanation": "O texto afirma que essa multiplicidade \"exige espaços 'duros', destinados a funções específicas, e espaços 'moles', aptos a se reinventarem conforme os usos (Zein, 2006)\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que significa considerar a acessibilidade cultural como um \"conceito ampliado\"?",
    "options": [
      "Não se trata apenas de instalar rampas e sinalizações táteis, mas de pensar a programação e o design do espaço de modo inclusivo",
      "Refere-se exclusivamente à instalação de elevadores em edifícios de múltiplos pavimentos",
      "Aplica-se somente a museus, nunca a bibliotecas ou centros comunitários",
      "Significa reduzir o número de usuários simultâneos no espaço"
    ],
    "correct_answer": "Não se trata apenas de instalar rampas e sinalizações táteis, mas de pensar a programação e o design do espaço de modo inclusivo",
    "explanation": "O texto afirma que \"não se trata apenas de instalar rampas e sinalizações táteis, mas de pensar a programação e o design do espaço de modo inclusivo, acolhendo diferentes faixas etárias, repertórios e condições sociais\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo Ostrower (2013), citada no texto, ao contrário da visão romântica de que a criatividade surge de maneira espontânea, como ela pode ser tratada?",
    "options": [
      "Pode ser estimulada, estruturada e orientada, tornando-se um recurso estratégico para profissionais da área",
      "É uma habilidade exclusivamente inata, que não pode ser desenvolvida",
      "Depende unicamente de talento artístico herdado geneticamente",
      "Só pode ser aplicada por profissionais com formação em artes"
    ],
    "correct_answer": "Pode ser estimulada, estruturada e orientada, tornando-se um recurso estratégico para profissionais da área",
    "explanation": "O texto afirma que \"ao contrário da visão romântica de que surge de maneira espontânea, a criatividade pode ser estimulada, estruturada e orientada, tornando-se um recurso estratégico para profissionais da área\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u1_p2 = [
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (1987), citado no texto, como se descreve o processo criativo no projeto?",
    "options": [
      "Como uma trajetória de múltiplas etapas em que o pensamento divergente explora possibilidades e o pensamento convergente organiza e seleciona as ideias mais viáveis",
      "Como um processo linear e único, sem alternância de etapas",
      "Como algo que ocorre exclusivamente na fase final do projeto",
      "Como uma técnica aplicável apenas a projetos de pequeno porte"
    ],
    "correct_answer": "Como uma trajetória de múltiplas etapas em que o pensamento divergente explora possibilidades e o pensamento convergente organiza e seleciona as ideias mais viáveis",
    "explanation": "O texto afirma que \"o processo criativo no projeto pode ser descrito como uma trajetória de múltiplas etapas... no início, o pensamento divergente ganha força... posteriormente, o pensamento convergente organiza essas ideias, selecionando as mais adequadas e viáveis (Montenegro, 1987)\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza a técnica do brainstorm no processo criativo?",
    "options": [
      "Cria um espaço de liberdade em que todas as contribuições são válidas, suspendendo o julgamento imediato para permitir que ideias originais surjam sem bloqueios",
      "Exige que apenas o arquiteto sênior proponha ideias, sem participação da equipe",
      "É aplicável exclusivamente à fase de execução da obra",
      "Consiste em escolher a primeira ideia apresentada, sem discussão"
    ],
    "correct_answer": "Cria um espaço de liberdade em que todas as contribuições são válidas, suspendendo o julgamento imediato para permitir que ideias originais surjam sem bloqueios",
    "explanation": "O texto afirma que o brainstorm \"cria um espaço de liberdade em que todas as contribuições são válidas... ao suspender o julgamento imediato, a técnica possibilita que ideias originais surjam sem bloqueios\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Neufert (2013), citado no texto, o que ocorre quando uma proposta é esteticamente ousada mas não respeita parâmetros de viabilidade, normas ou acessibilidade?",
    "options": [
      "Ela perde sua relevância, pois a criatividade não substitui a técnica, mas se articula com ela",
      "Ela automaticamente se torna mais valorizada no mercado",
      "Isso não gera qualquer consequência prática ao projeto",
      "A norma técnica deixa de ser aplicável nesse caso"
    ],
    "correct_answer": "Ela perde sua relevância, pois a criatividade não substitui a técnica, mas se articula com ela",
    "explanation": "O texto afirma que, se a proposta \"não respeitar parâmetros de viabilidade, normas ou acessibilidade, perde sua relevância. Nesse sentido, a criatividade não substitui a técnica, mas se articula com ela\" (Neufert, 2013)."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo Cascudo (2004), citado no texto, por que o repertório cultural do projetista é determinante para a criatividade?",
    "options": [
      "Quanto maior a variedade de referências, maior a capacidade de estabelecer conexões inovadoras",
      "Porque apenas profissionais com pós-graduação possuem repertório válido",
      "Porque reduz automaticamente o custo do projeto",
      "Porque substitui a necessidade de escuta da comunidade"
    ],
    "correct_answer": "Quanto maior a variedade de referências, maior a capacidade de estabelecer conexões inovadoras",
    "explanation": "O texto afirma que \"quanto maior a variedade de referências, maior a capacidade de estabelecer conexões inovadoras. Isso reforça a importância da formação ampla e interdisciplinar para a prática criativa (Cascudo, 2004)\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o uso de tecnologias digitais no processo criativo funciona como quê, sem substituir a imaginação humana?",
    "options": [
      "Mediadores cognitivos, capazes de potencializar o processo criativo ao permitir que ideias sejam rapidamente testadas, ajustadas e validadas",
      "Substitutos completos da criatividade humana",
      "Ferramentas exclusivas para a fase de obra, nunca para o projeto",
      "Elementos dispensáveis em qualquer etapa do processo criativo"
    ],
    "correct_answer": "Mediadores cognitivos, capazes de potencializar o processo criativo ao permitir que ideias sejam rapidamente testadas, ajustadas e validadas",
    "explanation": "O texto afirma que essas ferramentas \"funcionam como mediadores cognitivos, capazes de potencializar o processo criativo ao permitir que ideias sejam rapidamente testadas, ajustadas e validadas\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2015), citado no texto, o que significa observar e analisar obras de referência em arquitetura?",
    "options": [
      "Não significa imitar soluções, mas interpretar conceitos que podem ser ressignificados em novos contextos",
      "Significa reproduzir fielmente a planta de um projeto já existente",
      "Aplica-se exclusivamente a edifícios tombados como patrimônio histórico",
      "É uma etapa dispensável quando o arquiteto já possui muitos anos de experiência"
    ],
    "correct_answer": "Não significa imitar soluções, mas interpretar conceitos que podem ser ressignificados em novos contextos",
    "explanation": "O texto afirma que, \"segundo Ching (2015), observar e analisar obras de referência não significa imitar soluções, mas interpretar conceitos que podem ser ressignificados em novos contextos\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Lynch (2011), citado no texto, a que está diretamente relacionada a qualidade do projeto?",
    "options": [
      "À capacidade do profissional em articular experiências prévias e referências consolidadas, transformando-as em soluções adequadas ao lugar e ao usuário",
      "Exclusivamente ao valor do orçamento disponível para a obra",
      "Apenas à quantidade de softwares utilizados no processo",
      "Somente ao tamanho da equipe de projeto envolvida"
    ],
    "correct_answer": "À capacidade do profissional em articular experiências prévias e referências consolidadas, transformando-as em soluções adequadas ao lugar e ao usuário",
    "explanation": "O texto afirma que, \"para Lynch (2011), a qualidade do projeto está diretamente relacionada à capacidade do profissional em articular experiências prévias e referências consolidadas, transformando-as em soluções adequadas ao lugar e ao usuário\"."
  },
  {
    "page": 25,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual solução espacial do Museu Iberê Camargo, projetado por Álvaro Siza, é destacada como exemplo de integração entre movimento, paisagem e arte?",
    "options": [
      "Rampas internas contínuas que conduzem o visitante a diferentes níveis expositivos",
      "Um elevador panorâmico voltado para o rio Guaíba",
      "Uma escada em espiral central que atravessa todos os pavimentos",
      "Um pátio interno coberto por uma cúpula de vidro"
    ],
    "correct_answer": "Rampas internas contínuas que conduzem o visitante a diferentes níveis expositivos",
    "explanation": "O texto afirma que \"o museu Iberê Camargo, por exemplo, apresenta rampas internas contínuas que conduzem o visitante a diferentes níveis expositivos\", integrando movimento, paisagem e arte."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Frampton (2008), citado no texto, o que a estrutura exposta e a flexibilidade dos espaços internos do Centro Cultural Georges Pompidou revelam?",
    "options": [
      "A inovação tecnológica e a democratização cultural da década de 1970",
      "Uma tentativa de reduzir custos de manutenção do edifício",
      "A influência exclusiva da arquitetura colonial francesa",
      "Um projeto inacabado que nunca foi finalizado"
    ],
    "correct_answer": "A inovação tecnológica e a democratização cultural da década de 1970",
    "explanation": "O texto afirma que essa estrutura \"revelam a inovação tecnológica e a democratização cultural da década de 1970 (Frampton, 2008)\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo Neufert (2013), citado no texto, do que depende a qualidade espacial de um edifício cultural?",
    "options": [
      "Da integração entre arquitetura, paisagismo, iluminação e acústica",
      "Exclusivamente do tamanho do terreno disponível",
      "Apenas do orçamento total investido na obra",
      "Somente da quantidade de pavimentos do edifício"
    ],
    "correct_answer": "Da integração entre arquitetura, paisagismo, iluminação e acústica",
    "explanation": "O texto afirma que \"a qualidade espacial de um edifício cultural depende da integração entre arquitetura, paisagismo, iluminação e acústica\" (Neufert, 2013)."
  }
];

const q_lesson_projeto_arquitetura_cultural_u1_p3 = [
  {
    "page": 27,
    "difficulty": "medium",
    "prompt": "Segundo Lawson (2005), citado no texto, para que servem diagramas e esquemas na análise projetual?",
    "options": [
      "São ferramentas eficazes para mapear decisões de projeto, permitindo identificar relações entre espaços públicos e privados, fluxos e articulações com o entorno",
      "Servem exclusivamente para apresentação estética ao cliente final",
      "Substituem totalmente a necessidade de visitas técnicas ao local",
      "São usados apenas em projetos de reforma, nunca em projetos novos"
    ],
    "correct_answer": "São ferramentas eficazes para mapear decisões de projeto, permitindo identificar relações entre espaços públicos e privados, fluxos e articulações com o entorno",
    "explanation": "O texto afirma que, \"Lawson (2005) destaca que diagramas e esquemas são ferramentas eficazes para mapear decisões de projeto, permitindo identificar relações entre espaços públicos e privados, fluxos e articulações com o entorno\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o Museu do Amanhã, de Santiago Calatrava, no Rio de Janeiro, é citado como exemplo de quê?",
    "options": [
      "Como as decisões arquitetônicas tornam-se símbolos urbanos contemporâneos",
      "De um projeto que ignorou completamente questões de sustentabilidade",
      "De uma obra que não teve qualquer repercussão internacional",
      "De um edifício que não incorporou nenhuma inovação tecnológica"
    ],
    "correct_answer": "Como as decisões arquitetônicas tornam-se símbolos urbanos contemporâneos",
    "explanation": "O texto afirma que o Museu do Amanhã \"é um exemplo de como as decisões arquitetônicas tornam-se símbolos urbanos contemporâneos\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo Segawa (2010), citado no texto, o que o Museu de Arte Contemporânea de Niterói, de Oscar Niemeyer, mostra sobre monumentalidade e plasticidade formal?",
    "options": [
      "Que podem dialogar com a paisagem natural, fortalecendo identidades locais",
      "Que são incompatíveis com qualquer paisagem natural preexistente",
      "Que servem exclusivamente para fins comerciais",
      "Que aumentam necessariamente o custo de manutenção do edifício"
    ],
    "correct_answer": "Que podem dialogar com a paisagem natural, fortalecendo identidades locais",
    "explanation": "O texto afirma que essa obra \"mostra como a monumentalidade e a plasticidade formal podem dialogar com a paisagem natural, fortalecendo identidades locais (Segawa, 2010)\"."
  },
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2011), citado no texto, de onde nasce a concepção arquitetônica, segundo a aula sobre soluções projetuais?",
    "options": [
      "Da análise de variáveis complexas, nas quais a forma e a função se articulam em um sistema coerente",
      "Exclusivamente da inspiração espontânea do arquiteto, sem análise prévia",
      "Apenas da cópia de projetos de referência internacionais",
      "Somente do orçamento disponível para a obra"
    ],
    "correct_answer": "Da análise de variáveis complexas, nas quais a forma e a função se articulam em um sistema coerente",
    "explanation": "O texto afirma que, \"segundo Ching (2011), a concepção arquitetônica nasce da análise de variáveis complexas, nas quais a forma e a função se articulam em um sistema coerente\"."
  },
  {
    "page": 34,
    "difficulty": "medium",
    "prompt": "Segundo Neufert (2013), citado no texto, o que é o primeiro passo para assegurar coerência e funcionalidade em um projeto?",
    "options": [
      "A sistematização das exigências espaciais",
      "A escolha da paleta de cores da fachada",
      "A contratação da equipe de obra",
      "A definição do prazo final de entrega"
    ],
    "correct_answer": "A sistematização das exigências espaciais",
    "explanation": "O texto afirma que \"a sistematização das exigências espaciais é o primeiro passo para assegurar coerência e funcionalidade\" (Neufert, 2013)."
  },
  {
    "page": 35,
    "difficulty": "medium",
    "prompt": "Segundo Montaner (2009), citado no texto, o que o registro das informações do processo projetual representa, além de garantir clareza técnica?",
    "options": [
      "Uma narrativa cultural, na qual a arquitetura registra e transmite sentidos, comunicando valores simbólicos por meio de soluções técnicas",
      "Apenas um requisito burocrático sem valor real",
      "Um documento exclusivamente financeiro para prestação de contas",
      "Um substituto completo para o projeto executivo"
    ],
    "correct_answer": "Uma narrativa cultural, na qual a arquitetura registra e transmite sentidos, comunicando valores simbólicos por meio de soluções técnicas",
    "explanation": "O texto afirma que, \"para Montaner (2009), esse processo é também uma narrativa cultural: a arquitetura registra e transmite sentidos, comunicando valores simbólicos por meio de soluções técnicas\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Choay (2001), citada no texto, quando o espaço cultural cumpre sua função social?",
    "options": [
      "Quando é capaz de se integrar à vida urbana e dialogar com sua história",
      "Apenas quando possui financiamento público exclusivo",
      "Somente quando é tombado como patrimônio histórico",
      "Quando é utilizado exclusivamente por turistas"
    ],
    "correct_answer": "Quando é capaz de se integrar à vida urbana e dialogar com sua história",
    "explanation": "O texto afirma que \"o espaço cultural só cumpre sua função social quando é capaz de se integrar à vida urbana e dialogar com sua história (Choay, 2001)\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Kevin Lynch (2011), citado no texto, do que depende a leitura do espaço urbano?",
    "options": [
      "Da seleção e ordenação de informações, base para a construção de soluções compreensíveis e acessíveis ao usuário",
      "Exclusivamente da altura dos edifícios do entorno",
      "Apenas da quantidade de vegetação presente na área",
      "Somente da opinião pessoal do arquiteto responsável"
    ],
    "correct_answer": "Da seleção e ordenação de informações, base para a construção de soluções compreensíveis e acessíveis ao usuário",
    "explanation": "O texto afirma que \"Kevin Lynch (2011) destaca que a leitura do espaço urbano depende da seleção e ordenação de informações, sendo essa a base para a construção de soluções compreensíveis e acessíveis ao usuário\"."
  },
  {
    "page": 38,
    "difficulty": "medium",
    "prompt": "Segundo Cullen (2006), citado no texto, o que a representação gráfica também é, além de um meio técnico?",
    "options": [
      "Um meio de transmitir a experiência espacial, evocando sensações e projetando atmosferas",
      "Um documento exclusivamente jurídico sem valor projetual",
      "Um substituto total para a visita ao local",
      "Uma ferramenta usada apenas em projetos de paisagismo"
    ],
    "correct_answer": "Um meio de transmitir a experiência espacial, evocando sensações e projetando atmosferas",
    "explanation": "O texto afirma que, \"para Cullen (2006), a representação gráfica é também um meio de transmitir a experiência espacial, evocando sensações e projetando atmosferas\"."
  },
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo Lina Bo Bardi (1994), citada no texto, qual deve ser o papel da arquitetura, segundo a aula sobre soluções projetuais?",
    "options": [
      "Ser instrumento de transformação cultural, aproximando o público das práticas artísticas e sociais",
      "Exclusivamente abrigar funções administrativas do poder público",
      "Servir apenas como investimento financeiro para o proprietário",
      "Reproduzir fielmente estilos arquitetônicos do passado, sem inovação"
    ],
    "correct_answer": "Ser instrumento de transformação cultural, aproximando o público das práticas artísticas e sociais",
    "explanation": "O texto afirma que \"Lina Bo Bardi (1994) defendia que a arquitetura deve ser instrumento de transformação cultural, aproximando o público das práticas artísticas e sociais\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u1_p4 = [
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o Sesc Pompeia, de Lina Bo Bardi, é citado como exemplo de que processo?",
    "options": [
      "A adaptação de uma antiga fábrica em centro cultural, respeitando pré-existências e criando novas experiências coletivas",
      "A construção de um edifício totalmente novo, sem qualquer preexistência no terreno",
      "Um projeto que foi demolido poucos anos após sua inauguração",
      "Uma obra que ignorou completamente a acessibilidade universal"
    ],
    "correct_answer": "A adaptação de uma antiga fábrica em centro cultural, respeitando pré-existências e criando novas experiências coletivas",
    "explanation": "O texto afirma que \"o Sesc Pompeia, de Lina Bo Bardi, ilustra esse processo: a adaptação de uma antiga fábrica em centro cultural respeitou pré-existências e criou novas experiências coletivas (Bardi, 1994)\"."
  },
  {
    "page": 43,
    "difficulty": "medium",
    "prompt": "Segundo Lawson (2005), citado no texto, o que a prototipagem, maquetes físicas e modelos digitais possibilitam no processo projetual?",
    "options": [
      "Simular experiências espaciais, testando hipóteses antes da execução",
      "Substituir totalmente a necessidade de um projeto executivo",
      "Eliminar a necessidade de qualquer aprovação junto à prefeitura",
      "Reduzir o prazo de obra pela metade, em qualquer situação"
    ],
    "correct_answer": "Simular experiências espaciais, testando hipóteses antes da execução",
    "explanation": "O texto afirma que esses recursos \"possibilitam simular experiências espaciais, testando hipóteses antes da execução\" (Lawson, 2005)."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo o texto, a organização das informações em projetos culturais sustentáveis deve estar alinhada a quais agendas globais?",
    "options": [
      "Os Objetivos de Desenvolvimento Sustentável (ODS) da ONU",
      "Exclusivamente acordos comerciais bilaterais",
      "Apenas normas técnicas nacionais, sem relação internacional",
      "Somente diretrizes de bancos de fomento privados"
    ],
    "correct_answer": "Os Objetivos de Desenvolvimento Sustentável (ODS) da ONU",
    "explanation": "O texto afirma que a organização das informações deve contemplar \"critérios de sustentabilidade, alinhados a agendas globais como os ODS da ONU (ONU, 2015)\"."
  },
  {
    "page": 65,
    "difficulty": "easy",
    "prompt": "Segundo o texto, quem criou a técnica do brainstorming, e em que década?",
    "options": [
      "Alex Osborn, nos anos 1940",
      "Frank Lloyd Wright, nos anos 1920",
      "Le Corbusier, nos anos 1930",
      "Oscar Niemeyer, nos anos 1950"
    ],
    "correct_answer": "Alex Osborn, nos anos 1940",
    "explanation": "O texto afirma que o podcast aborda \"a origem do brainstorming, criado por Alex Osborn nos anos 1940, que se tornou essencial também na arquitetura\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_projeto_arquitetura_cultural — Unidade 2 — Informações Iniciais de Projeto (36 perguntas, fonte: q_projeto_arquitetura_cultural_u2.json)
// ---------------------------------------------------------------------------
const q_lesson_projeto_arquitetura_cultural_u2_p1 = [
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, o que a arquitetura deve ser capaz de traduzir em formas espaciais que acolham diferentes públicos e atividades?",
    "options": [
      "Valores coletivos",
      "Exclusivamente o orçamento disponível",
      "Apenas a identidade visual da marca do cliente",
      "Somente requisitos estruturais da edificação"
    ],
    "correct_answer": "Valores coletivos",
    "explanation": "O texto afirma que \"a arquitetura deve ser capaz de traduzir valores coletivos em formas espaciais que acolham diferentes públicos e atividades\" (Ching, 2013)."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que deve orientar percursos, circulações e equipamentos de apoio em um centro cultural, conforme a NBR 9050 (ABNT, 2020)?",
    "options": [
      "A acessibilidade universal",
      "Exclusivamente critérios estéticos",
      "Apenas o fluxo de veículos",
      "Somente a localização de saídas de emergência"
    ],
    "correct_answer": "A acessibilidade universal",
    "explanation": "O texto afirma que \"a primeira é a acessibilidade universal, que deve orientar percursos, circulações e equipamentos de apoio em conformidade com a NBR 9050 (ABNT, 2020)\"."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Lynch (1997), citado no texto, o que edifícios de referência fazem pela imagem da cidade?",
    "options": [
      "Fortalecem a imagem da cidade e estimulam a vitalidade dos espaços públicos",
      "Reduzem a circulação de pedestres no entorno",
      "Diminuem o valor de mercado dos imóveis vizinhos",
      "Eliminam a necessidade de espaços públicos externos"
    ],
    "correct_answer": "Fortalecem a imagem da cidade e estimulam a vitalidade dos espaços públicos",
    "explanation": "O texto afirma que, \"para Lynch (1997), edifícios de referência fortalecem a imagem da cidade e estimulam a vitalidade dos espaços públicos\"."
  },
  {
    "page": 2,
    "difficulty": "medium",
    "prompt": "Segundo Choay (2001), citada no texto, como deve ser compreendido o patrimônio cultural?",
    "options": [
      "Como algo dinâmico, que se atualiza constantemente em diálogo com a sociedade",
      "Como algo estático, que nunca deve ser modificado",
      "Como um conceito aplicável apenas a edificações tombadas",
      "Como um obstáculo à inovação arquitetônica"
    ],
    "correct_answer": "Como algo dinâmico, que se atualiza constantemente em diálogo com a sociedade",
    "explanation": "O texto afirma que, \"como destaca Choay (2001), o patrimônio cultural deve ser compreendido como algo dinâmico, que se atualiza constantemente em diálogo com a sociedade\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Abbud (2006), citado no texto, o que o projeto de espaços culturais deve unir?",
    "options": [
      "Sensibilidade estética à funcionalidade",
      "Exclusivamente critérios financeiros e prazo de obra",
      "Apenas normas técnicas, sem preocupação estética",
      "Somente a opinião do cliente contratante"
    ],
    "correct_answer": "Sensibilidade estética à funcionalidade",
    "explanation": "O texto afirma que \"Abbud (2006) ressalta que o projeto de espaços culturais deve unir sensibilidade estética à funcionalidade\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, a que se relaciona a qualidade do espaço urbano?",
    "options": [
      "À maneira como as pessoas experienciam o ambiente no dia a dia",
      "Exclusivamente ao valor de mercado dos imóveis da região",
      "Apenas à quantidade de estacionamentos disponíveis",
      "Somente à altura máxima permitida pela legislação"
    ],
    "correct_answer": "À maneira como as pessoas experienciam o ambiente no dia a dia",
    "explanation": "O texto afirma que, \"como defende Littlefield (2014), a qualidade do espaço urbano se relaciona à maneira como as pessoas experienciam o ambiente no dia a dia\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Santaella (2003), citada no texto, o que os ambientes digitais fazem em relação às formas de produção e circulação cultural?",
    "options": [
      "Expandem essas formas, criando ecossistemas inovadores que dialogam com diferentes públicos e modos de interação",
      "Substituem totalmente a necessidade de espaços físicos de convivência",
      "Restringem o acesso à cultura a públicos especializados",
      "Eliminam a relevância da experiência presencial"
    ],
    "correct_answer": "Expandem essas formas, criando ecossistemas inovadores que dialogam com diferentes públicos e modos de interação",
    "explanation": "O texto afirma que \"os ambientes digitais expandem as formas de produção e circulação cultural, criando ecossistemas inovadores que dialogam com diferentes públicos e modos de interação (Santaella, 2003)\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Choay (2001), citada no texto, como são caracterizados os processos de preservação e dinamização do patrimônio cultural?",
    "options": [
      "Como processos coletivos",
      "Como responsabilidade exclusiva do poder público",
      "Como tarefa exclusiva de historiadores e arqueólogos",
      "Como algo que não envolve a comunidade local"
    ],
    "correct_answer": "Como processos coletivos",
    "explanation": "O texto afirma que \"Choay (2001) observa, a preservação e dinamização do patrimônio cultural são processos coletivos\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, por que a compreensão clara das necessidades é indispensável no programa de necessidades?",
    "options": [
      "Para garantir que os espaços projetados sejam adequados ao uso humano e ao contexto sociocultural",
      "Exclusivamente para reduzir o custo total da obra",
      "Apenas para acelerar o processo de aprovação municipal",
      "Somente para simplificar o desenho da fachada"
    ],
    "correct_answer": "Para garantir que os espaços projetados sejam adequados ao uso humano e ao contexto sociocultural",
    "explanation": "O texto afirma que, \"segundo Francis D. K. Ching (2013), a compreensão clara das necessidades é indispensável para garantir que os espaços projetados sejam adequados ao uso humano e ao contexto sociocultural\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os três tipos de programa de necessidades apresentados, de acordo com seu grau de detalhamento e enfoque?",
    "options": [
      "Funcional, espacial e técnico",
      "Preliminar, executivo e final",
      "Público, privado e misto",
      "Estrutural, hidráulico e elétrico"
    ],
    "correct_answer": "Funcional, espacial e técnico",
    "explanation": "O texto afirma que \"o programa funcional organiza ambientes conforme atividades e usos; o programa espacial estabelece dimensões e relações topológicas; enquanto o programa técnico considera condicionantes normativos, estruturais e de desempenho\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u2_p2 = [
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o \"programa espacial\" estabelece, na organização de um centro cultural?",
    "options": [
      "Dimensões e relações topológicas entre os ambientes",
      "Exclusivamente as atividades e usos de cada ambiente",
      "Apenas as normas de segurança contra incêndio",
      "Somente o cronograma de execução da obra"
    ],
    "correct_answer": "Dimensões e relações topológicas entre os ambientes",
    "explanation": "O texto afirma que \"o programa espacial... atua na organização das relações entre esses ambientes\", como a proximidade entre auditório, foyer e bilheteria."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o \"programa técnico\" incorpora?",
    "options": [
      "Questões normativas, como acessibilidade (NBR 9050) e segurança contra incêndio (NBR 9077)",
      "Exclusivamente a escolha de materiais de acabamento",
      "Apenas a definição do partido arquitetônico",
      "Somente questões de marketing do empreendimento"
    ],
    "correct_answer": "Questões normativas, como acessibilidade (NBR 9050) e segurança contra incêndio (NBR 9077)",
    "explanation": "O texto afirma que \"o programa técnico incorpora questões normativas, como a acessibilidade garantida pela ABNT NBR 9050:2020, as exigências de segurança contra incêndio (ABNT NBR 9077) e as condições ambientais adequadas\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo Milton Santos (2023), citado no texto, a que está intrinsecamente ligada a produção do espaço?",
    "options": [
      "Às práticas sociais",
      "Exclusivamente a decisões técnicas de engenharia",
      "Apenas a fatores climáticos",
      "Somente à disponibilidade de recursos financeiros"
    ],
    "correct_answer": "Às práticas sociais",
    "explanation": "O texto afirma que, \"como argumenta Milton Santos (2023), a produção do espaço está intrinsicamente ligada às práticas sociais\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as três dimensões fundamentais que o programa de necessidades de um centro cultural deve atender?",
    "options": [
      "Uso, comunidade e identidade cultural",
      "Estrutura, instalações e acabamentos",
      "Custo, prazo e qualidade",
      "Projeto, licenciamento e execução"
    ],
    "correct_answer": "Uso, comunidade e identidade cultural",
    "explanation": "O texto afirma que \"em um centro cultural, o programa de necessidades deve atender a três dimensões fundamentais: uso, comunidade e identidade cultural\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o Sesc Pompeia, de Lina Bo Bardi, inaugurado em 1982, é citado como exemplo de quê, nesta unidade?",
    "options": [
      "Uma arquitetura que dialoga intensamente com o entorno e com a coletividade",
      "Um projeto que não teve qualquer relação com o contexto urbano",
      "Uma obra abandonada após sua inauguração",
      "Um projeto que ignorou completamente as pré-existências do terreno"
    ],
    "correct_answer": "Uma arquitetura que dialoga intensamente com o entorno e com a coletividade",
    "explanation": "O texto afirma que o Sesc Pompeia \"exemplifica... cuja arquitetura dialoga intensamente com o entorno e com a coletividade (Fuentes, 2016)\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo Jacobs (2011), citada no texto, o que o programa de necessidades também é, ao garantir acessibilidade física e simbólica?",
    "options": [
      "Uma ferramenta de inclusão social e de fortalecimento da cidadania",
      "Exclusivamente um documento técnico sem relação social",
      "Um instrumento usado apenas para aprovação bancária",
      "Um substituto para o projeto executivo"
    ],
    "correct_answer": "Uma ferramenta de inclusão social e de fortalecimento da cidadania",
    "explanation": "O texto afirma que \"o programa é também uma ferramenta de inclusão social e de fortalecimento da cidadania (Jacobs, 2011)\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo Freire (1996), citado no texto, o que centros culturais que integram oficinas, bibliotecas e áreas de exposição funcionam como?",
    "options": [
      "Espaços de aprendizado não formal",
      "Exclusivamente espaços de lazer sem função educativa",
      "Apenas locais de armazenamento de acervo",
      "Somente pontos de venda de produtos culturais"
    ],
    "correct_answer": "Espaços de aprendizado não formal",
    "explanation": "O texto afirma que esses centros \"funcionam como espaços de aprendizado não formal\" (Freire, 1996)."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2013), citado no texto, o que compreender o local significa, na análise das condicionantes do terreno?",
    "options": [
      "Interpretar a interação entre espaço construído e meio, garantindo um projeto coerente ao contexto",
      "Exclusivamente medir a área total do terreno",
      "Apenas verificar o valor de mercado do lote",
      "Somente identificar o proprietário legal do imóvel"
    ],
    "correct_answer": "Interpretar a interação entre espaço construído e meio, garantindo um projeto coerente ao contexto",
    "explanation": "O texto afirma que, \"segundo Ching (2013), compreender o local significa interpretar a interação entre espaço construído e meio, garantindo um projeto coerente ao contexto\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os três elementos centrais do levantamento de condicionantes do terreno e do local?",
    "options": [
      "Análise das vistas, condicionantes climáticas e levantamento das especificidades locais",
      "Orçamento, prazo e qualidade",
      "Estrutura, instalações e acabamentos",
      "Planta, corte e fachada"
    ],
    "correct_answer": "Análise das vistas, condicionantes climáticas e levantamento das especificidades locais",
    "explanation": "O texto afirma que \"entre os elementos centrais desse processo estão a análise das vistas, as condicionantes climáticas e o levantamento das especificidades locais\"."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo Yi-Fu Tuan (2013), citado no texto, que tipo de dimensão a percepção do lugar possui?",
    "options": [
      "Dimensão simbólica e afetiva",
      "Exclusivamente dimensão financeira",
      "Apenas dimensão estrutural",
      "Somente dimensão jurídica"
    ],
    "correct_answer": "Dimensão simbólica e afetiva",
    "explanation": "O texto afirma que, \"para Yi-Fu Tuan (2013), a percepção do lugar tem dimensão simbólica e afetiva\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u2_p3 = [
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Kevin Lynch (1997), citado no texto, a partir de que a imagem da cidade se constrói?",
    "options": [
      "Das percepções visuais do entorno, como elementos naturais e referências urbanas",
      "Exclusivamente de dados estatísticos populacionais",
      "Apenas do valor imobiliário dos terrenos",
      "Somente da opinião de especialistas em urbanismo"
    ],
    "correct_answer": "Das percepções visuais do entorno, como elementos naturais e referências urbanas",
    "explanation": "O texto afirma que \"Kevin Lynch (1997) ressalta que a imagem da cidade se constrói a partir dessas percepções visuais\", referindo-se a elementos naturais e urbanos do entorno."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Mascaró (1996), citada no texto, o que o uso de estratégias bioclimáticas permite?",
    "options": [
      "Reduzir consumo energético e garantir qualidade ambiental",
      "Eliminar totalmente a necessidade de projeto estrutural",
      "Aumentar exclusivamente o valor estético da fachada",
      "Substituir a necessidade de licenciamento ambiental"
    ],
    "correct_answer": "Reduzir consumo energético e garantir qualidade ambiental",
    "explanation": "O texto afirma que \"o uso de estratégias bioclimáticas é um caminho para reduzir consumo energético e garantir qualidade ambiental\" (Mascaró, 1996)."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo Rolnik (1997), citada no texto, por que é essencial compreender a legislação urbana (zoneamento, gabarito, taxas de ocupação, recuos)?",
    "options": [
      "Para garantir viabilidade ao projeto e evitar conflitos futuros",
      "Exclusivamente para reduzir o valor do IPTU",
      "Apenas para agilizar a contratação de mão de obra",
      "Somente para facilitar o financiamento bancário"
    ],
    "correct_answer": "Para garantir viabilidade ao projeto e evitar conflitos futuros",
    "explanation": "O texto afirma que, \"para Rolnik (1997), compreender a legislação urbana é essencial para garantir viabilidade ao projeto e evitar conflitos futuros\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo Jacobs (2011), citada no texto, de que dependem cidades vivas e seguras?",
    "options": [
      "Da integração entre arquitetura, comunidade e vida cotidiana",
      "Exclusivamente da presença de policiamento ostensivo",
      "Apenas da altura máxima permitida das edificações",
      "Somente da quantidade de vias expressas na região"
    ],
    "correct_answer": "Da integração entre arquitetura, comunidade e vida cotidiana",
    "explanation": "O texto afirma que, \"como defende Jacobs (2011), cidades vivas e seguras dependem da integração entre arquitetura, comunidade e vida cotidiana\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Romero (2016), citada no texto, o que a arquitetura bioclimática no Brasil deve considerar?",
    "options": [
      "As diferentes zonas climáticas, adaptando-se a cada realidade, principalmente em espaços públicos",
      "Exclusivamente o clima de uma única região do país",
      "Apenas fatores estéticos, sem relação com o clima",
      "Somente normas internacionais, sem adaptação local"
    ],
    "correct_answer": "As diferentes zonas climáticas, adaptando-se a cada realidade, principalmente em espaços públicos",
    "explanation": "O texto afirma que, \"para Romero (2016), a arquitetura bioclimática no Brasil deve considerar as diferentes zonas climáticas e adaptar-se a cada realidade, principalmente se tratando de espaços públicos\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Carmo e Dziura (2020), citados no texto, o que é essencial para enfrentar os desafios do aquecimento global?",
    "options": [
      "O uso inteligente da tecnologia aliada a soluções passivas",
      "Exclusivamente a substituição total de materiais tradicionais",
      "Apenas a redução do número de aberturas na fachada",
      "Somente a construção subterrânea de edificações"
    ],
    "correct_answer": "O uso inteligente da tecnologia aliada a soluções passivas",
    "explanation": "O texto afirma que \"Carmo e Dziura (2020) defendem que o uso inteligente da tecnologia aliada a soluções passivas é essencial para enfrentar os desafios do aquecimento global\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo Choay (2001), citada no texto, como o patrimônio cultural deve ser integrado ao projeto, quando há preexistências no terreno?",
    "options": [
      "Como elemento ativo do projeto, enriquecendo sua identidade e autenticidade",
      "Como obstáculo que deve ser sempre removido",
      "Como elemento decorativo sem função estrutural",
      "Como responsabilidade exclusiva do órgão de patrimônio, sem relação com o projeto"
    ],
    "correct_answer": "Como elemento ativo do projeto, enriquecendo sua identidade e autenticidade",
    "explanation": "O texto afirma que \"Choay (2001) afirma que o patrimônio cultural deve ser integrado como elemento ativo do projeto, enriquecendo sua identidade e autenticidade\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo Villaça (2001), citado no texto, a partir de que escala se constroem cidades humanizadas?",
    "options": [
      "Da escala do pedestre",
      "Exclusivamente da escala do automóvel",
      "Apenas da escala regional metropolitana",
      "Somente da escala de grandes empreendimentos comerciais"
    ],
    "correct_answer": "Da escala do pedestre",
    "explanation": "O texto afirma que \"Villaça (2001) argumenta que cidades humanizadas se constroem a partir da escala do pedestre\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são os três principais eixos da legislação aplicada a projetos culturais, apresentados na Aula 4?",
    "options": [
      "Acessibilidade, dimensões mínimas e análise do entorno",
      "Orçamento, prazo e qualidade",
      "Estrutura, instalações e acabamentos",
      "Estética, função e custo"
    ],
    "correct_answer": "Acessibilidade, dimensões mínimas e análise do entorno",
    "explanation": "O texto afirma que \"entre os principais eixos da legislação aplicada destacam-se a acessibilidade, as dimensões mínimas e a análise do entorno\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o Estatuto da Cidade (Lei nº 10.257/2001) e legislações municipais definem?",
    "options": [
      "Coeficientes de aproveitamento, recuos, gabaritos e usos permitidos",
      "Exclusivamente o valor do IPTU de cada imóvel",
      "Apenas normas de segurança do trabalho em obras",
      "Somente os requisitos de acessibilidade interna"
    ],
    "correct_answer": "Coeficientes de aproveitamento, recuos, gabaritos e usos permitidos",
    "explanation": "O texto afirma que \"instrumentos como o Estatuto da Cidade (Lei n.º 10.257/2001) e legislações municipais definem coeficientes de aproveitamento, recuos, gabaritos e usos permitidos\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u2_p4 = [
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 9050:2020, citada no texto, o que deve ser garantido a pessoas com mobilidade reduzida em edifícios culturais?",
    "options": [
      "Condições de uso pleno, incluindo cadeirantes, idosos, gestantes e crianças, com percursos contínuos e livres de barreiras",
      "Acesso restrito a horários específicos do dia",
      "Apenas o uso do pavimento térreo, sem acesso aos demais andares",
      "Acesso mediante agendamento prévio obrigatório"
    ],
    "correct_answer": "Condições de uso pleno, incluindo cadeirantes, idosos, gestantes e crianças, com percursos contínuos e livres de barreiras",
    "explanation": "O texto afirma que \"todos os edifícios devem garantir condições de uso pleno a pessoas com mobilidade reduzida, incluindo cadeirantes, idosos, gestantes e crianças, incluindo percursos contínuos e livres de barreiras\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o Código de Obras e Edificações municipal regulamenta?",
    "options": [
      "A aprovação e execução de projetos, incluindo requisitos estruturais, sanitários, de acessibilidade e segurança contra incêndio",
      "Exclusivamente o valor de venda dos imóveis",
      "Apenas o horário de funcionamento de estabelecimentos comerciais",
      "Somente a nomenclatura das ruas do município"
    ],
    "correct_answer": "A aprovação e execução de projetos, incluindo requisitos estruturais, sanitários, de acessibilidade e segurança contra incêndio",
    "explanation": "O texto afirma que \"o Código de Obras e Edificações, em suas versões municipais, regulamenta a aprovação e execução de projetos. Ele define desde requisitos estruturais e sanitários até padrões de acessibilidade e segurança contra incêndio\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto (NBR 9077:2001, citada), o que essa norma e as legislações estaduais de prevenção contra incêndios determinam para espaços de grande público?",
    "options": [
      "Saídas, sinalizações e rotas de fuga essenciais",
      "Exclusivamente a cor da pintura das paredes",
      "Apenas o número de funcionários necessários",
      "Somente o valor do seguro predial obrigatório"
    ],
    "correct_answer": "Saídas, sinalizações e rotas de fuga essenciais",
    "explanation": "O texto afirma que \"normas como a NBR 9077:2001 (saídas de emergência em edifícios) e as legislações estaduais de prevenção contra incêndios determinam saídas, sinalizações e rotas de fuga essenciais para espaços de grande público\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza a \"legislação de acessibilidade comunicacional\" em projetos culturais?",
    "options": [
      "Inclui desde sinalização tátil no piso até intérpretes de Libras em apresentações culturais",
      "Refere-se exclusivamente à sinalização de trânsito no entorno do edifício",
      "Aplica-se apenas a museus, nunca a centros comunitários",
      "Diz respeito somente à velocidade da internet disponível no local"
    ],
    "correct_answer": "Inclui desde sinalização tátil no piso até intérpretes de Libras em apresentações culturais",
    "explanation": "O texto afirma que \"a legislação de acessibilidade comunicacional... inclui desde sinalização tátil no piso até intérpretes de Libras em apresentações culturais\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, de que depende o sucesso de um centro cultural a longo prazo, além do projeto arquitetônico em si?",
    "options": [
      "Da capacidade de envolver comunidade, poder público e iniciativa privada em sua manutenção",
      "Exclusivamente do valor investido na construção inicial",
      "Apenas do renome do escritório de arquitetura responsável",
      "Somente da localização geográfica do terreno"
    ],
    "correct_answer": "Da capacidade de envolver comunidade, poder público e iniciativa privada em sua manutenção",
    "explanation": "O texto afirma que \"o sucesso de um centro cultural não depende apenas do projeto arquitetônico, mas da capacidade de envolver comunidade, poder público e iniciativa privada em sua manutenção\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é indispensável considerar ao pensar em centros culturais a longo prazo?",
    "options": [
      "Sua resiliência frente às mudanças econômicas, sociais e ambientais",
      "Exclusivamente o valor de revenda do imóvel",
      "Apenas a manutenção da fachada original",
      "Somente o cumprimento do prazo de obra"
    ],
    "correct_answer": "Sua resiliência frente às mudanças econômicas, sociais e ambientais",
    "explanation": "O texto afirma que \"é indispensável considerar sua resiliência frente às mudanças econômicas, sociais e ambientais. Projetar espaços flexíveis, sustentáveis e inclusivos é garantir que esse equipamento urbano permaneça vivo e significativo no futuro\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_projeto_arquitetura_cultural — Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (42 perguntas, fonte: q_projeto_arquitetura_cultural_u3.json)
// ---------------------------------------------------------------------------
const q_lesson_projeto_arquitetura_cultural_u3_p1 = [
  {
    "page": 1,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual é o título da Unidade 3 do material de Atelier de Projeto de Arquitetura Cultural?",
    "options": [
      "Elaboração das plantas, cortes e fachadas de projeto",
      "Metodologia de projeto e criatividade",
      "Informações iniciais de projeto",
      "Encerramento da disciplina"
    ],
    "correct_answer": "Elaboração das plantas, cortes e fachadas de projeto",
    "explanation": "O texto identifica \"Unidade 3 - Elaboração das plantas, cortes e fachadas de projeto\" como título desta unidade."
  },
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2010), citado no texto, o que o arquiteto articula nas fases iniciais do projeto?",
    "options": [
      "Forma, função e estrutura, transformando informações abstratas em composições concretas",
      "Exclusivamente o orçamento total da obra",
      "Apenas a escolha de materiais de acabamento",
      "Somente o cronograma de execução"
    ],
    "correct_answer": "Forma, função e estrutura, transformando informações abstratas em composições concretas",
    "explanation": "O texto afirma que, \"segundo Ching (2010), é nessa etapa que o arquiteto articula forma, função e estrutura, transformando informações abstratas em composições concretas\"."
  },
  {
    "page": 1,
    "difficulty": "medium",
    "prompt": "Segundo Montaner (2023), citado no texto, o que o espaço cultural precisa ser?",
    "options": [
      "Um lugar de expressão coletiva, aberto à experimentação e à memória urbana",
      "Exclusivamente um espaço de armazenamento de acervo",
      "Apenas um investimento imobiliário para o poder público",
      "Somente um espaço fechado ao público em geral"
    ],
    "correct_answer": "Um lugar de expressão coletiva, aberto à experimentação e à memória urbana",
    "explanation": "O texto afirma que, \"como observa Montaner (2023), o espaço cultural precisa ser um lugar de expressão coletiva, aberto à experimentação e à memória urbana\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Ching e Eckler (2013), citados no texto, o que o plano de massas organiza?",
    "options": [
      "O conjunto, conciliando proporções, orientação solar, ventilação e acessos",
      "Exclusivamente o orçamento total do projeto",
      "Apenas a escolha de cores da fachada",
      "Somente o cronograma de obra"
    ],
    "correct_answer": "O conjunto, conciliando proporções, orientação solar, ventilação e acessos",
    "explanation": "O texto afirma que, \"conforme Ching e Eckler (2013), o plano de massas organiza o conjunto, conciliando proporções, orientação solar, ventilação e acessos\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, o que os diagramas de projeto revelam?",
    "options": [
      "A lógica interna do projeto — hierarquias, relações visuais, percursos e conexões",
      "Exclusivamente o valor financeiro da obra",
      "Apenas a data prevista de entrega",
      "Somente a equipe responsável pelo projeto"
    ],
    "correct_answer": "A lógica interna do projeto — hierarquias, relações visuais, percursos e conexões",
    "explanation": "O texto afirma que os diagramas \"são representações gráficas que revelam a lógica interna do projeto: hierarquias, relações visuais, percursos e conexões\" (Littlefield, 2014)."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Lefebvre (1991), citado no texto, o que o partido arquitetônico constitui?",
    "options": [
      "A materialização formal e espacial do conceito arquitetônico",
      "Exclusivamente o orçamento detalhado da obra",
      "Apenas o conjunto de normas técnicas aplicáveis",
      "Somente o cronograma de aprovação municipal"
    ],
    "correct_answer": "A materialização formal e espacial do conceito arquitetônico",
    "explanation": "O texto afirma que \"o partido arquitetônico que, segundo Lefebvre (1991), constitui a materialização formal e espacial dessa ideia\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza as etapas iniciais do projeto como um \"processo iterativo e reflexivo\"?",
    "options": [
      "O arquiteto revisita constantemente o plano de massas, os diagramas e o partido, testando alternativas e verificando a viabilidade técnica, estética e ambiental",
      "O projeto nunca pode ser revisado após a primeira versão",
      "Cada etapa deve ser executada apenas uma vez, sem repetição",
      "O processo é definido exclusivamente pelo cliente, sem participação do arquiteto"
    ],
    "correct_answer": "O arquiteto revisita constantemente o plano de massas, os diagramas e o partido, testando alternativas e verificando a viabilidade técnica, estética e ambiental",
    "explanation": "O texto afirma que \"o arquiteto revisita constantemente o plano de massas, os diagramas e o partido, testando alternativas e verificando a viabilidade técnica, estética e ambiental do projeto. É um processo iterativo e reflexivo\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Neves (1989), citado no texto, o que o partido representa no projeto?",
    "options": [
      "A espinha dorsal do projeto, consolidando a coerência entre o discurso conceitual e as decisões compositivas",
      "Exclusivamente um esboço descartável do início do processo",
      "Apenas um documento burocrático de aprovação",
      "Somente um resumo do orçamento da obra"
    ],
    "correct_answer": "A espinha dorsal do projeto, consolidando a coerência entre o discurso conceitual e as decisões compositivas",
    "explanation": "O texto afirma que, \"segundo Neves (1989), o partido representa a espinha dorsal do projeto, pois consolida a coerência entre o discurso conceitual e as decisões compositivas\"."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo Montaner (2023), citado no texto, o que é o conceito arquitetônico, descrito como \"núcleo ideológico\" da obra?",
    "options": [
      "O ponto a partir do qual se articulam todas as decisões formais e espaciais",
      "Exclusivamente um elemento decorativo da fachada",
      "Apenas um requisito legal de aprovação",
      "Somente uma etapa dispensável em projetos pequenos"
    ],
    "correct_answer": "O ponto a partir do qual se articulam todas as decisões formais e espaciais",
    "explanation": "O texto afirma que, \"conforme Montaner (2023), o conceito é o 'núcleo ideológico' da obra, a partir do qual se articulam todas as decisões formais e espaciais\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2010), citado no texto, o que a planta baixa representa, sendo uma vista horizontal seccionada a aproximadamente 1,50 m do piso?",
    "options": [
      "Paredes, aberturas, escadas, mobiliário e fluxos",
      "Exclusivamente a fachada externa da edificação",
      "Apenas o sistema estrutural oculto",
      "Somente a cobertura do edifício"
    ],
    "correct_answer": "Paredes, aberturas, escadas, mobiliário e fluxos",
    "explanation": "O texto afirma que \"a planta baixa é uma vista horizontal seccionada a aproximadamente 1,50 m do piso, representando paredes, aberturas, escadas, mobiliário e fluxos\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u3_p2 = [
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais dados as plantas de projetos culturais precisam considerar simultaneamente, segundo Littlefield (2014)?",
    "options": [
      "Dados urbanísticos, topográficos, legais e ambientais, integrados a uma leitura espacial coerente com o entorno",
      "Exclusivamente dados financeiros do empreendedor",
      "Apenas o histórico de propriedade do terreno",
      "Somente a opinião de vizinhos do entorno"
    ],
    "correct_answer": "Dados urbanísticos, topográficos, legais e ambientais, integrados a uma leitura espacial coerente com o entorno",
    "explanation": "O texto afirma que \"as plantas precisam considerar simultaneamente dados urbanísticos, topográficos, legais e ambientais, integrando-os a uma leitura espacial coerente com o entorno (Littlefield, 2014)\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais escalas são comuns para plantas gerais, e quais para detalhamentos?",
    "options": [
      "1:100 ou 1:200 para plantas gerais; 1:50 ou 1:25 para detalhamentos",
      "1:1000 para gerais; 1:500 para detalhamentos",
      "1:10 para gerais; 1:1 para detalhamentos",
      "A escala é sempre fixa em 1:50, independentemente da fase"
    ],
    "correct_answer": "1:100 ou 1:200 para plantas gerais; 1:50 ou 1:25 para detalhamentos",
    "explanation": "O texto afirma que \"para plantas gerais, são comuns escalas 1:100 ou 1:200; já para detalhamentos, 1:50 ou 1:25\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo Villaça (2012), citado no texto, o que a planta de implantação deve traduzir?",
    "options": [
      "A articulação entre o espaço privado e o espaço público, refletindo o papel urbano e social do edifício",
      "Exclusivamente o valor de mercado do terreno",
      "Apenas a distribuição interna dos ambientes",
      "Somente o sistema estrutural da fundação"
    ],
    "correct_answer": "A articulação entre o espaço privado e o espaço público, refletindo o papel urbano e social do edifício",
    "explanation": "O texto afirma que, \"segundo Villaça (2012), a implantação deve traduzir a articulação entre o espaço privado e o espaço público, refletindo o papel urbano e social do edifício\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a planta de implantação deve conter, além dos acessos e estacionamentos?",
    "options": [
      "Curvas de nível, orientação solar, vegetação existente, cotas altimétricas e redes de infraestrutura",
      "Exclusivamente o valor de venda do imóvel",
      "Apenas a lista de materiais de acabamento interno",
      "Somente o nome dos responsáveis técnicos"
    ],
    "correct_answer": "Curvas de nível, orientação solar, vegetação existente, cotas altimétricas e redes de infraestrutura",
    "explanation": "O texto afirma que a planta de implantação \"deve conter curvas de nível, orientação solar, acessos, estacionamentos, vegetação existente, cotas altimétricas e redes de infraestrutura\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a NBR 15575:2021 traz para edificações, incluindo edifícios culturais?",
    "options": [
      "Princípios de sustentabilidade e desempenho técnico",
      "Exclusivamente requisitos de acessibilidade",
      "Apenas normas de representação gráfica",
      "Somente critérios de segurança contra incêndio"
    ],
    "correct_answer": "Princípios de sustentabilidade e desempenho técnico",
    "explanation": "O texto afirma que \"a NBR 15575:2021... traz princípios de sustentabilidade que também podem ser aplicados em edifícios culturais, reforçando a importância do conforto ambiental e do desempenho técnico\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o uso do BIM (Building Information Modeling) permite em projetos culturais?",
    "options": [
      "A interoperabilidade entre arquitetura, estrutura e instalações, ampliando a consistência das plantas",
      "Exclusivamente a redução do custo de mão de obra",
      "Apenas a eliminação da necessidade de projeto estrutural",
      "Somente a automatização do processo de aprovação municipal"
    ],
    "correct_answer": "A interoperabilidade entre arquitetura, estrutura e instalações, ampliando a consistência das plantas",
    "explanation": "O texto afirma que \"o uso do BIM... permite a interoperabilidade entre arquitetura, estrutura e instalações. Em projetos culturais, essa metodologia amplia a consistência das plantas, reduz retrabalhos\"."
  },
  {
    "page": 12,
    "difficulty": "medium",
    "prompt": "Segundo Lynch (2011), citado no texto, de onde nasce a legibilidade urbana?",
    "options": [
      "Da coerência entre o edifício e sua paisagem",
      "Exclusivamente da altura máxima permitida pela legislação",
      "Apenas da quantidade de vias de acesso disponíveis",
      "Somente do valor de mercado da região"
    ],
    "correct_answer": "Da coerência entre o edifício e sua paisagem",
    "explanation": "O texto afirma que, \"como destaca Lynch (2011), a legibilidade urbana nasce da coerência entre o edifício e sua paisagem\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9050, citada no texto, como a acessibilidade deve ser tratada no projeto?",
    "options": [
      "Deve ser integrada desde o anteprojeto, e não adicionada posteriormente",
      "Pode ser adicionada apenas na fase de obra, sem prejuízo",
      "É opcional em edifícios culturais de pequeno porte",
      "Deve ser prevista apenas para o pavimento térreo"
    ],
    "correct_answer": "Deve ser integrada desde o anteprojeto, e não adicionada posteriormente",
    "explanation": "O texto afirma que \"a NBR 9050 orienta que a acessibilidade deve ser integrada, e não adicionada posteriormente, garantindo equidade de uso para todos os públicos\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que as diretrizes do IPHAN orientam em projetos situados em áreas históricas?",
    "options": [
      "O respeito às pré-existências, gabaritos e alinhamentos urbanos, preservando a memória coletiva",
      "Exclusivamente a demolição de edificações antigas",
      "Apenas a pintura externa das fachadas",
      "Somente o uso de materiais importados"
    ],
    "correct_answer": "O respeito às pré-existências, gabaritos e alinhamentos urbanos, preservando a memória coletiva",
    "explanation": "O texto afirma que \"a planta de implantação deve demonstrar o respeito às pré-existências, gabaritos e alinhamentos urbanos. Essa compatibilidade técnica preserva a memória coletiva e valoriza a identidade cultural local\"."
  },
  {
    "page": 15,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a documentação técnica final de um projeto deve incluir, conforme a NBR 10068:1987?",
    "options": [
      "Legenda, carimbo, escalas gráficas e simbologia padronizada",
      "Exclusivamente o valor total da obra",
      "Apenas o nome do escritório de arquitetura",
      "Somente a data de aprovação municipal"
    ],
    "correct_answer": "Legenda, carimbo, escalas gráficas e simbologia padronizada",
    "explanation": "O texto afirma que \"a documentação técnica final deve incluir legenda, carimbo, escalas gráficas e simbologia conforme a NBR 10068:1987, garantindo a padronização das pranchas\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u3_p3 = [
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais informações os cortes devem indicar, de acordo com a NBR 6492:2021?",
    "options": [
      "Todos os elementos que compõem a edificação, como paredes, aberturas, pisos, coberturas, escadas e rampas",
      "Exclusivamente a cor da pintura das paredes internas",
      "Apenas o nome do proprietário do imóvel",
      "Somente o valor do IPTU anual"
    ],
    "correct_answer": "Todos os elementos que compõem a edificação, como paredes, aberturas, pisos, coberturas, escadas e rampas",
    "explanation": "O texto afirma que, \"segundo a NBR 6492:2021... o corte deve indicar todos os elementos que compõem a edificação, como paredes, aberturas, pisos, coberturas, escadas e rampas\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2015), citado no texto, o que os cortes arquitetônicos revelam?",
    "options": [
      "A organização vertical dos ambientes, as alturas, os níveis de piso e os sistemas construtivos",
      "Exclusivamente a fachada frontal da edificação",
      "Apenas a localização do terreno na cidade",
      "Somente o layout do mobiliário interno"
    ],
    "correct_answer": "A organização vertical dos ambientes, as alturas, os níveis de piso e os sistemas construtivos",
    "explanation": "O texto afirma que \"os cortes arquitetônicos constituem um dos desenhos mais expressivos e técnicos do projeto, pois revelam a organização vertical dos ambientes, as alturas, os níveis de piso e os sistemas construtivos (Ching, 2015)\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais normas orientam a representação de circulações verticais como escadas e rampas, além da NBR 6492?",
    "options": [
      "NBR 9077:2001 (saídas de emergência) e NBR 9050:2020 (acessibilidade)",
      "Exclusivamente a NBR 15575",
      "Apenas normas internacionais, sem equivalente brasileiro",
      "Somente o Código de Obras municipal, sem norma federal"
    ],
    "correct_answer": "NBR 9077:2001 (saídas de emergência) e NBR 9050:2020 (acessibilidade)",
    "explanation": "O texto afirma que \"as circulações verticais, como escadas e rampas, devem seguir a NBR 9077:2001 – Projeto de saídas de emergência e a NBR 9050:2020 – Acessibilidade a edificações\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (1987), citado no texto, o que a correta dimensão e posicionamento dos vãos de portas e janelas influencia diretamente?",
    "options": [
      "O conforto térmico e lumínico dos ambientes",
      "Exclusivamente o valor de revenda do imóvel",
      "Apenas a resistência estrutural da parede",
      "Somente o tempo de execução da obra"
    ],
    "correct_answer": "O conforto térmico e lumínico dos ambientes",
    "explanation": "O texto afirma que, \"segundo Montenegro (1987), a correta dimensão e posicionamento dos vãos influencia diretamente o conforto térmico e lumínico dos ambientes\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a passagem livre mínima exigida pela NBR 9050:2020 em portas e janelas de rotas acessíveis?",
    "options": [
      "0,80 m",
      "0,50 m",
      "1,20 m",
      "0,60 m"
    ],
    "correct_answer": "0,80 m",
    "explanation": "O texto afirma que essas aberturas \"devem seguir as dimensões da NBR 9050:2020, garantindo passagem livre mínima de 0,80 m e áreas de manobra adequadas\"."
  },
  {
    "page": 21,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual fórmula ergonômica de conforto deve ser obedecida pelas escadas, e qual sua expressão matemática?",
    "options": [
      "A fórmula de Blondel (2e + p = 63 cm)",
      "A fórmula de Vitrúvio (altura = 6 x pé)",
      "A fórmula do Modulor de Le Corbusier",
      "A Seção Áurea de Euclides"
    ],
    "correct_answer": "A fórmula de Blondel (2e + p = 63 cm)",
    "explanation": "O texto afirma que \"escadas devem obedecer à fórmula ergonômica de conforto de Blondel (2e + p = 63 cm)\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a inclinação máxima permitida para rampas, conforme a NBR 9050?",
    "options": [
      "8,33%",
      "15%",
      "5%",
      "20%"
    ],
    "correct_answer": "8,33%",
    "explanation": "O texto afirma que \"as rampas devem respeitar a inclinação máxima de 8,33% e conter pisos antiderrapantes e guarda-corpos contínuos\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que são os \"vazios significativos\" em edifícios culturais, mencionados na representação dos cortes?",
    "options": [
      "Espaços de convivência e circulação que conectam pavimentos e expressam a identidade pública da edificação",
      "Áreas sem qualquer função, resultantes de erro de projeto",
      "Espaços reservados exclusivamente para instalações técnicas ocultas",
      "Vãos estruturais que devem ser sempre eliminados do projeto"
    ],
    "correct_answer": "Espaços de convivência e circulação que conectam pavimentos e expressam a identidade pública da edificação",
    "explanation": "O texto afirma que \"os espaços de convivência e circulação muitas vezes se configuram como 'vazios significativos', áreas que conectam pavimentos e expressam a identidade pública da edificação\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o uso de grandes vãos e pés-direitos duplos cria em centros culturais?",
    "options": [
      "Sensações de amplitude e monumentalidade",
      "Exclusivamente problemas de manutenção",
      "Apenas aumento do custo de climatização, sem benefício estético",
      "Somente redução da área útil disponível"
    ],
    "correct_answer": "Sensações de amplitude e monumentalidade",
    "explanation": "O texto afirma que \"em centros culturais, é comum o uso de grandes vãos e pés-direitos duplos que criam sensações de amplitude e monumentalidade\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, o que a escolha correta de materiais e perfis metálicos nos caixilhos proporciona?",
    "options": [
      "Reduz ganhos térmicos e melhora o desempenho energético",
      "Exclusivamente reduz o custo total da obra",
      "Apenas melhora a estética da fachada",
      "Somente facilita a instalação elétrica"
    ],
    "correct_answer": "Reduz ganhos térmicos e melhora o desempenho energético",
    "explanation": "O texto afirma que, \"segundo Littlefield (2014), a escolha correta de materiais e perfis metálicos reduz ganhos térmicos e melhora o desempenho energético\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u3_p4 = [
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Rasmussen (2010), citado no texto, o que o percurso representa na experiência do usuário em circulações verticais de projetos culturais?",
    "options": [
      "É parte da experiência estética, pois cada nível revela novas perspectivas sobre o espaço",
      "Um elemento puramente funcional, sem relação estética",
      "Um custo adicional que deve ser sempre minimizado",
      "Uma etapa irrelevante para o projeto final"
    ],
    "correct_answer": "É parte da experiência estética, pois cada nível revela novas perspectivas sobre o espaço",
    "explanation": "O texto afirma que, \"como destaca Rasmussen (2010), o percurso é parte da experiência estética: cada nível revela novas perspectivas sobre o espaço\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2015), citado no texto, o que a elevação evidencia como instrumento de representação?",
    "options": [
      "Proporção, ritmo, hierarquia e composição",
      "Exclusivamente o valor de mercado do imóvel",
      "Apenas a localização de tomadas elétricas",
      "Somente o tipo de fundação utilizada"
    ],
    "correct_answer": "Proporção, ritmo, hierarquia e composição",
    "explanation": "O texto afirma que, \"segundo Ching (2015), a elevação é instrumento que evidencia proporção, ritmo, hierarquia e composição\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Montenegro (1987), citado no texto, o que tem impacto direto na percepção e apropriação coletiva do espaço cultural?",
    "options": [
      "O reconhecimento da forma e da imagem urbana",
      "Exclusivamente o valor do investimento público",
      "Apenas a quantidade de vagas de estacionamento",
      "Somente a proximidade com o centro da cidade"
    ],
    "correct_answer": "O reconhecimento da forma e da imagem urbana",
    "explanation": "O texto afirma que \"Montenegro (1987) evidencia que o reconhecimento da forma e da imagem urbana têm impacto direto na percepção e apropriação coletiva do espaço cultural\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo a NBR 9050 (ABNT, 2020), citada no texto, como a acessibilidade universal deve ser tratada no dimensionamento de rampas e escadas em projetos culturais?",
    "options": [
      "Como princípio de projeto, não como adaptação",
      "Como um item opcional a ser avaliado após a obra pronta",
      "Como responsabilidade exclusiva do usuário com deficiência",
      "Como exigência aplicável apenas a museus de grande porte"
    ],
    "correct_answer": "Como princípio de projeto, não como adaptação",
    "explanation": "O texto afirma que o dimensionamento de rampas e escadas \"deve seguir parâmetros rigorosos, priorizando acessibilidade universal como princípio de projeto, não como adaptação\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo Littlefield (2014), citado no texto, o que a arquitetura é, além de forma objetual, na discussão sobre escadas e rampas em projetos culturais?",
    "options": [
      "Movimento, fruição, trajetória, experiência",
      "Exclusivamente um exercício de cálculo estrutural",
      "Apenas uma questão de escolha de materiais",
      "Somente uma resposta a exigências legais"
    ],
    "correct_answer": "Movimento, fruição, trajetória, experiência",
    "explanation": "O texto afirma que \"Littlefield (2014) discute que arquitetura não é apenas forma objetual, mas movimento, fruição, trajetória, experiência\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o quadro de aberturas consolida, organiza e especifica?",
    "options": [
      "Portas e esquadrias, detalhando dimensões, materiais, tipologias e funções",
      "Exclusivamente o orçamento total da obra",
      "Apenas o cronograma de entrega do projeto",
      "Somente a equipe responsável pela execução"
    ],
    "correct_answer": "Portas e esquadrias, detalhando dimensões, materiais, tipologias e funções",
    "explanation": "O texto afirma que \"o quadro de aberturas reforça isso ao consolidar, organizar e especificar portas e esquadrias, detalhando dimensões, materiais, tipologias e funções\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo Ching (2015), citado no texto, quando a arquitetura se concretiza integralmente?",
    "options": [
      "Quando representação, técnica e intenção são coesivas",
      "Exclusivamente quando o orçamento é ilimitado",
      "Apenas quando o projeto é aprovado sem qualquer revisão",
      "Somente quando utiliza tecnologia BIM"
    ],
    "correct_answer": "Quando representação, técnica e intenção são coesivas",
    "explanation": "O texto afirma que \"Ching (2015) reforça que arquitetura só se concretiza integralmente quando representação, técnica e intenção são coesivas\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como as fachadas de edifícios culturais são caracterizadas, em vez de serem vistas como limites?",
    "options": [
      "Como interfaces narrativas capazes de comunicar valores, pertencimento e identidade",
      "Como elementos puramente decorativos sem função comunicativa",
      "Como barreiras que devem isolar o edifício do entorno",
      "Como elementos dispensáveis em projetos de baixo orçamento"
    ],
    "correct_answer": "Como interfaces narrativas capazes de comunicar valores, pertencimento e identidade",
    "explanation": "O texto afirma que \"as fachadas de edifícios culturais não são limites, mas interfaces narrativas capazes de comunicar valores, pertencimento e identidade\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que as rampas representam, segundo a leitura conjunta da NBR 9050 e NBR 6492 citadas nesta aula?",
    "options": [
      "A materialização objetiva da acessibilidade, funcionando como princípio gerador do espaço democrático, não como adendo",
      "Um custo adicional dispensável em projetos culturais pequenos",
      "Um elemento puramente estético sem função prática",
      "Uma exigência aplicável apenas a edifícios públicos federais"
    ],
    "correct_answer": "A materialização objetiva da acessibilidade, funcionando como princípio gerador do espaço democrático, não como adendo",
    "explanation": "O texto afirma que \"as rampas representam a materialização objetiva da acessibilidade. Elas não surgem como adendo, mas como princípio gerador do espaço democrático\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto (Ponto de Chegada), o que o plano de massas revela sobre o edifício?",
    "options": [
      "Como o edifício se insere no terreno e dialoga com o contexto",
      "Exclusivamente o valor final da obra",
      "Apenas a lista de materiais utilizados",
      "Somente o nome da equipe de projeto"
    ],
    "correct_answer": "Como o edifício se insere no terreno e dialoga com o contexto",
    "explanation": "O texto afirma que no plano de massas \"surgem volumetrias iniciais, relações de escala e organização espacial, revelando como o edifício se insere no terreno e dialoga com o contexto\"."
  }
];

const q_lesson_projeto_arquitetura_cultural_u3_p5 = [
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto (Ponto de Chegada), o que os diagramas funcionam como, sintetizando as intenções do arquiteto?",
    "options": [
      "Sínteses gráficas de fluxos, acessos, hierarquias, luz, sombreamento, conexões e setorização",
      "Documentos legais de aprovação municipal",
      "Orçamentos detalhados da obra",
      "Contratos com fornecedores de materiais"
    ],
    "correct_answer": "Sínteses gráficas de fluxos, acessos, hierarquias, luz, sombreamento, conexões e setorização",
    "explanation": "O texto afirma que \"os diagramas funcionam como sínteses gráficas das intenções do arquiteto: fluxos, acessos, hierarquias, luz, sombreamento, conexões, setorização\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o texto (Ponto de Chegada), o que a planta de implantação revela ao inserir o edifício no território?",
    "options": [
      "Recuos, acessos, fluxos e a relação com a paisagem",
      "Exclusivamente o valor de mercado do terreno",
      "Apenas o nome dos proprietários vizinhos",
      "Somente a data de aprovação do projeto"
    ],
    "correct_answer": "Recuos, acessos, fluxos e a relação com a paisagem",
    "explanation": "O texto afirma que \"a planta de implantação, por sua vez, insere o edifício no território, revelando recuos, acessos, fluxos e a relação com a paisagem\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_informatica_projecoes_ortogonais — Unidade 2 — Construção e Edição do Desenho (38 perguntas, fonte: q_informatica_projecoes_ortogonais_u2.json)
// ---------------------------------------------------------------------------
const q_lesson_informatica_projecoes_ortogonais_u2_p1 = [
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo Tuler (2013), citado no texto, o que o comando Line cria?",
    "options": [
      "Segmentos de reta",
      "Círculos preenchidos",
      "Curvas orgânicas suaves",
      "Polígonos regulares"
    ],
    "correct_answer": "Segmentos de reta",
    "explanation": "O texto afirma que o Line \"é o mais básico e, ao mesmo tempo, um dos mais importantes. Ele cria segmentos de reta (Tuler, 2013)\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Arc em uma planta baixa, além de representar portas curvas?",
    "options": [
      "Mostrar o raio de abertura da folha da porta, ajudando a avaliar a circulação e evitar colisão com móveis",
      "Exclusivamente decorar a fachada",
      "Apenas indicar a orientação do Norte",
      "Somente calcular a área do ambiente"
    ],
    "correct_answer": "Mostrar o raio de abertura da folha da porta, ajudando a avaliar a circulação e evitar colisão com móveis",
    "explanation": "O texto afirma que, ao usar Arc para o raio de abertura de uma porta, \"esse recurso não é apenas estético: ele ajuda a avaliar a circulação e evita que a porta colida com móveis ou paredes\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Rectangle garante ao criar retângulos a partir de dois pontos?",
    "options": [
      "Que todos os lados fiquem paralelos e perpendiculares, sem necessidade de múltiplas linhas",
      "Que o desenho seja automaticamente hachurado",
      "Que a escala seja ajustada automaticamente ao papel",
      "Que o objeto seja convertido em bloco"
    ],
    "correct_answer": "Que todos os lados fiquem paralelos e perpendiculares, sem necessidade de múltiplas linhas",
    "explanation": "O texto afirma que o Rectangle \"cria retângulos a partir de dois pontos... garante que todos os lados fiquem paralelos e perpendiculares, sem necessidade de múltiplas linhas\"."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que é necessário informar para desenhar um hexágono com o comando Polygon?",
    "options": [
      "O número de lados (6) e o raio do círculo que circunscreve a figura",
      "Apenas a área total desejada",
      "Somente o perímetro do polígono",
      "Exclusivamente a cor de preenchimento"
    ],
    "correct_answer": "O número de lados (6) e o raio do círculo que circunscreve a figura",
    "explanation": "O texto afirma que \"com o Polygon, basta informar o número de lados (6) e o raio do círculo que circunscreve a figura. O resultado é um hexágono perfeito\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual a diferença entre o comando Xline e o comando Ray?",
    "options": [
      "O Xline cria uma linha infinita nas duas direções; o Ray cria uma linha infinita em apenas uma direção a partir de um ponto inicial",
      "Ambos criam linhas de comprimento fixo, apenas com nomes diferentes",
      "O Xline é usado apenas em 3D; o Ray, apenas em 2D",
      "O Ray é usado exclusivamente para hachuras"
    ],
    "correct_answer": "O Xline cria uma linha infinita nas duas direções; o Ray cria uma linha infinita em apenas uma direção a partir de um ponto inicial",
    "explanation": "O texto afirma que o Xline \"cria linhas infinitas que atravessam toda a área de desenho\", enquanto o Ray \"também cria uma linha infinita, mas apenas em uma direção a partir de um ponto inicial\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo Rezende et al. (2022), citados no texto, para que serve o comando Spline (SPL)?",
    "options": [
      "Para criar curvas suaves e orgânicas, ajustando-se a pontos definidos pelo usuário",
      "Para desenhar exclusivamente círculos perfeitos",
      "Para criar linhas retas com espessura variável",
      "Para dividir um objeto em partes iguais"
    ],
    "correct_answer": "Para criar curvas suaves e orgânicas, ajustando-se a pontos definidos pelo usuário",
    "explanation": "O texto afirma que o Spline \"permite criar curvas suaves e orgânicas, ajustando-se a pontos definidos pelo usuário. Esse recurso é essencial para desenhos que exigem fluidez\" (Rezende et al., 2022)."
  },
  {
    "page": 5,
    "difficulty": "easy",
    "prompt": "Segundo o texto, qual comando permite desenhar elipses, com dois eixos de medida distintos?",
    "options": [
      "Ellipse",
      "Donut",
      "Point",
      "Mpolygon"
    ],
    "correct_answer": "Ellipse",
    "explanation": "O texto afirma que \"o Ellipse permite desenhar elipses, figuras semelhantes ao círculo, mas com dois eixos de medida distintos\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Point em um levantamento topográfico?",
    "options": [
      "Para marcar cada cota de nível, servindo de base para curvas de nível ou implantação de projetos",
      "Para desenhar círculos preenchidos indicando luminárias",
      "Para calcular a área de um terreno",
      "Para unir múltiplas linhas em uma polilinha"
    ],
    "correct_answer": "Para marcar cada cota de nível, servindo de base para curvas de nível ou implantação de projetos",
    "explanation": "O texto afirma que, \"ao levantar um terreno com pontos de topografia, você pode marcar cada cota com o comando Point. Esses pontos funcionam como base para curvas de nível ou para a implantação de projetos\"."
  },
  {
    "page": 8,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a principal vantagem do comando Polyline (PL) em relação à Line comum?",
    "options": [
      "Permite que múltiplas linhas e arcos se unam em uma única entidade, facilitando edições posteriores",
      "Cria apenas linhas curvas, nunca retas",
      "É usado exclusivamente para hachuras",
      "Não pode ser editada após criada"
    ],
    "correct_answer": "Permite que múltiplas linhas e arcos se unam em uma única entidade, facilitando edições posteriores",
    "explanation": "O texto afirma que \"diferentemente da Line comum, que cria segmentos independentes, a Polyline permite que múltiplas linhas e arcos se unam em uma única entidade. Isso facilita edições posteriores\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Donut no AutoCAD?",
    "options": [
      "Para criar círculos preenchidos ou com espessura, úteis para indicar pontos de iluminação embutida no teto",
      "Para desenhar exclusivamente elipses",
      "Para dividir uma linha em partes iguais",
      "Para transformar formas abertas em regiões sólidas"
    ],
    "correct_answer": "Para criar círculos preenchidos ou com espessura, úteis para indicar pontos de iluminação embutida no teto",
    "explanation": "O texto afirma que o Donut \"cria círculos preenchidos ou com espessura... na planta baixa de uma sala de reuniões, o Donut pode ser usado para indicar pontos de iluminação embutida no teto\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u2_p2 = [
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a diferença entre os comandos Divide e Measure?",
    "options": [
      "O Divide insere pontos igualmente espaçados dividindo em partes iguais; o Measure insere pontos usando uma distância fixa definida pelo usuário",
      "Ambos são idênticos, apenas com nomes diferentes",
      "O Divide funciona apenas em círculos; o Measure, apenas em retas",
      "O Measure é usado exclusivamente para calcular áreas"
    ],
    "correct_answer": "O Divide insere pontos igualmente espaçados dividindo em partes iguais; o Measure insere pontos usando uma distância fixa definida pelo usuário",
    "explanation": "O texto afirma que \"Divide: insere pontos igualmente espaçados em um objeto\", enquanto \"Measure insere pontos ao longo de um objeto, mas em vez de dividir em partes iguais, ele usa uma distância fixa\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Region no AutoCAD?",
    "options": [
      "Transforma formas abertas ou fechadas em regiões sólidas, que podem ser utilizadas em operações mais avançadas, como cálculo de área ou operações booleanas de modelagem 3D",
      "Insere pontos de marcação em coordenadas específicas",
      "Cria polígonos regulares com número definido de lados",
      "Divide um objeto em segmentos iguais"
    ],
    "correct_answer": "Transforma formas abertas ou fechadas em regiões sólidas, que podem ser utilizadas em operações mais avançadas, como cálculo de área ou operações booleanas de modelagem 3D",
    "explanation": "O texto afirma que o Region \"transforma formas abertas ou fechadas em regiões sólidas, que podem ser utilizadas em operações mais avançadas\", como cálculo de área ou operações booleanas."
  },
  {
    "page": 18,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Rotate?",
    "options": [
      "Para girar um objeto em torno de um ponto, alterando sua orientação",
      "Para deslocar um objeto sem alterar sua forma ou tamanho",
      "Para criar cópias exatas de um objeto",
      "Para apagar entidades indesejadas"
    ],
    "correct_answer": "Para girar um objeto em torno de um ponto, alterando sua orientação",
    "explanation": "O texto afirma que \"Rotate: gira um objeto em torno de um ponto, alterando sua orientação\"."
  },
  {
    "page": 19,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Copy?",
    "options": [
      "Para criar cópias exatas de um objeto, garantindo agilidade quando é necessário repetir elementos",
      "Para apagar entidades duplicadas",
      "Para girar um objeto em torno de um eixo",
      "Para medir a distância entre dois pontos"
    ],
    "correct_answer": "Para criar cópias exatas de um objeto, garantindo agilidade quando é necessário repetir elementos",
    "explanation": "O texto afirma que \"Copy: cria cópias exatas de um objeto. Ele garante agilidade quando precisamos repetir elementos\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Erase faz?",
    "options": [
      "Apaga entidades que não são mais necessárias, mantendo o desenho limpo",
      "Desloca objetos sem alterar sua forma",
      "Cria cópias exatas de um objeto",
      "Gira um objeto em torno de um ponto"
    ],
    "correct_answer": "Apaga entidades que não são mais necessárias, mantendo o desenho limpo",
    "explanation": "O texto afirma que \"Erase: O comando apaga entidades que não são mais necessárias, mantendo o desenho limpo\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo Tuler (2013), citado no texto, o que o comando Mirror faz?",
    "options": [
      "Reflete objetos em relação a um eixo, criando simetria automaticamente",
      "Cria cópias paralelas a uma distância determinada",
      "Insere pontos equidistantes em uma linha ou arco",
      "Une múltiplos segmentos em uma única polilinha"
    ],
    "correct_answer": "Reflete objetos em relação a um eixo, criando simetria automaticamente",
    "explanation": "O texto afirma que \"Mirror: reflete objetos em relação a um eixo, criando simetria automaticamente (Tuler, 2013)\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Offset, especialmente em representações de paredes?",
    "options": [
      "Cria cópias paralelas a uma distância determinada, útil para gerar as linhas paralelas de uma parede a partir de sua linha central, definindo a espessura",
      "Apaga entidades duplicadas automaticamente",
      "Gira objetos em torno de um eixo central",
      "Divide uma linha em segmentos numerados"
    ],
    "correct_answer": "Cria cópias paralelas a uma distância determinada, útil para gerar as linhas paralelas de uma parede a partir de sua linha central, definindo a espessura",
    "explanation": "O texto afirma que \"ao traçar a linha central de uma parede, use o Offset para gerar suas linhas paralelas, definindo a espessura do elemento construtivo\"."
  },
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Chamfer?",
    "options": [
      "Para criar um chanfrado — um corte reto em um canto que normalmente seria em ângulo reto, evitando quinas vivas",
      "Para suavizar curvas e splines em trajetórias orgânicas",
      "Para transformar linhas soltas em polilinhas",
      "Para medir a distância entre dois pontos"
    ],
    "correct_answer": "Para criar um chanfrado — um corte reto em um canto que normalmente seria em ângulo reto, evitando quinas vivas",
    "explanation": "O texto afirma que \"Chamfer: O comando é utilizado para criar um chanfrado, ou seja, um corte reto em um canto que normalmente seria em ângulo reto. Ele é especialmente útil... quando precisamos evitar quinas vivas\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Curves permite fazer, diferente do Chamfer?",
    "options": [
      "Editar curvas, arcos e splines, ajustando-os para criar fluidez e suavidade, sem ângulos abruptos",
      "Criar cortes retos em cantos de 90 graus",
      "Calcular a área de uma superfície fechada",
      "Inserir blocos de uma biblioteca"
    ],
    "correct_answer": "Editar curvas, arcos e splines, ajustando-os para criar fluidez e suavidade, sem ângulos abruptos",
    "explanation": "O texto afirma que \"Curves: permite editar curvas, arcos e splines... ajustando-os para criar fluidez e suavidade... sem linhas rígidas\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Pedit permite fazer com linhas soltas?",
    "options": [
      "Transformá-las em polilinhas, entidades únicas e contínuas, que podem ser suavizadas, unidas ou ter sua largura ajustada",
      "Apagá-las permanentemente do desenho",
      "Girá-las em torno de um ponto fixo",
      "Copiar suas propriedades para outros objetos"
    ],
    "correct_answer": "Transformá-las em polilinhas, entidades únicas e contínuas, que podem ser suavizadas, unidas ou ter sua largura ajustada",
    "explanation": "O texto afirma que \"o comando Pedit (Polyline Edit)... transforma linhas soltas em polilinhas, que são entidades únicas e contínuas... permite editar essas polilinhas: suavizar cantos, transformar em curvas, unir segmentos\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u2_p3 = [
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Oliveira, Costa e Baldam (2011), citados no texto, o que as opções Open, Close, Join e Width do comando Pedit fazem?",
    "options": [
      "Open abre uma polilinha fechada; Close fecha o traçado ligando o último ponto ao primeiro; Join une segmentos separados; Width define a espessura dos segmentos",
      "Todas realizam exatamente a mesma função de apagar objetos",
      "Servem exclusivamente para inserir hachuras",
      "Aplicam-se apenas a blocos, nunca a polilinhas"
    ],
    "correct_answer": "Open abre uma polilinha fechada; Close fecha o traçado ligando o último ponto ao primeiro; Join une segmentos separados; Width define a espessura dos segmentos",
    "explanation": "O texto descreve exatamente essas quatro funcionalidades do Pedit, segundo Oliveira, Costa e Baldam (2011)."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Distance (DIST)?",
    "options": [
      "Para medir a distância entre dois pontos no desenho",
      "Para calcular a área de uma superfície fechada",
      "Para copiar as propriedades gráficas de um objeto para outro",
      "Para unir múltiplos segmentos em uma polilinha"
    ],
    "correct_answer": "Para medir a distância entre dois pontos no desenho",
    "explanation": "O texto afirma que \"o comando distance é utilizado para medir a distância entre dois pontos no desenho\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Area fornece, além da metragem quadrada de uma superfície?",
    "options": [
      "O perímetro da região selecionada",
      "Exclusivamente o centro de massa do objeto",
      "Apenas o volume, quando aplicável a objetos 3D",
      "Somente a cor predominante da área"
    ],
    "correct_answer": "O perímetro da região selecionada",
    "explanation": "O texto afirma que, ao usar o Area, \"o AutoCAD fornecerá não só a metragem quadrada do piso, mas também o perímetro\"."
  },
  {
    "page": 33,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais informações o comando Mass Properties (MASSPROP) fornece sobre uma região fechada ou sólido?",
    "options": [
      "Centroide, momento de inércia, volume (se for 3D) e outras propriedades geométricas",
      "Exclusivamente a cor e o tipo de linha do objeto",
      "Apenas a data de criação do arquivo",
      "Somente o nome da camada (layer) do objeto"
    ],
    "correct_answer": "Centroide, momento de inércia, volume (se for 3D) e outras propriedades geométricas",
    "explanation": "O texto afirma que o Mass Properties \"oferece dados mais complexos sobre uma região fechada ou sólido... como centroide, momento de inércia ou volume\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Tuler (2013), citado no texto, o que o comando Match Properties permite?",
    "options": [
      "Copiar propriedades de um objeto, como cor ou espessura de linha, e aplicá-las em outros",
      "Medir a distância entre dois pontos",
      "Calcular a área e o perímetro de uma superfície",
      "Girar um objeto em torno de um ponto definido"
    ],
    "correct_answer": "Copiar propriedades de um objeto, como cor ou espessura de linha, e aplicá-las em outros",
    "explanation": "O texto afirma que \"o comando Match Properties permite copiar propriedades de um objeto e aplicá-las em outros (Tuler, 2013)\"."
  },
  {
    "page": 37,
    "difficulty": "hard",
    "prompt": "Segundo Oliveira, Baldam e Costa (2011), citados no texto, o que a opção \"Island Detection\" da caixa de diálogo Boundary Creation controla?",
    "options": [
      "Se o AutoCAD deve detectar áreas internas (\"ilhas\")",
      "Se o contorno será criado como região ou polilinha",
      "Quais objetos serão analisados para determinar os limites",
      "A distância entre as linhas paralelas geradas"
    ],
    "correct_answer": "Se o AutoCAD deve detectar áreas internas (\"ilhas\")",
    "explanation": "O texto afirma que \"Island Detection controla se o AutoCAD deve detectar áreas internas ('ilhas')\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando Stretch?",
    "options": [
      "Para estender ou encurtar porções selecionadas de um desenho, mantendo a continuidade, sem precisar refazer tudo",
      "Para apagar elementos indesejados do desenho",
      "Para criar cópias paralelas a uma distância fixa",
      "Para transformar um bloco em entidades individuais"
    ],
    "correct_answer": "Para estender ou encurtar porções selecionadas de um desenho, mantendo a continuidade, sem precisar refazer tudo",
    "explanation": "O texto afirma que \"o comando Stretch permite estender ou encurtar porções selecionadas, mantendo a continuidade do desenho\"."
  },
  {
    "page": 40,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Scale permite fazer, exemplificado com o fator 0.5?",
    "options": [
      "Reduzir um objeto à metade do seu tamanho original, de forma proporcional",
      "Girar um objeto em 0,5 grau",
      "Mover um objeto 0,5 metro para a direita",
      "Duplicar um objeto 0,5 vez"
    ],
    "correct_answer": "Reduzir um objeto à metade do seu tamanho original, de forma proporcional",
    "explanation": "O texto afirma: \"digite o fator de escala (por exemplo, 0.5, para reduzir à metade, ou 2, para dobrar o tamanho)\"."
  },
  {
    "page": 41,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que torna o comando Align uma das formas mais práticas de alinhar objetos?",
    "options": [
      "Pode inclusive escalar os objetos automaticamente durante o processo de alinhamento a pontos de referência",
      "Ele apenas apaga objetos desalinhados",
      "Ele funciona exclusivamente em desenhos 3D",
      "Ele substitui totalmente a necessidade do comando Move"
    ],
    "correct_answer": "Pode inclusive escalar os objetos automaticamente durante o processo de alinhamento a pontos de referência",
    "explanation": "O texto afirma que \"o comando Align é uma das formas mais práticas de alinhar objetos, podendo inclusive escalá-los automaticamente durante o processo\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a biblioteca de blocos representa para um projetista?",
    "options": [
      "Um acervo organizado de blocos prontos para serem utilizados, como um \"catálogo digital\" acessível a qualquer momento",
      "Um arquivo exclusivo de configurações de impressão",
      "Um comando usado apenas para calcular áreas",
      "Um tipo específico de hachura técnica"
    ],
    "correct_answer": "Um acervo organizado de blocos prontos para serem utilizados, como um \"catálogo digital\" acessível a qualquer momento",
    "explanation": "O texto afirma que \"uma biblioteca nada mais é do que um acervo organizado de blocos prontos para serem utilizados. Pense nela como uma espécie de 'catálogo digital'\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u2_p4 = [
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo Oliveira, Baldam e Costa (2011), citados no texto, qual é a principal vantagem de editar um bloco original em relação às suas cópias inseridas no projeto?",
    "options": [
      "Todas as instâncias do bloco se atualizam automaticamente, mantendo o projeto coerente e atualizado",
      "Apenas a primeira cópia inserida é atualizada",
      "É necessário editar cada cópia manualmente, uma a uma",
      "A edição do bloco original não afeta as cópias já inseridas"
    ],
    "correct_answer": "Todas as instâncias do bloco se atualizam automaticamente, mantendo o projeto coerente e atualizado",
    "explanation": "O texto afirma que, \"ao editar o bloco original, todas as cópias se atualizem automaticamente, mantendo o projeto coerente e atualizado (Oliveira; Baldam; Costa, 2011)\"."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que uma hachura pode indicar em um desenho técnico, além de embelezá-lo?",
    "options": [
      "O tipo de material, a textura de um piso, a diferenciação entre áreas internas e externas, ou a representação de cortes em plantas e seções",
      "Exclusivamente o nome do projetista responsável",
      "Apenas o valor de mercado do imóvel",
      "Somente a data de criação do arquivo"
    ],
    "correct_answer": "O tipo de material, a textura de um piso, a diferenciação entre áreas internas e externas, ou a representação de cortes em plantas e seções",
    "explanation": "O texto afirma que a hachura \"pode indicar o tipo de material, a textura de um piso, a diferenciação entre áreas internas e externas, ou até a representação de cortes em plantas e seções\"."
  },
  {
    "page": 49,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a principal norma técnica brasileira que orienta o uso de hachuras em desenho técnico, definindo significado, ângulo de inclinação e espaçamento das linhas?",
    "options": [
      "ABNT NBR 12298/1995",
      "ABNT NBR 6492/2021",
      "ABNT NBR 9050/2020",
      "ABNT NBR 15575/2021"
    ],
    "correct_answer": "ABNT NBR 12298/1995",
    "explanation": "O texto afirma que \"a principal norma que orienta o uso de hachuras é a ABNT NBR 12298/1995 – Representação de áreas cortadas e vistas em desenho técnico\"."
  },
  {
    "page": 50,
    "difficulty": "medium",
    "prompt": "Segundo a Tabela 1 do texto (tipos de hachura), como é representado o concreto/madeira/aço no desenho técnico?",
    "options": [
      "Linhas inclinadas a 45°, espaçadas regularmente",
      "Linhas onduladas ou ziguezague",
      "Linhas irregulares ou pontilhadas",
      "Linhas finas e espaçadas com cruzamentos diagonais"
    ],
    "correct_answer": "Linhas inclinadas a 45°, espaçadas regularmente",
    "explanation": "A Tabela 1 do texto associa a esses materiais estruturais a hachura de \"linhas inclinadas a 45°, espaçadas regularmente\"."
  },
  {
    "page": 50,
    "difficulty": "medium",
    "prompt": "Segundo a Tabela 1 do texto, como é representado o vidro (esquadrias, fachadas, divisórias transparentes) no desenho técnico?",
    "options": [
      "Linhas finas e espaçadas com cruzamentos diagonais",
      "Linhas inclinadas a 45°, espaçadas regularmente",
      "Linhas irregulares ou pontilhadas",
      "Linhas paralelas com traços duplos alternados"
    ],
    "correct_answer": "Linhas finas e espaçadas com cruzamentos diagonais",
    "explanation": "A Tabela 1 do texto associa ao vidro a hachura de \"linhas finas e espaçadas com cruzamentos diagonais\"."
  },
  {
    "page": 56,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Join faz com linhas, polilinhas ou arcos que estejam colineares ou conectados?",
    "options": [
      "Une-os, transformando várias partes em uma única entidade, facilitando o trabalho posterior (como mover ou aplicar hachura)",
      "Apaga-os permanentemente do desenho",
      "Divide-os em segmentos numerados iguais",
      "Transforma-os em blocos automaticamente"
    ],
    "correct_answer": "Une-os, transformando várias partes em uma única entidade, facilitando o trabalho posterior (como mover ou aplicar hachura)",
    "explanation": "O texto afirma que \"o Join é um comando que serve para unir linhas, polilinhas, arcos ou segmentos que estejam colineares ou conectados... transforma várias partes em uma única entidade\"."
  },
  {
    "page": 58,
    "difficulty": "medium",
    "prompt": "Segundo Tuler (2013), citado no texto, o que o comando Explode permite fazer com blocos, hachuras e polilinhas?",
    "options": [
      "\"Explodi-los\" em entidades individuais, permitindo editar cada parte separadamente",
      "Uni-los em uma única entidade contínua",
      "Copiá-los automaticamente para toda a prancha",
      "Calcular sua área e perímetro"
    ],
    "correct_answer": "\"Explodi-los\" em entidades individuais, permitindo editar cada parte separadamente",
    "explanation": "O texto afirma que \"esse comando permite 'explodir' blocos, hachuras e polilinhas em entidades individuais\" (Tuler, 2013)."
  },
  {
    "page": 58,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que se perde ao explodir um bloco no AutoCAD?",
    "options": [
      "A vantagem de atualização automática que esse recurso oferece",
      "A capacidade de aplicar cor ao objeto",
      "A possibilidade de movê-lo no desenho",
      "A escala original do desenho"
    ],
    "correct_answer": "A vantagem de atualização automática que esse recurso oferece",
    "explanation": "O texto afirma que \"quando você explodir um bloco, perde a vantagem de atualização automática que esse recurso oferece. Portanto, utilize-o apenas quando realmente precisar modificar partes específicas\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_informatica_projecoes_ortogonais — Unidade 3 — Configurações: Camadas, Textos e Cotas, Medição e List (33 perguntas, fonte: q_informatica_projecoes_ortogonais_u3.json)
// ---------------------------------------------------------------------------
const q_lesson_informatica_projecoes_ortogonais_u3_p1 = [
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que são as camadas (layers) no AutoCAD?",
    "options": [
      "Folhas transparentes sobrepostas, em que cada uma pode conter um tipo específico de informação do desenho",
      "Arquivos de configuração exclusivos para impressão",
      "Comandos usados apenas para medir distâncias",
      "Bibliotecas de blocos prontos para inserção"
    ],
    "correct_answer": "Folhas transparentes sobrepostas, em que cada uma pode conter um tipo específico de informação do desenho",
    "explanation": "O texto afirma que \"no AutoCAD, as camadas (layers) são como folhas transparentes sobrepostas, em que cada uma pode conter um tipo específico de informação do desenho\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando abre o Gerenciador de Propriedades de Camadas (Layer Properties Manager)?",
    "options": [
      "LAYER",
      "STYLE",
      "DIMSTYLE",
      "UNITS"
    ],
    "correct_answer": "LAYER",
    "explanation": "O texto afirma que \"você pode abri-lo digitando o comando LAYER na linha de comando ou clicando no ícone correspondente\"."
  },
  {
    "page": 5,
    "difficulty": "medium",
    "prompt": "Segundo Baldam, Costa e Oliveira (2015), citados no texto, quais são as configurações próprias que cada camada pode ter?",
    "options": [
      "Color, Linetype, Lineweight, Transparency e Plot",
      "Apenas nome e cor",
      "Somente espessura e transparência",
      "Exclusivamente o tipo de fonte de texto"
    ],
    "correct_answer": "Color, Linetype, Lineweight, Transparency e Plot",
    "explanation": "O texto lista exatamente essas cinco propriedades, segundo Baldam, Costa e Oliveira (2015)."
  },
  {
    "page": 6,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a diferença entre \"Off\" (desligar) e \"Freeze\" (congelar) uma camada?",
    "options": [
      "Ambas tornam a camada invisível, mas o congelamento também melhora o desempenho, pois a camada não é processada pelo AutoCAD",
      "São exatamente a mesma função com nomes diferentes",
      "O Off afeta apenas a impressão; o Freeze, apenas a tela",
      "O Freeze apaga permanentemente os objetos da camada"
    ],
    "correct_answer": "Ambas tornam a camada invisível, mas o congelamento também melhora o desempenho, pois a camada não é processada pelo AutoCAD",
    "explanation": "O texto afirma que \"Freeze / Thaw... é similar ao On/Off, mas com impacto no desempenho. Camadas congeladas não são processadas pelo AutoCAD, o que acelera o trabalho em arquivos pesados\"."
  },
  {
    "page": 7,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a opção \"Lock\" (bloquear) de uma camada impede?",
    "options": [
      "Alterações acidentais — permite visualizar, mas não editar os elementos da camada bloqueada",
      "Que a camada seja impressa",
      "Que a camada seja renomeada",
      "Que novos objetos sejam criados no desenho inteiro"
    ],
    "correct_answer": "Alterações acidentais — permite visualizar, mas não editar os elementos da camada bloqueada",
    "explanation": "O texto afirma que \"Lock / Unlock... impede alterações acidentais. Você pode visualizar, mas não editar os elementos da camada bloqueada\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a padronização de camadas, muitas vezes baseada na ABNT NBR 6492:2021, evita em projetos colaborativos?",
    "options": [
      "Que cada profissional nomeie e colorie as camadas de forma diferente, dificultando a leitura do projeto por outros colegas",
      "O uso de qualquer tipo de camada",
      "A necessidade de imprimir o projeto",
      "O uso de blocos e hachuras"
    ],
    "correct_answer": "Que cada profissional nomeie e colorie as camadas de forma diferente, dificultando a leitura do projeto por outros colegas",
    "explanation": "O texto afirma: \"imagine receber um projeto elétrico de um colega e não conseguir identificar onde estão os pontos de luz porque cada profissional nomeou e coloriu as camadas de forma diferente. Seria um caos!\"."
  },
  {
    "page": 13,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a função do comando LAYISO (Isolate Layer)?",
    "options": [
      "Isola a camada do(s) objeto(s) selecionado(s), ocultando todas as demais",
      "Bloqueia permanentemente a camada selecionada",
      "Congela todas as camadas do desenho",
      "Une várias camadas em uma só"
    ],
    "correct_answer": "Isola a camada do(s) objeto(s) selecionado(s), ocultando todas as demais",
    "explanation": "O texto afirma que \"LAYISO (Isolate Layer): isola a camada do(s) objeto(s) selecionado(s), ocultando todas as demais\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a diferença entre LAYOFF e LAYFRZ (Freeze Layer)?",
    "options": [
      "O LAYOFF apenas desliga a exibição; o LAYFRZ, além de desligar, melhora o desempenho em arquivos pesados, pois a camada não é processada",
      "Ambos têm exatamente a mesma função",
      "O LAYOFF afeta apenas a impressão; o LAYFRZ, apenas a tela",
      "O LAYFRZ apaga os objetos da camada"
    ],
    "correct_answer": "O LAYOFF apenas desliga a exibição; o LAYFRZ, além de desligar, melhora o desempenho em arquivos pesados, pois a camada não é processada",
    "explanation": "O texto afirma que \"LAYOFF: desliga a camada do objeto selecionado\" e \"LAYFRZ (Freeze Layer): congela a camada do objeto selecionado. Diferente de desligar, o congelamento melhora o desempenho em arquivos pesados\"."
  },
  {
    "page": 14,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando MATCHLAYER?",
    "options": [
      "Iguala a camada de um objeto à de outro, corrigindo rapidamente elementos que estão na camada errada",
      "Bloqueia uma camada contra edições",
      "Isola uma camada específica",
      "Calcula a área de uma camada"
    ],
    "correct_answer": "Iguala a camada de um objeto à de outro, corrigindo rapidamente elementos que estão na camada errada",
    "explanation": "O texto afirma que \"MATCHLAYER: iguala a camada de um objeto à de outro... selecione-o e use MATCHLAYER para colocá-lo na camada correta rapidamente\"."
  },
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quando a cotagem por face de referência (Baseline) é utilizada?",
    "options": [
      "Quando se deseja medir várias distâncias a partir de uma mesma linha de referência, criando cotas alinhadas com origem comum",
      "Quando se deseja indicar apenas coordenadas absolutas de um ponto",
      "Exclusivamente em projetos de paisagismo",
      "Somente para cotar elementos circulares"
    ],
    "correct_answer": "Quando se deseja medir várias distâncias a partir de uma mesma linha de referência, criando cotas alinhadas com origem comum",
    "explanation": "O texto afirma que a cotagem Baseline \"é utilizada quando se deseja medir várias distâncias a partir de uma mesma linha de referência (Tuler, 2013)... cria uma série de cotas alinhadas entre si, todas partindo da mesma origem\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u3_p2 = [
  {
    "page": 24,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando ativa a cotagem por face de referência (Baseline) no AutoCAD?",
    "options": [
      "DIMBASELINE",
      "DIMORDINATE",
      "DIMSTYLE",
      "DIST"
    ],
    "correct_answer": "DIMBASELINE",
    "explanation": "O texto afirma: \"nesse caso, o comando DIMBASELINE é o ideal\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo Baldam, Oliveira e Costa (2015), citados no texto, o que a cotagem por ordenadas (Ordinate) mostra, em vez de indicar distâncias entre pontos?",
    "options": [
      "As coordenadas absolutas de cada ponto em relação a uma origem (0,0)",
      "A área total de uma superfície fechada",
      "O perímetro de um polígono",
      "A espessura das linhas do desenho"
    ],
    "correct_answer": "As coordenadas absolutas de cada ponto em relação a uma origem (0,0)",
    "explanation": "O texto afirma que \"a cotagem Ordinate... mostra as coordenadas absolutas de cada ponto em relação a uma origem (0,0) (Baldam; Oliveira; Costa, 2015)\"."
  },
  {
    "page": 25,
    "difficulty": "medium",
    "prompt": "Segundo o texto, em que tipo de projeto a cotagem por ordenadas (Ordinate) é mais usada?",
    "options": [
      "Plantas de fabricação mecânica, projetos industriais e topografia",
      "Exclusivamente em projetos residenciais de pequeno porte",
      "Apenas em paisagismo",
      "Somente em projetos de interiores"
    ],
    "correct_answer": "Plantas de fabricação mecânica, projetos industriais e topografia",
    "explanation": "O texto afirma que \"esse tipo de cotagem é muito usado em planta de fabricação mecânica, projetos industriais e topografia\"."
  },
  {
    "page": 26,
    "difficulty": "hard",
    "prompt": "Segundo o texto, qual é a principal vantagem da cotagem Baseline em relação à consistência do desenho?",
    "options": [
      "Mesmo que uma das medidas internas sofra alterações, as demais permanecem precisas, já que a origem continua sendo a mesma",
      "Ela elimina totalmente a necessidade de conferência das medidas",
      "Ela substitui a necessidade de qualquer outro tipo de cotagem",
      "Ela é a única forma de cotagem aceita pela ABNT"
    ],
    "correct_answer": "Mesmo que uma das medidas internas sofra alterações, as demais permanecem precisas, já que a origem continua sendo a mesma",
    "explanation": "O texto afirma que \"a principal vantagem da cotagem Baseline é a coerência dimensional. Mesmo que uma das medidas internas sofra alterações, as demais permanecem precisas, já que a origem continua sendo a mesma\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto, qual é a altura recomendada para notas e cotas em desenhos de pequeno formato (A4 e A3)?",
    "options": [
      "2,5 mm",
      "7 mm",
      "3,5 mm a 5 mm",
      "10 mm"
    ],
    "correct_answer": "2,5 mm",
    "explanation": "O texto afirma: \"2,5 mm para notas e cotas em desenhos de pequeno formato (A4 e A3)\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto, qual é a altura recomendada para títulos de pranchas e cabeçalhos de projetos?",
    "options": [
      "7 mm ou mais",
      "2,5 mm",
      "1 mm",
      "Exatamente 3 mm, sem variação"
    ],
    "correct_answer": "7 mm ou mais",
    "explanation": "O texto afirma: \"7 mm ou mais para títulos de pranchas e cabeçalhos de projetos\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é usado para criar linhas de chamada no AutoCAD, definindo estilo de seta, espessura e tipo de texto associado?",
    "options": [
      "QLEADER ou MULTILEADER",
      "DIMBASELINE",
      "LAYISO",
      "MASSPROP"
    ],
    "correct_answer": "QLEADER ou MULTILEADER",
    "explanation": "O texto afirma que \"no AutoCAD, você pode criar linhas de chamada com o comando QLEADER ou MULTILEADER, definindo o estilo de seta, espessura da linha e tipo de texto associado\"."
  },
  {
    "page": 32,
    "difficulty": "medium",
    "prompt": "Segundo o texto, para que serve o comando TABLE no AutoCAD?",
    "options": [
      "Para criar tabelas que listam materiais, componentes, quantidades ou legendas, definindo linhas, colunas e estilo de texto",
      "Para desenhar círculos preenchidos",
      "Para calcular a área de um polígono",
      "Para unir múltiplas linhas em uma polilinha"
    ],
    "correct_answer": "Para criar tabelas que listam materiais, componentes, quantidades ou legendas, definindo linhas, colunas e estilo de texto",
    "explanation": "O texto afirma que \"as tabelas são indispensáveis para listar materiais, componentes, quantidades ou legendas. Elas são criadas com o comando TABLE... que permite definir o número de linhas e colunas, o tamanho das células e o estilo de texto\"."
  },
  {
    "page": 21,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Measure permite fazer de diferente em relação ao Divide?",
    "options": [
      "Permite definir a distância exata entre os pontos, e o AutoCAD calcula quantos pontos cabem ao longo do objeto",
      "Divide sempre em exatamente 2 partes iguais",
      "Funciona apenas em círculos, nunca em linhas retas",
      "Elimina a necessidade de qualquer medição posterior"
    ],
    "correct_answer": "Permite definir a distância exata entre os pontos, e o AutoCAD calcula quantos pontos cabem ao longo do objeto",
    "explanation": "O texto afirma que \"enquanto o Divide cria divisões iguais com base na quantidade de segmentos... o Measure permite que você defina a distância exata entre os pontos. Assim, o AutoCAD calcula automaticamente quantos pontos cabem ao longo do objeto\" (Oliveira; Baldam; Costa, 2011)."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo Baldam, Oliveira e Costa (2015), citados no texto, o que o comando List revela sobre um objeto selecionado?",
    "options": [
      "Tipo, camada, cor, comprimento, coordenadas iniciais e finais, área e raio (quando aplicável)",
      "Exclusivamente o nome do arquivo",
      "Apenas a data da última edição",
      "Somente o número de versão do AutoCAD"
    ],
    "correct_answer": "Tipo, camada, cor, comprimento, coordenadas iniciais e finais, área e raio (quando aplicável)",
    "explanation": "O texto afirma que o List \"apresenta dados detalhados sobre o objeto selecionado, como tipo, camada, cor, comprimento, coordenadas iniciais e finais, área e raio (no caso de arcos e círculos)\" (Baldam; Oliveira; Costa, 2015)."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u3_p3 = [
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o comando List aplicado a linhas de construção (XLINE) permite verificar qual informação, útil para conferir se dois eixos estão paralelos?",
    "options": [
      "A direção vetorial e o ângulo de inclinação de cada linha",
      "Exclusivamente a cor da linha",
      "Apenas o comprimento total do desenho",
      "Somente o nome do layer ativo"
    ],
    "correct_answer": "A direção vetorial e o ângulo de inclinação de cada linha",
    "explanation": "O texto afirma que, ao usar LIST em uma XLINE, \"observe os dados apresentados: ponto de origem, direção vetorial e ângulo de inclinação... se as direções e ângulos forem idênticos, as linhas estão perfeitamente paralelas\"."
  },
  {
    "page": 46,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 16752:2020, citada no texto, quais são as dimensões do formato A1?",
    "options": [
      "594 × 841 mm",
      "841 × 1189 mm",
      "420 × 594 mm",
      "297 × 420 mm"
    ],
    "correct_answer": "594 × 841 mm",
    "explanation": "O texto lista: \"A1: 594 × 841 mm\", conforme a ABNT NBR 16752:2020."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, onde o carimbo de um projeto deve ser posicionado, de modo que permaneça visível mesmo após o dobramento?",
    "options": [
      "No canto inferior direito da folha",
      "No canto superior esquerdo da folha",
      "No centro exato da prancha",
      "Na margem superior, ao lado do título"
    ],
    "correct_answer": "No canto inferior direito da folha",
    "explanation": "O texto afirma que o carimbo \"é sempre posicionado no canto inferior direito da folha, de modo que permaneça visível mesmo após o dobramento\"."
  },
  {
    "page": 48,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 16752:2020, citada no texto, como deve ser feito o dobramento das pranchas para arquivamento?",
    "options": [
      "De forma que o carimbo fique voltado para fora e o resultado final esteja no padrão do formato A4",
      "De forma aleatória, sem padrão definido",
      "Sempre em quatro dobras iguais, independentemente do formato original",
      "De modo que o carimbo fique sempre oculto, para proteção do documento"
    ],
    "correct_answer": "De forma que o carimbo fique voltado para fora e o resultado final esteja no padrão do formato A4",
    "explanation": "O texto afirma que \"o dobramento deve ser feito de forma que o carimbo fique sempre visível e o final esteja no padrão do formato A4\"."
  },
  {
    "page": 49,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as indicações mais comuns em uma planta de pavimento, segundo a NBR 6492:2021?",
    "options": [
      "Seta de orientação (Norte), símbolos de portas e janelas, cotas e eixos, e denominação dos ambientes",
      "Exclusivamente o nome do cliente e a data de entrega",
      "Apenas o valor total da obra",
      "Somente a assinatura do responsável técnico"
    ],
    "correct_answer": "Seta de orientação (Norte), símbolos de portas e janelas, cotas e eixos, e denominação dos ambientes",
    "explanation": "O texto lista exatamente essas indicações como \"as mais comuns\" em planta de pavimentos."
  },
  {
    "page": 53,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto (Tabela 1), qual é a altura recomendada para a denominação dos ambientes e marcação dos eixos?",
    "options": [
      "3,5 mm",
      "7,0 mm",
      "5,0 mm",
      "1,8 mm"
    ],
    "correct_answer": "3,5 mm",
    "explanation": "A Tabela 1 do texto associa 3,5 mm à \"denominação dos ambientes, marcação dos eixos, representação gráficas de acesso\"."
  },
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto (Tabela 1), qual é a altura recomendada para o título da prancha?",
    "options": [
      "7,0 mm",
      "3,5 mm",
      "2,5 mm",
      "1,8 mm"
    ],
    "correct_answer": "7,0 mm",
    "explanation": "A Tabela 1 do texto associa 7,0 mm ao \"título da prancha\"."
  },
  {
    "page": 54,
    "difficulty": "medium",
    "prompt": "Segundo o texto, como deve ser escrita a denominação de um ambiente, conforme a ABNT NBR 6492:2021?",
    "options": [
      "De forma legível, centralizada no ambiente, em letras maiúsculas, acompanhada da área útil em metros quadrados",
      "Em letras minúsculas, alinhada à esquerda, sem indicação de área",
      "Apenas com um número de código, sem nome descritivo",
      "Em qualquer posição do desenho, sem padronização"
    ],
    "correct_answer": "De forma legível, centralizada no ambiente, em letras maiúsculas, acompanhada da área útil em metros quadrados",
    "explanation": "O texto afirma que \"a denominação deve ser escrita de forma legível, centralizada no ambiente e utilizando letras maiúsculas... acompanhada da sua área útil, expressa em metros quadrados\"."
  },
  {
    "page": 58,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza uma \"planta humanizada\"?",
    "options": [
      "Uma representação gráfica produzida a partir da planta técnica, enriquecida com blocos, hachuras e texturas que simulam mobiliário, revestimentos, vegetação e pessoas",
      "Uma planta que substitui totalmente a necessidade de cotas técnicas",
      "Uma planta usada exclusivamente para aprovação em prefeituras",
      "Um tipo de planta que não pode ser criada no AutoCAD"
    ],
    "correct_answer": "Uma representação gráfica produzida a partir da planta técnica, enriquecida com blocos, hachuras e texturas que simulam mobiliário, revestimentos, vegetação e pessoas",
    "explanation": "O texto afirma que \"as plantas humanizadas são representações gráficas produzidas a partir das plantas técnicas, enriquecidas com blocos, hachuras e texturas que simulam mobiliário, revestimentos, vegetação, sombras e pessoas\"."
  },
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 12298:2021, citada no texto, como é representada a alvenaria em hachuras padronizadas?",
    "options": [
      "Linhas inclinadas contínuas",
      "Linhas cruzadas",
      "Traçado irregular ou pontilhado",
      "Linhas paralelas com espaçamento menor"
    ],
    "correct_answer": "Linhas inclinadas contínuas",
    "explanation": "O texto lista: \"Linhas inclinadas contínuas para alvenaria\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_u3_p4 = [
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 12298:2021, citada no texto, como é representado o concreto em hachuras padronizadas?",
    "options": [
      "Linhas cruzadas",
      "Linhas inclinadas contínuas",
      "Traçado irregular ou pontilhado",
      "Linhas onduladas"
    ],
    "correct_answer": "Linhas cruzadas",
    "explanation": "O texto lista: \"Linhas cruzadas para concreto\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que o comando Measure possibilita fazer?",
    "options": [
      "Marcar pontos ao longo de um objeto a partir de uma distância fixa definida pelo usuário, criando referências para marcações e módulos",
      "Calcular a área total de uma superfície fechada",
      "Listar todas as camadas do desenho",
      "Unir segmentos de linha em uma polilinha"
    ],
    "correct_answer": "Marcar pontos ao longo de um objeto a partir de uma distância fixa definida pelo usuário, criando referências para marcações e módulos",
    "explanation": "O texto afirma que \"o comando Measure possibilita marcar pontos ao longo de um objeto a partir de uma distância fixa definida pelo usuário, criando pontos de referência ideais para marcações, módulos e medições padronizadas\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo o texto, que tipo de informações o comando List revela sobre os elementos do desenho?",
    "options": [
      "Comprimento, coordenadas, camadas e propriedades geométricas, funcionando como um relatório técnico detalhado",
      "Exclusivamente o nome do autor do desenho",
      "Apenas a data de criação do arquivo",
      "Somente o tipo de impressora configurada"
    ],
    "correct_answer": "Comprimento, coordenadas, camadas e propriedades geométricas, funcionando como um relatório técnico detalhado",
    "explanation": "O texto afirma que o List \"revela uma riqueza de informações sobre os elementos do desenho — como comprimento, coordenadas, camadas e propriedades geométricas — funcionando como um relatório técnico detalhado\"."
  }
];

// ---------------------------------------------------------------------------
// track_s03_informatica_projecoes_ortogonais — Complementos de Comandos e Configurações (Unidades 2 e 3) (41 perguntas, fonte: q_informatica_projecoes_ortogonais_extra.json)
// ---------------------------------------------------------------------------
const q_lesson_informatica_projecoes_ortogonais_extra_p1 = [
  {
    "page": 37,
    "difficulty": "hard",
    "prompt": "Segundo Oliveira, Baldam e Costa (2011), citados no texto, o que a opção \"Object Type\" da caixa de diálogo Boundary Creation define?",
    "options": [
      "Se o limite será criado como região ou polilinha",
      "Se o AutoCAD deve detectar áreas internas (\"ilhas\")",
      "Quais objetos serão analisados para determinar os limites",
      "A distância entre linhas paralelas geradas pelo Offset"
    ],
    "correct_answer": "Se o limite será criado como região ou polilinha",
    "explanation": "O texto afirma que \"Object Type define se o limite será criado como região ou polilinha\"."
  },
  {
    "page": 37,
    "difficulty": "medium",
    "prompt": "Segundo Oliveira, Baldam e Costa (2011), citados no texto, para que serve a opção \"Boundary Set\" da caixa de diálogo Boundary Creation?",
    "options": [
      "Permite escolher quais objetos serão analisados para determinar os limites, otimizando o desempenho em desenhos complexos",
      "Define a cor do contorno gerado pelo comando",
      "Ativa a detecção automática de blocos no desenho",
      "Define a escala de impressão do desenho"
    ],
    "correct_answer": "Permite escolher quais objetos serão analisados para determinar os limites, otimizando o desempenho em desenhos complexos",
    "explanation": "O texto afirma que \"Boundary Set permite escolher quais objetos serão analisados para determinar os limites, otimizando o desempenho em desenhos complexos\"."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as vantagens práticas do uso de blocos e hachuras no AutoCAD?",
    "options": [
      "Agilidade, padronização, flexibilidade e clareza visual",
      "Exclusivamente redução do tamanho do arquivo",
      "Apenas compatibilidade com impressoras a laser",
      "Somente redução de custos de licença do software"
    ],
    "correct_answer": "Agilidade, padronização, flexibilidade e clareza visual",
    "explanation": "O texto lista exatamente essas quatro vantagens práticas do uso de blocos e hachuras."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é usado para inserir um bloco salvo em uma biblioteca no AutoCAD?",
    "options": [
      "INSERT",
      "LAYER",
      "STYLE",
      "HATCH"
    ],
    "correct_answer": "INSERT",
    "explanation": "O texto afirma: \"digite INSERT na linha de comando\" para inserir um bloco salvo."
  },
  {
    "page": 42,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são exemplos de padrões de hachura mencionados para representar concreto e tijolos no AutoCAD?",
    "options": [
      "AR-CONC (concreto) e AR-B816 (tijolos)",
      "HATCH-01 e HATCH-02",
      "SOLID e GRADIENT",
      "ANSI31 e ANSI32"
    ],
    "correct_answer": "AR-CONC (concreto) e AR-B816 (tijolos)",
    "explanation": "O texto afirma: \"escolha entre hachuras sólidas ou texturizadas (como AR-CONC para concreto ou AR-B816 para tijolos)\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o exercício resolvido do texto (croqui digital de uma sala comercial), qual comando foi utilizado para representar o balcão de atendimento curvo?",
    "options": [
      "Spline",
      "Rectangle",
      "Polygon",
      "Arc"
    ],
    "correct_answer": "Spline",
    "explanation": "O texto afirma: \"Para o balcão de atendimento, que possui uma forma curva, utilizamos o comando Spline\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o exercício resolvido do texto (croqui digital de uma sala comercial), qual comando foi utilizado para representar a recepção do espaço?",
    "options": [
      "Polygon",
      "Line",
      "Ellipse",
      "Donut"
    ],
    "correct_answer": "Polygon",
    "explanation": "O texto afirma: \"na representação da recepção, usamos o comando Polygon\"."
  },
  {
    "page": 28,
    "difficulty": "medium",
    "prompt": "Segundo o exercício resolvido do texto (jardim com curvas sinuosas), qual comando foi aplicado primeiro para suavizar as quinas da bancada de concreto?",
    "options": [
      "Chamfer",
      "Curves",
      "Pedit",
      "Offset"
    ],
    "correct_answer": "Chamfer",
    "explanation": "O texto afirma: \"começamos pela bancada de concreto... para ajustá-las, aplicamos o comando Chamfer\"."
  },
  {
    "page": 29,
    "difficulty": "medium",
    "prompt": "Segundo o exercício resolvido do texto (jardim com curvas sinuosas), qual comando foi utilizado para transformar as linhas retas soltas do caminho de circulação em um único traçado contínuo?",
    "options": [
      "Pedit",
      "Chamfer",
      "Curves",
      "Match Properties"
    ],
    "correct_answer": "Pedit",
    "explanation": "O texto afirma que, para o caminho, \"entra em cena o comando Pedit... o que antes eram traços soltos, agora é um único traçado contínuo\"."
  },
  {
    "page": 31,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre o comando Distance, qual medida o projetista precisava confirmar na parede de uma sala de estar para acomodar um sofá planejado?",
    "options": [
      "4,50 metros",
      "3,00 metros",
      "6,00 metros",
      "2,50 metros"
    ],
    "correct_answer": "4,50 metros",
    "explanation": "O texto afirma: \"imagine que você esteja projetando a planta de uma sala de estar e precise confirmar se a parede realmente possui 4,50 metros para acomodar um sofá planejado\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_extra_p2 = [
  {
    "page": 23,
    "difficulty": "medium",
    "prompt": "Segundo o texto, além de projetos arquitetônicos como bancadas de cozinha, em que outro campo o comando Chamfer também pode ser aplicado?",
    "options": [
      "Desenho mecânico, para suavizar arestas de peças",
      "Exclusivamente em projetos de paisagismo",
      "Apenas em desenhos topográficos",
      "Somente em plantas de instalações elétricas"
    ],
    "correct_answer": "Desenho mecânico, para suavizar arestas de peças",
    "explanation": "O texto afirma que \"esse recurso também pode ser usado em desenho mecânico, quando é necessário suavizar arestas de peças\"."
  },
  {
    "page": 56,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático integrado do texto (piso com revestimento cerâmico), por que o AutoCAD não reconhece o limite para aplicar hachura quando as linhas de rejunte estão soltas?",
    "options": [
      "Porque cada linha é um objeto independente até que sejam unidas com o comando Join",
      "Porque hachuras só funcionam em blocos, nunca em linhas soltas",
      "Porque o comando Join é obrigatório antes de qualquer desenho no AutoCAD",
      "Porque o AutoCAD exclui automaticamente linhas soltas do arquivo"
    ],
    "correct_answer": "Porque cada linha é um objeto independente até que sejam unidas com o comando Join",
    "explanation": "O texto afirma que \"o AutoCAD não reconhece o limite porque as linhas estão soltas\", sendo necessário \"usar o Join para unir o contorno em uma polilinha\" antes de aplicar a hachura."
  },
  {
    "page": 3,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre o comando Rectangle, quais dimensões são usadas para representar uma mesa de trabalho em planta baixa?",
    "options": [
      "1,20 m x 0,60 m",
      "2,00 m x 1,00 m",
      "0,80 m x 0,40 m",
      "1,50 m x 0,75 m"
    ],
    "correct_answer": "1,20 m x 0,60 m",
    "explanation": "O texto afirma: \"você pode usar o Rectangle e definir rapidamente o tamanho exato (por exemplo, 1,20 m x 0,60 m)\"."
  },
  {
    "page": 10,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre o comando Measure, a que distância os suportes metálicos de um corrimão devem ser posicionados?",
    "options": [
      "A cada 1,20 metro",
      "A cada 0,80 metro",
      "A cada 2,00 metros",
      "A cada 0,50 metro"
    ],
    "correct_answer": "A cada 1,20 metro",
    "explanation": "O texto afirma: \"o Measure pode ser usado para inserir pontos a cada 1,20 metro, indicando a posição exata de cada suporte\"."
  },
  {
    "page": 44,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto, qual é a vantagem de criar um bloco para o carimbo de uma prancha, em vez de redesenhá-lo em cada folha?",
    "options": [
      "Qualquer atualização no carimbo pode ser feita em um único arquivo de bloco, e todas as pranchas se atualizam automaticamente",
      "O carimbo deixa de ser necessário para aprovação do projeto",
      "A escala do carimbo muda automaticamente em cada folha, sem controle do usuário",
      "O bloco do carimbo não pode ser movido após inserido"
    ],
    "correct_answer": "Qualquer atualização no carimbo pode ser feita em um único arquivo de bloco, e todas as pranchas se atualizam automaticamente",
    "explanation": "O texto afirma: \"assim, qualquer atualização no carimbo pode ser feita em um único arquivo de bloco, e todas as pranchas se atualizam automaticamente\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo de padrão de nomenclatura de camadas apresentado no texto, o que a camada \"HID_TUBULACOES\" representa?",
    "options": [
      "Elementos do projeto hidráulico",
      "Elementos do projeto elétrico",
      "Elementos paisagísticos",
      "Elementos estruturais arquitetônicos"
    ],
    "correct_answer": "Elementos do projeto hidráulico",
    "explanation": "O texto lista \"HID_TUBULACOES – projeto hidráulico\" entre os exemplos de nomenclatura padronizada de camadas."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o texto, quais são as boas práticas recomendadas para a organização de camadas em um projeto?",
    "options": [
      "Manter padronização de nomes e cores, evitar criar camadas desnecessárias e adotar sempre o mesmo padrão em todos os desenhos",
      "Criar uma camada nova para cada objeto desenhado individualmente",
      "Usar cores aleatórias para tornar o desenho mais criativo",
      "Nomear as camadas apenas com números sequenciais, sem descrição"
    ],
    "correct_answer": "Manter padronização de nomes e cores, evitar criar camadas desnecessárias e adotar sempre o mesmo padrão em todos os desenhos",
    "explanation": "O texto afirma: \"mantenha uma padronização de nomes e cores, e evite criar camadas desnecessárias. Adote sempre o mesmo padrão para todos os seus desenhos\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que caracteriza a propriedade \"Plot\" de uma camada, exemplificada com uma camada chamada AUX_GUIDAS?",
    "options": [
      "Define se a camada será impressa ou não, permitindo que camadas auxiliares não apareçam na impressão final",
      "Define a cor da camada na impressão",
      "Ativa a camada automaticamente ao abrir o arquivo",
      "Bloqueia a camada contra qualquer edição"
    ],
    "correct_answer": "Define se a camada será impressa ou não, permitindo que camadas auxiliares não apareçam na impressão final",
    "explanation": "O texto afirma: \"Plot (Impressão): define se a camada será impressa ou não. Exemplo: Uma camada auxiliar chamada AUX_GUIDAS pode ser configurada para não ser impressa\"."
  },
  {
    "page": 9,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto, qual percentual de transparência é sugerido para suavizar o efeito visual ao representar vegetação sobreposta ao piso?",
    "options": [
      "50%",
      "25%",
      "75%",
      "10%"
    ],
    "correct_answer": "50%",
    "explanation": "O texto afirma: \"ao representar uma vegetação sobre o piso, use transparência 50% para suavizar o efeito visual\"."
  },
  {
    "page": 30,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto, qual comando é usado para criar um novo estilo de linha de chamada (leader), como o estilo \"Iluminação\"?",
    "options": [
      "MLEADERSTYLE",
      "QLEADER",
      "DIMSTYLE",
      "STYLE"
    ],
    "correct_answer": "MLEADERSTYLE",
    "explanation": "O texto afirma: \"digite MLEADERSTYLE e crie um novo estilo chamado 'Iluminação'\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_extra_p3 = [
  {
    "page": 35,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual opção do comando TABLE permite criar uma tabela vazia para ser preenchida manualmente com dados como espécie, quantidade e observações?",
    "options": [
      "\"From Empty Table\"",
      "\"Insert Table Link\"",
      "\"From a Data Link\"",
      "\"Start from Existing Table\""
    ],
    "correct_answer": "\"From Empty Table\"",
    "explanation": "O texto afirma: \"digite TABLE e selecione 'From Empty Table'\"."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual comando é utilizado para substituir cotas antigas por um novo estilo de cota (DIMSTYLE) já criado?",
    "options": [
      "DIMUPDATE",
      "DIMBASELINE",
      "DIMORDINATE",
      "DIMSTYLE"
    ],
    "correct_answer": "DIMUPDATE",
    "explanation": "O texto afirma: \"substitua as cotas antigas pelo novo estilo com o comando DIMUPDATE\"."
  },
  {
    "page": 22,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre linhas de construção, qual espaçamento foi definido para posicionar pilares ao longo de um eixo de 20 metros de uma marquise metálica?",
    "options": [
      "2,50 metros",
      "3,00 metros",
      "1,50 metro",
      "5,00 metros"
    ],
    "correct_answer": "2,50 metros",
    "explanation": "O texto afirma: \"você está desenhando a planta estrutural de uma marquise metálica e precisa posicionar pilares a cada 2,50 metros ao longo de um eixo de 20 metros\"."
  },
  {
    "page": 26,
    "difficulty": "hard",
    "prompt": "Segundo o exemplo do texto sobre um projeto de pavilhão de eventos, qual era o comprimento total do eixo principal e o espaçamento definido entre as colunas metálicas?",
    "options": [
      "24 metros de comprimento total, com colunas a cada 3 metros",
      "30 metros de comprimento total, com colunas a cada 5 metros",
      "12 metros de comprimento total, com colunas a cada 2 metros",
      "50 metros de comprimento total, com colunas a cada 10 metros"
    ],
    "correct_answer": "24 metros de comprimento total, com colunas a cada 3 metros",
    "explanation": "O texto afirma: \"o eixo principal do pavilhão possui 24 metros de comprimento, e as colunas devem ser distribuídas a cada 3 metros\"."
  },
  {
    "page": 20,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre o comando Measure, qual era a extensão total da calçada e o espaçamento definido entre os postes de iluminação de um jardim linear?",
    "options": [
      "30 metros de extensão, com postes a cada 3 metros",
      "24 metros de extensão, com postes a cada 4 metros",
      "15 metros de extensão, com postes a cada 1,5 metro",
      "50 metros de extensão, com postes a cada 5 metros"
    ],
    "correct_answer": "30 metros de extensão, com postes a cada 3 metros",
    "explanation": "O texto afirma: \"distribuir postes de iluminação a cada 3 metros ao longo de uma calçada com 30 metros de extensão\"."
  },
  {
    "page": 26,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual é a diferença de papel entre os comandos Measure e List quando usados de forma integrada em linhas de construção?",
    "options": [
      "O Measure ajuda a planejar e distribuir elementos; o List serve para verificar e validar o que foi desenhado",
      "Ambos têm exatamente a mesma função de medição de distâncias",
      "O Measure só funciona em objetos 3D; o List, apenas em 2D",
      "O List substitui totalmente a necessidade do comando Measure"
    ],
    "correct_answer": "O Measure ajuda a planejar e distribuir elementos; o List serve para verificar e validar o que foi desenhado",
    "explanation": "O texto afirma: \"enquanto o Measure ajuda a planejar e distribuir elementos, o List serve para verificar e validar o que foi desenhado\"."
  },
  {
    "page": 54,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto, como deve ser expressa e arredondada a área útil ao lado do nome do ambiente em uma planta?",
    "options": [
      "Em metros quadrados, arredondada para duas casas decimais",
      "Em centímetros quadrados, sem arredondamento",
      "Em metros quadrados, arredondada para número inteiro",
      "Em polegadas quadradas, com três casas decimais"
    ],
    "correct_answer": "Em metros quadrados, arredondada para duas casas decimais",
    "explanation": "O texto afirma que a área útil deve ser \"expressa em metros quadrados e arredondada para duas casas decimais — por exemplo: SALA DE ESTAR – 18,25 m²\"."
  },
  {
    "page": 54,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que se deve fazer quando um ambiente integrado possui subdivisões com funções distintas, como cozinha e sala de jantar, mesmo sem paredes divisórias?",
    "options": [
      "Denominá-las separadamente, cada uma com seu próprio nome",
      "Usar um único nome genérico para todo o espaço integrado",
      "Omitir a denominação dessas áreas no desenho",
      "Denominar apenas a maior das duas áreas"
    ],
    "correct_answer": "Denominá-las separadamente, cada uma com seu próprio nome",
    "explanation": "O texto afirma que, \"quando um ambiente possui subdivisões com funções distintas, é importante denominá-las separadamente. Por exemplo, em um espaço integrado é possível nomear 'COZINHA' e 'SALA DE JANTAR' de forma independente\"."
  },
  {
    "page": 58,
    "difficulty": "medium",
    "prompt": "Segundo o texto, além do AutoCAD, quais outras ferramentas são citadas como usadas na criação de plantas humanizadas, em modelagem e pós-produção?",
    "options": [
      "SketchUp, Photoshop e Lumion",
      "Excel, Word e PowerPoint",
      "Revit, Navisworks e BIM 360 apenas",
      "Illustrator, InDesign e Premiere"
    ],
    "correct_answer": "SketchUp, Photoshop e Lumion",
    "explanation": "O texto afirma que as plantas humanizadas \"são criadas tanto em softwares como o AutoCAD, quanto em ferramentas de modelagem e pós-produção, como SketchUp®, Photoshop® ou Lumion®\"."
  },
  {
    "page": 60,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre uma planta de jardim de inverno, o que a hachura verde irregular e a hachura bege com linhas finas indicam, respectivamente?",
    "options": [
      "Vegetação e piso em pedra natural",
      "Concreto e vidro",
      "Alvenaria e madeira",
      "Água e areia"
    ],
    "correct_answer": "Vegetação e piso em pedra natural",
    "explanation": "O texto afirma: \"aplicar hachura verde irregular indica vegetação, enquanto uma hachura em tom bege com linhas finas representa o piso em pedra natural\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_extra_p4 = [
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual norma da ABNT estabelece como cotar corretamente um desenho técnico, incluindo disposição, orientação e legibilidade das cotas?",
    "options": [
      "ABNT NBR 10126:2021",
      "ABNT NBR 6492:2021",
      "ABNT NBR 16861:2020",
      "ABNT NBR 9050:2020"
    ],
    "correct_answer": "ABNT NBR 10126:2021",
    "explanation": "O texto afirma: \"ABNT NBR 10126:2021 – Cotagem em Desenho Técnico: estabelece como cotar corretamente, incluindo a disposição, orientação e legibilidade das cotas\"."
  },
  {
    "page": 17,
    "difficulty": "medium",
    "prompt": "Segundo o texto, qual norma da ABNT determina os requisitos para a representação de linhas e escrita em desenhos técnicos?",
    "options": [
      "ABNT NBR 16861:2020",
      "ABNT NBR 10126:2021",
      "ABNT NBR 12298:2021",
      "ABNT NBR 6492:2021"
    ],
    "correct_answer": "ABNT NBR 16861:2020",
    "explanation": "O texto afirma: \"ABNT NBR 16861:2020 – Desenho técnico – Requisitos para representação de linhas e escritas: determina os requisitos para a representação de linhas e escrita em desenhos técnicos\"."
  },
  {
    "page": 4,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto, para que se usa o comando Ray ao desenhar a inclinação de uma rampa?",
    "options": [
      "Para projetar uma linha de referência a partir de um ponto de origem, auxiliando no controle de ângulos e inclinações",
      "Para calcular automaticamente a inclinação máxima permitida por norma",
      "Para desenhar a rampa já com material hachurado",
      "Para medir a distância entre o início e o fim da rampa"
    ],
    "correct_answer": "Para projetar uma linha de referência a partir de um ponto de origem, auxiliando no controle de ângulos e inclinações",
    "explanation": "O texto afirma: \"ao desenhar a inclinação de uma rampa, você pode usar o Ray a partir de um ponto de origem, projetando a linha até onde for necessário. Essa técnica auxilia no controle de ângulos e inclinações\"."
  },
  {
    "page": 39,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto sobre o comando Stretch, para qual nova largura uma sala de 3 m precisava ser ampliada, sem alterar as demais partes da planta?",
    "options": [
      "3,50 m",
      "4,00 m",
      "3,25 m",
      "5,00 m"
    ],
    "correct_answer": "3,50 m",
    "explanation": "O texto afirma: \"imagine uma sala projetada com 3 m de largura que precisa ser ampliada para 3,50 m sem alterar outras partes da planta\"."
  },
  {
    "page": 11,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo de padrão de nomenclatura de camadas do texto, o que a camada \"ARQ_MOBILIARIO\" representa?",
    "options": [
      "Blocos e elementos de decoração",
      "Elementos arquitetônicos estruturais",
      "Vãos e esquadrias",
      "Elementos paisagísticos"
    ],
    "correct_answer": "Blocos e elementos de decoração",
    "explanation": "O texto lista \"ARQ_MOBILIARIO – blocos e elementos de decoração\" entre os exemplos de nomenclatura padronizada de camadas."
  },
  {
    "page": 45,
    "difficulty": "medium",
    "prompt": "Segundo o exemplo prático do texto, qual opção deve ser ativada no estilo de cota para que o AutoCAD redimensione automaticamente texto e setas conforme a escala definida?",
    "options": [
      "Anotative",
      "Freeze",
      "Isolate",
      "Explode"
    ],
    "correct_answer": "Anotative",
    "explanation": "O texto afirma: \"ative a opção Anotative para que o AutoCAD redimensione automaticamente o texto e as setas conforme a escala definida\"."
  },
  {
    "page": 47,
    "difficulty": "easy",
    "prompt": "Segundo o texto, a que o carimbo de uma prancha técnica é comparado, por reunir as informações de identificação do projeto?",
    "options": [
      "Ao \"RG do projeto\"",
      "A uma \"impressão digital\"",
      "A um \"código de barras\"",
      "A uma \"assinatura eletrônica\""
    ],
    "correct_answer": "Ao \"RG do projeto\"",
    "explanation": "O texto afirma: \"já o carimbo é o 'RG do projeto'... nele constam informações fundamentais, como o nome do profissional responsável, título do projeto, número da prancha, escala, data e revisão\"."
  },
  {
    "page": 47,
    "difficulty": "medium",
    "prompt": "Segundo o texto, o que a borda de uma prancha técnica deve ter, para reforçar o aspecto profissional do desenho?",
    "options": [
      "Largura constante e distanciamento uniforme das margens",
      "Cores diferentes a cada prancha",
      "Espessura variável conforme o conteúdo desenhado",
      "Apenas linhas tracejadas, nunca contínuas"
    ],
    "correct_answer": "Largura constante e distanciamento uniforme das margens",
    "explanation": "O texto afirma: \"a borda deve ter largura constante e distanciamento uniforme das margens, criando um campo interno onde ficam os desenhos, cotas e textos\"."
  },
  {
    "page": 16,
    "difficulty": "medium",
    "prompt": "Segundo o texto, no resumo do exercício de croqui digital, qual é o papel atribuído à Polyline no conjunto de comandos utilizados?",
    "options": [
      "Integrar os diferentes elementos desenhados em uma entidade coesa",
      "Medir a distância entre dois pontos",
      "Calcular a área total do desenho",
      "Bloquear a camada principal do projeto"
    ],
    "correct_answer": "Integrar os diferentes elementos desenhados em uma entidade coesa",
    "explanation": "O texto afirma: \"o Line define, o Arc complementa, o Rectangle organiza, o Polygon simboliza, o Xline e o Ray alinham, o Spline flexibiliza e a Polyline integra\"."
  },
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto (Tabela 1), qual é a altura recomendada para a denominação/título do desenho?",
    "options": [
      "5,0 mm",
      "7,0 mm",
      "3,5 mm",
      "2,5 mm"
    ],
    "correct_answer": "5,0 mm",
    "explanation": "A Tabela 1 do texto associa 5,0 mm à \"denominação/título do desenho\"."
  }
];

const q_lesson_informatica_projecoes_ortogonais_extra_p5 = [
  {
    "page": 52,
    "difficulty": "medium",
    "prompt": "Segundo a ABNT NBR 6492:2021, citada no texto (Tabela 1), quando se utiliza a altura de 1,8 mm para textos e algarismos?",
    "options": [
      "Para numeração dos espelhos e demais informações quando não houver espaço para altura de 2,5 mm",
      "Para títulos de prancha, sempre",
      "Para denominação dos ambientes",
      "Exclusivamente para cotas de nível"
    ],
    "correct_answer": "Para numeração dos espelhos e demais informações quando não houver espaço para altura de 2,5 mm",
    "explanation": "A Tabela 1 do texto associa 1,8 mm à \"numeração dos espelhos e demais informações quando não houver espaço para utilizar a altura de 2,5mm\"."
  }
];

const lessons = [
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u1_p1", unitTitle: "Unidade 1 — Construção Civil e Desenvolvimento Sustentável (1/5)", questions: q_lesson_construcoes_sustentaveis_u1_p1 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u1_p2", unitTitle: "Unidade 1 — Construção Civil e Desenvolvimento Sustentável (2/5)", questions: q_lesson_construcoes_sustentaveis_u1_p2 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u1_p3", unitTitle: "Unidade 1 — Construção Civil e Desenvolvimento Sustentável (3/5)", questions: q_lesson_construcoes_sustentaveis_u1_p3 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u1_p4", unitTitle: "Unidade 1 — Construção Civil e Desenvolvimento Sustentável (4/5)", questions: q_lesson_construcoes_sustentaveis_u1_p4 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u1_p5", unitTitle: "Unidade 1 — Construção Civil e Desenvolvimento Sustentável (5/5)", questions: q_lesson_construcoes_sustentaveis_u1_p5 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u2_p1", unitTitle: "Unidade 2 — Planejamento e Viabilidade da Implantação de Empreendimentos (1/4)", questions: q_lesson_construcoes_sustentaveis_u2_p1 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u2_p2", unitTitle: "Unidade 2 — Planejamento e Viabilidade da Implantação de Empreendimentos (2/4)", questions: q_lesson_construcoes_sustentaveis_u2_p2 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u2_p3", unitTitle: "Unidade 2 — Planejamento e Viabilidade da Implantação de Empreendimentos (3/4)", questions: q_lesson_construcoes_sustentaveis_u2_p3 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u2_p4", unitTitle: "Unidade 2 — Planejamento e Viabilidade da Implantação de Empreendimentos (4/4)", questions: q_lesson_construcoes_sustentaveis_u2_p4 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u4_p1", unitTitle: "Unidade 4 — Diretrizes para Sustentabilidade das Edificações (1/4)", questions: q_lesson_construcoes_sustentaveis_u4_p1 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u4_p2", unitTitle: "Unidade 4 — Diretrizes para Sustentabilidade das Edificações (2/4)", questions: q_lesson_construcoes_sustentaveis_u4_p2 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u4_p3", unitTitle: "Unidade 4 — Diretrizes para Sustentabilidade das Edificações (3/4)", questions: q_lesson_construcoes_sustentaveis_u4_p3 },
  { trackId: "track_s01_construcoes_sustentaveis", lessonId: "lesson_construcoes_sustentaveis_u4_p4", unitTitle: "Unidade 4 — Diretrizes para Sustentabilidade das Edificações (4/4)", questions: q_lesson_construcoes_sustentaveis_u4_p4 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u1_p1", unitTitle: "Unidade 1 — Introdução ao Desenho de Arquitetura e Urbanismo (1/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u1_p1 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u1_p2", unitTitle: "Unidade 1 — Introdução ao Desenho de Arquitetura e Urbanismo (2/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u1_p2 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u1_p3", unitTitle: "Unidade 1 — Introdução ao Desenho de Arquitetura e Urbanismo (3/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u1_p3 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u1_p4", unitTitle: "Unidade 1 — Introdução ao Desenho de Arquitetura e Urbanismo (4/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u1_p4 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u2_p1", unitTitle: "Unidade 2 — Representação de Plantas (1/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u2_p1 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u2_p2", unitTitle: "Unidade 2 — Representação de Plantas (2/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u2_p2 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u2_p3", unitTitle: "Unidade 2 — Representação de Plantas (3/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u2_p3 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u2_p4", unitTitle: "Unidade 2 — Representação de Plantas (4/4)", questions: q_lesson_desenho_arquitetura_urbanismo_u2_p4 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u3_p1", unitTitle: "Unidade 3 — Representação de Cortes e Fachadas (1/5)", questions: q_lesson_desenho_arquitetura_urbanismo_u3_p1 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u3_p2", unitTitle: "Unidade 3 — Representação de Cortes e Fachadas (2/5)", questions: q_lesson_desenho_arquitetura_urbanismo_u3_p2 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u3_p3", unitTitle: "Unidade 3 — Representação de Cortes e Fachadas (3/5)", questions: q_lesson_desenho_arquitetura_urbanismo_u3_p3 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u3_p4", unitTitle: "Unidade 3 — Representação de Cortes e Fachadas (4/5)", questions: q_lesson_desenho_arquitetura_urbanismo_u3_p4 },
  { trackId: "track_s02_desenho_arquitetura_urbanismo", lessonId: "lesson_desenho_arquitetura_urbanismo_u3_p5", unitTitle: "Unidade 3 — Representação de Cortes e Fachadas (5/5)", questions: q_lesson_desenho_arquitetura_urbanismo_u3_p5 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u1_p1", unitTitle: "Unidade 1 — Metodologia de Projeto e Criatividade (1/4)", questions: q_lesson_projeto_arquitetura_cultural_u1_p1 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u1_p2", unitTitle: "Unidade 1 — Metodologia de Projeto e Criatividade (2/4)", questions: q_lesson_projeto_arquitetura_cultural_u1_p2 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u1_p3", unitTitle: "Unidade 1 — Metodologia de Projeto e Criatividade (3/4)", questions: q_lesson_projeto_arquitetura_cultural_u1_p3 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u1_p4", unitTitle: "Unidade 1 — Metodologia de Projeto e Criatividade (4/4)", questions: q_lesson_projeto_arquitetura_cultural_u1_p4 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u2_p1", unitTitle: "Unidade 2 — Informações Iniciais de Projeto (1/4)", questions: q_lesson_projeto_arquitetura_cultural_u2_p1 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u2_p2", unitTitle: "Unidade 2 — Informações Iniciais de Projeto (2/4)", questions: q_lesson_projeto_arquitetura_cultural_u2_p2 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u2_p3", unitTitle: "Unidade 2 — Informações Iniciais de Projeto (3/4)", questions: q_lesson_projeto_arquitetura_cultural_u2_p3 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u2_p4", unitTitle: "Unidade 2 — Informações Iniciais de Projeto (4/4)", questions: q_lesson_projeto_arquitetura_cultural_u2_p4 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u3_p1", unitTitle: "Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (1/5)", questions: q_lesson_projeto_arquitetura_cultural_u3_p1 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u3_p2", unitTitle: "Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (2/5)", questions: q_lesson_projeto_arquitetura_cultural_u3_p2 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u3_p3", unitTitle: "Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (3/5)", questions: q_lesson_projeto_arquitetura_cultural_u3_p3 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u3_p4", unitTitle: "Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (4/5)", questions: q_lesson_projeto_arquitetura_cultural_u3_p4 },
  { trackId: "track_s03_projeto_arquitetura_cultural", lessonId: "lesson_projeto_arquitetura_cultural_u3_p5", unitTitle: "Unidade 3 — Elaboração das Plantas, Cortes e Fachadas de Projeto (5/5)", questions: q_lesson_projeto_arquitetura_cultural_u3_p5 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u2_p1", unitTitle: "Unidade 2 — Construção e Edição do Desenho (1/4)", questions: q_lesson_informatica_projecoes_ortogonais_u2_p1 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u2_p2", unitTitle: "Unidade 2 — Construção e Edição do Desenho (2/4)", questions: q_lesson_informatica_projecoes_ortogonais_u2_p2 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u2_p3", unitTitle: "Unidade 2 — Construção e Edição do Desenho (3/4)", questions: q_lesson_informatica_projecoes_ortogonais_u2_p3 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u2_p4", unitTitle: "Unidade 2 — Construção e Edição do Desenho (4/4)", questions: q_lesson_informatica_projecoes_ortogonais_u2_p4 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u3_p1", unitTitle: "Unidade 3 — Configurações: Camadas, Textos e Cotas, Medição e List (1/4)", questions: q_lesson_informatica_projecoes_ortogonais_u3_p1 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u3_p2", unitTitle: "Unidade 3 — Configurações: Camadas, Textos e Cotas, Medição e List (2/4)", questions: q_lesson_informatica_projecoes_ortogonais_u3_p2 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u3_p3", unitTitle: "Unidade 3 — Configurações: Camadas, Textos e Cotas, Medição e List (3/4)", questions: q_lesson_informatica_projecoes_ortogonais_u3_p3 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_u3_p4", unitTitle: "Unidade 3 — Configurações: Camadas, Textos e Cotas, Medição e List (4/4)", questions: q_lesson_informatica_projecoes_ortogonais_u3_p4 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_extra_p1", unitTitle: "Complementos de Comandos e Configurações (Unidades 2 e 3) (1/5)", questions: q_lesson_informatica_projecoes_ortogonais_extra_p1 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_extra_p2", unitTitle: "Complementos de Comandos e Configurações (Unidades 2 e 3) (2/5)", questions: q_lesson_informatica_projecoes_ortogonais_extra_p2 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_extra_p3", unitTitle: "Complementos de Comandos e Configurações (Unidades 2 e 3) (3/5)", questions: q_lesson_informatica_projecoes_ortogonais_extra_p3 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_extra_p4", unitTitle: "Complementos de Comandos e Configurações (Unidades 2 e 3) (4/5)", questions: q_lesson_informatica_projecoes_ortogonais_extra_p4 },
  { trackId: "track_s03_informatica_projecoes_ortogonais", lessonId: "lesson_informatica_projecoes_ortogonais_extra_p5", unitTitle: "Complementos de Comandos e Configurações (Unidades 2 e 3) (5/5)", questions: q_lesson_informatica_projecoes_ortogonais_extra_p5 },
];

let totalQuestions = 0;
lessons.forEach((l) => {
  const questionIds = upsertQuestions(l.lessonId, l.questions);
  upsertLesson(l.lessonId, l.trackId, l.unitTitle, questionIds);
  ensureLessonInTrackUnits(l.trackId, l.lessonId, l.unitTitle);
  totalQuestions += l.questions.length;
});

print(`${lessons.length} lições processadas, ${totalQuestions} perguntas (pending — rodar cmd/review-questions antes de ficarem jogáveis).`);
