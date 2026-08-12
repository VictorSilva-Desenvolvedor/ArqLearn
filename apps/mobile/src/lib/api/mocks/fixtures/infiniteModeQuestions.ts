import type { InfiniteModeQuestion } from "@/types/api";
import type { ThemeTopic } from "./themes";

export interface InfiniteModeQuestionEntry {
  question: InfiniteModeQuestion;
  correctOptionId: string;
}

// Banco "difícil" por tema — Modo Infinito usa perguntas de dificuldade elevada por design. Um
// banco por tema do catálogo em themes.ts. Espelha
// apps/web/src/lib/api/mocks/fixtures/infiniteModeQuestions.ts.

const fundamentosBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-fundamentos-1",
      prompt: "Qual elemento estrutural trabalha predominantemente à flexão, vencendo vãos entre apoios?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Viga" },
        { id: "b", label: "Pilar" },
        { id: "c", label: "Fundação direta" },
        { id: "d", label: "Tirante" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-fundamentos-2",
      prompt: "O traço do concreto define, entre outras coisas, a proporção entre cimento, areia, brita e água.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

const historiaBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-historia-1",
      prompt: "Qual ordem clássica grega é reconhecida pelas colunas mais robustas e capitéis sem ornamento?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Dórica" },
        { id: "b", label: "Jônica" },
        { id: "c", label: "Coríntia" },
        { id: "d", label: "Toscana" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-historia-2",
      prompt: "O arco de volta perfeita (arco pleno) é característico da arquitetura românica e romana.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

const urbanismoBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-urbanismo-1",
      prompt: "O que é o coeficiente de aproveitamento (CA) em legislação urbanística?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Relação entre área construível e área do terreno" },
        { id: "b", label: "Percentual de área permeável obrigatória" },
        { id: "c", label: "Altura máxima permitida da edificação" },
        { id: "d", label: "Número máximo de vagas de garagem" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-urbanismo-2",
      prompt: "Gentrificação é o processo de valorização de uma área urbana que desloca a população original de menor renda.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

const sistemasConstrutivosBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-sistemas-1",
      prompt: "Em alvenaria estrutural, por que a modulação do projeto deve seguir as dimensões do bloco?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Para evitar cortes que enfraquecem a capacidade de carga da parede" },
        { id: "b", label: "Só por questão estética" },
        { id: "c", label: "Para reduzir o preço do bloco" },
        { id: "d", label: "Não há relação entre modulação e estrutura" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-sistemas-2",
      prompt: "Rasgar uma parede de alvenaria estrutural já erguida para passar tubulação não prevista em projeto é uma prática segura.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "false",
  },
];

const arquiteturaModernaBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-moderna-1",
      prompt: "Qual dos 'cinco pontos' de Le Corbusier permitiu a planta livre na arquitetura moderna?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Pilotis" },
        { id: "b", label: "Telhado colonial" },
        { id: "c", label: "Parede portante de alvenaria" },
        { id: "d", label: "Janela pequena" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-moderna-2",
      prompt: "O brutalismo paulista é conhecido pelo uso do concreto aparente como acabamento final.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

const confortoTermicoBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-conforto-1",
      prompt: "O que é inércia térmica de uma edificação?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Capacidade da envoltória de retardar a passagem de calor" },
        { id: "b", label: "Velocidade do vento dentro do ambiente" },
        { id: "c", label: "Quantidade de luz natural recebida" },
        { id: "d", label: "Cor da fachada" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-conforto-2",
      prompt: "Ventilação cruzada depende da existência de aberturas em pelo menos duas fachadas com pressões diferentes.",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

const estruturasBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-estruturas-1",
      prompt: "Em uma treliça isostática, qual método permite calcular o esforço em uma única barra sem resolver todo o sistema?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Método dos nós" },
        { id: "b", label: "Método das seções (Ritter)" },
        { id: "c", label: "Método de Cross" },
        { id: "d", label: "Análise matricial direta" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-estruturas-2",
      prompt: "Qual destas hipóteses NÃO faz parte do modelo clássico de treliça ideal?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Barras conectadas por rótulas sem atrito" },
        { id: "b", label: "Cargas aplicadas apenas nos nós" },
        { id: "c", label: "Barras sujeitas apenas a esforço axial" },
        { id: "d", label: "Barras engastadas rigidamente nos nós" },
      ],
    },
    correctOptionId: "d",
  },
  {
    question: {
      id: "inf-estruturas-3",
      prompt: "Um pilar esbelto sob compressão pode falhar por flambagem antes de atingir a tensão de ruptura do material. Isso é verdadeiro?",
      type: "true_false",
      difficulty: "hard",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
  },
];

// Reaproveita 12 perguntas "hard" já geradas e aprovadas pras 4 lições reais de Maquetes no
// MongoDB — mesmo texto, só reformatado pro schema do mock de Modo Infinito (options viram
// {id,label}, sem repetir a chamada de IA pra um conteúdo que já existe e já foi validado).
const maquetesBank: InfiniteModeQuestionEntry[] = [
  {
    question: {
      id: "inf-maquetes-1",
      prompt:
        "Um arquiteto precisa apresentar ao cliente uma maquete que mostre o edifício e seu entorno imediato (o quarteirão/lote), sem necessidade de detalhamento de mobiliário. Combinando as faixas de escala descritas no texto, qual escala é mais adequada?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "1:5000" },
        { id: "b", label: "1:200" },
        { id: "c", label: "1:50" },
        { id: "d", label: "1:5" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-2",
      prompt:
        "Segundo o texto, o que caracterizou o período em que as maquetes tiveram um \"papel secundário\" na história da arquitetura, antes de sua retomada por Antoni Gaudí no século XIX?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "A ascensão da Bauhaus e de Le Corbusier, que passaram a valorizar mais os desenhos" },
        { id: "b", label: "A maior valorização dos desenhos (plantas, cortes, elevações) pelas escolas de Belas Artes" },
        { id: "c", label: "A proibição do uso de maquetes em concursos de fachada no Renascimento" },
        { id: "d", label: "A invenção da impressora 3D, que substituiu a necessidade de modelos físicos" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-3",
      prompt: "Para produzir uma peça de maquete com uma curva suave, a técnica mais indicada, segundo o texto, é:",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Cortar a peça reta e depois lixar até obter a curva" },
        { id: "b", label: "Selecionar um material mais mole e realizar vincos com uma passada leve de estilete, curvando o material progressivamente" },
        { id: "c", label: "Usar exclusivamente MDF pela sua rigidez estrutural" },
        { id: "d", label: "Aquecer o material com pistola de cola quente até amolecer" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-4",
      prompt:
        "Um maquetista precisa produzir, em baixo custo e com tolerância a pequenos erros, o volume de estudo preliminar de um pavilhão simples, sem necessidade de detalhes finos. Combinando as diretrizes do texto sobre materiais, corte e colagem, qual conjunto de escolhas é o mais coerente?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Acrílico e MDF, cortados com serra elétrica e colados com cola de contato" },
        { id: "b", label: "Papel, espuma ou madeira balsa, cortados com estilete fino e colados com cola branca PVA" },
        { id: "c", label: "Chapas metálicas, cortadas e soldadas com ferro de solda" },
        { id: "d", label: "Vidro real, cortado com cortador de vidro" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-5",
      prompt:
        "Um arquiteto precisa demonstrar como vigas e pilares se conectam em um nó estrutural específico do projeto, em grande detalhe. Segundo a classificação do texto, que tipo de maquete secundária e faixa de escala são mais adequados?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Maquete de estrutura (ou trama), na escala 1:50" },
        { id: "b", label: "Maquete de detalhe ou conexão, em escala entre 1:25 e 1:5" },
        { id: "c", label: "Maquete de contexto, na escala 1:1000" },
        { id: "d", label: "Maquete de sítio, sem escala definida" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-6",
      prompt:
        "Considerando a tabela de níveis de elaboração de Knoll e Hechinger (2003), em qual nível se enquadra a \"maquete de trabalho\", e o que a caracteriza?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "1º Nível – Pré-Projeto, correspondendo ao Esboço de Idealização, sem necessidade de estudos especializados" },
        {
          id: "b",
          label:
            "2º Nível – Projeto, correspondendo ao Projeto de Construção; nessa fase as condições já estão previamente estabelecidas, embora a estrutura ainda possa sofrer alterações",
        },
        { id: "c", label: "3º Nível – Execução, exigindo materiais que reproduzam com precisão o impacto visual das cores e superfícies" },
        { id: "d", label: "Não se relaciona a nenhum nível, pois maquetes de trabalho são sempre secundárias" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-7",
      prompt:
        "Comparando impressão 3D, fresadora CNC e cortadora a laser, qual afirmação está correta quanto à técnica de fabricação digital (adição ou subtração de material) e à dimensionalidade do corte?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "As três trabalham por adição de material em três eixos" },
        {
          id: "b",
          label:
            "A impressora 3D trabalha por adição; a CNC e a cortadora a laser trabalham por subtração, mas apenas a cortadora a laser é limitada a dois eixos (bidimensional)",
        },
        { id: "c", label: "A cortadora a laser é a única capaz de trabalhar em três eixos, por isso substitui as demais" },
        { id: "d", label: "A CNC e a impressora 3D usam exclusivamente filamento PLA como matéria-prima" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-8",
      prompt:
        "Uma aluna questiona se a escala humana padrão (baseada em um homem de aproximadamente 1,80m) representa adequadamente todos os usuários de um espaço. Segundo a resposta dada no texto, qual é a abordagem correta para essa limitação na humanização de uma maquete?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Ignorar a diversidade, pois a escala humana já é um padrão internacional fixo e não deve ser alterada" },
        {
          id: "b",
          label:
            "Elaborar figuras humanas que representem a diversidade de usuários — mulheres, crianças, gestantes, idosos, pessoas com cadeira de rodas ou bengalas — considerando suas proporções e capacidades de deslocamento",
        },
        { id: "c", label: "Utilizar exclusivamente o Modulor de Le Corbusier, que já contempla toda a diversidade humana" },
        { id: "d", label: "Eliminar a escala humana da maquete para evitar interpretações equivocadas" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-9",
      prompt: "Qual teoria foi proposta por Milgram e Kishino em 1994 para explorar a interação entre o mundo físico e o virtual?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Teoria da Presença" },
        { id: "b", label: "Continuum da Virtualidade" },
        { id: "c", label: "Realidade Mista" },
        { id: "d", label: "Teoria da Comunicação" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-10",
      prompt:
        "Considerando as técnicas de união e os materiais abordados no texto, por que o foam board apresenta uma restrição específica ao ser articulado em meia esquadria?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        {
          id: "a",
          label:
            "Porque sua menor densidade exige que o corte seja feito exatamente a 45° para garantir uma boa execução da colagem, sendo mais difícil de articular dessa forma do que materiais que permitem lixamento",
        },
        { id: "b", label: "Porque suas lâminas de plástico externas não podem ser riscadas, impedindo o dobramento necessário para o ângulo de 45°" },
        { id: "c", label: "Porque o foam board só aceita o acabamento em topo simples, devido à sobreposição de suas faces menores" },
        { id: "d", label: "Porque o seu núcleo central macio impede que o revestimento externo cubra a espessura corretamente após o corte em ângulo" },
      ],
    },
    correctOptionId: "a",
  },
  {
    question: {
      id: "inf-maquetes-11",
      prompt:
        "Considerando a articulação entre os elementos primários descritos por Ching (2013) e os elementos tectônicos básicos definidos por Knoll e Hechinger (2003) na confecção de maquetes, assinale a alternativa correta.",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Para Ching, o ponto é uma extensão da reta que, ao ser articulada, forma o volume" },
        {
          id: "b",
          label:
            "Knoll e Hechinger consideram que a confecção de maquetes consiste primariamente em produzir corpos, superfícies e hastes, dando-lhes forma, unindo-os e trabalhando suas faces exteriores",
        },
        { id: "c", label: "O plano é definido por Ching apenas como uma posição no espaço, enquanto a reta é a sua extensão" },
        { id: "d", label: "Os três elementos tectônicos de Knoll e Hechinger correspondem exatamente aos níveis de elaboração: pré-projeto, projeto e execução" },
      ],
    },
    correctOptionId: "b",
  },
  {
    question: {
      id: "inf-maquetes-12",
      prompt: "Qual é o conceito por trás do Modulor, desenvolvido pelo arquiteto Le Corbusier?",
      type: "multiple_choice",
      difficulty: "hard",
      options: [
        { id: "a", label: "Um sistema de proporções humanas para basear a arquitetura, apoiado na proporção áurea" },
        { id: "b", label: "Um sistema de construção de habitações coletivas em concreto pré-moldado" },
        { id: "c", label: "Um sistema de design de interiores voltado à ergonomia de escritórios" },
        { id: "d", label: "Um sistema de zoneamento urbanístico para cidades planejadas" },
      ],
    },
    correctOptionId: "a",
  },
];

const banks: Record<ThemeTopic, InfiniteModeQuestionEntry[]> = {
  fundamentos: fundamentosBank,
  historia: historiaBank,
  urbanismo: urbanismoBank,
  sistemas_construtivos: sistemasConstrutivosBank,
  arquitetura_moderna: arquiteturaModernaBank,
  conforto_termico: confortoTermicoBank,
  estruturas: estruturasBank,
  maquetes: maquetesBank,
};

// null (não um fallback genérico) quando o tema não tem banco próprio — mostrar perguntas de
// outro assunto sob o rótulo do tema escolhido seria pior que dizer "ainda não temos isso".
export function getInfiniteModeBank(topic: string): InfiniteModeQuestionEntry[] | null {
  return banks[topic as ThemeTopic] ?? null;
}
