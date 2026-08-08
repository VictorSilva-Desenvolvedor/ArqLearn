import { ApiError } from "../../http";
import type { QuestionReviewAction, ReviewQuestion, ReviewQuestionEditedFields } from "@/types/api";

export const mockReviewTrackTitle: Record<string, string> = {
  "upload-bim-intro": "Introdução ao BIM",
};

function makeQuestion(
  index: number,
  enunciado: string,
  opcoes: string[],
  correctIndex: number,
  type: ReviewQuestion["type"],
  difficulty: ReviewQuestion["difficulty"],
  source_excerpt: string,
): ReviewQuestion {
  return {
    id: `bim-q${index}`,
    enunciado,
    opcoes: opcoes.map((label, i) => ({ id: String.fromCharCode(97 + i), label })),
    resposta_correta: String.fromCharCode(97 + correctIndex),
    type,
    difficulty,
    review_status: "pending",
    source_excerpt,
  };
}

export const mockReviewQuestions: Record<string, ReviewQuestion[]> = {
  "upload-bim-intro": [
    makeQuestion(
      1,
      "O que significa a sigla BIM?",
      ["Building Information Modeling", "Basic Infrastructure Management", "Blueprint Integration Method", "Built Information Matrix"],
      0,
      "multiple_choice",
      "easy",
      "\"BIM (Building Information Modeling) é um processo de criação e gestão de informações de um empreendimento...\"",
    ),
    makeQuestion(
      2,
      "Um modelo BIM é essencialmente um arquivo de desenho 3D, sem dados associados aos elementos.",
      ["Verdadeiro", "Falso"],
      1,
      "true_false",
      "medium",
      "\"Diferente do CAD tradicional, cada elemento no BIM carrega propriedades: material, custo, fabricante...\"",
    ),
    makeQuestion(
      3,
      "Qual nível de maturidade BIM caracteriza a colaboração em modelo único compartilhado na nuvem?",
      ["Nível 0", "Nível 1", "Nível 2", "Nível 3"],
      3,
      "multiple_choice",
      "hard",
      "\"O Nível 3 de maturidade BIM (iBIM) pressupõe um modelo único, compartilhado em ambiente comum de dados...\"",
    ),
    makeQuestion(
      4,
      "O que é um Ambiente Comum de Dados (CDE)?",
      ["Um servidor de e-mail", "Um repositório central de informações do projeto", "Um software de renderização", "Um tipo de contrato BIM"],
      1,
      "multiple_choice",
      "medium",
      "\"O CDE (Common Data Environment) centraliza toda a informação do projeto, garantindo uma única fonte de verdade...\"",
    ),
    makeQuestion(
      5,
      "A detecção de interferências (clash detection) serve para identificar conflitos físicos entre disciplinas do projeto.",
      ["Verdadeiro", "Falso"],
      0,
      "true_false",
      "easy",
      "\"A compatibilização entre disciplinas (arquitetura, estrutura, instalações) é automatizada pela detecção de clashes...\"",
    ),
    makeQuestion(
      6,
      "Qual documento define os requisitos de informação exigidos pelo contratante em um projeto BIM?",
      ["EIR (Employer's Information Requirements)", "BEP (BIM Execution Plan)", "LOD (Level of Development)", "IFC (Industry Foundation Classes)"],
      0,
      "multiple_choice",
      "hard",
      "\"O EIR estabelece, antes da contratação, quais informações o contratante espera receber ao longo do projeto...\"",
    ),
    makeQuestion(
      7,
      "IFC é um formato proprietário de um único fabricante de software BIM.",
      ["Verdadeiro", "Falso"],
      1,
      "true_false",
      "medium",
      "\"IFC (Industry Foundation Classes) é um formato aberto e neutro, mantido pela buildingSMART...\"",
    ),
    makeQuestion(
      8,
      "O que representa o LOD (Level of Development) de um elemento BIM?",
      ["A qualidade da renderização", "O grau de detalhamento e confiabilidade da informação do elemento", "O número de camadas do arquivo", "A velocidade de processamento do modelo"],
      1,
      "multiple_choice",
      "medium",
      "\"O LOD define, para cada fase do projeto, o quanto se pode confiar na geometria e nos dados de um elemento...\"",
    ),
    makeQuestion(
      9,
      "Qual profissional costuma ser responsável por coordenar o modelo federado entre disciplinas?",
      ["BIM Manager/Coordenador BIM", "Mestre de obras", "Corretor de imóveis", "Fiscal de obra"],
      0,
      "multiple_choice",
      "easy",
      "\"O Coordenador BIM (BIM Manager) é responsável por federar os modelos disciplinares e verificar conformidade...\"",
    ),
    makeQuestion(
      10,
      "Modelos BIM 4D incorporam qual dimensão adicional à geometria 3D?",
      ["Custo", "Cronograma/tempo", "Sustentabilidade", "Manutenção predial"],
      1,
      "multiple_choice",
      "medium",
      "\"O BIM 4D associa a geometria do modelo à linha do tempo do cronograma da obra...\"",
    ),
    makeQuestion(
      11,
      "BIM 5D está associado ao planejamento de custos e orçamento vinculado ao modelo.",
      ["Verdadeiro", "Falso"],
      0,
      "true_false",
      "easy",
      "\"O BIM 5D acrescenta a dimensão de custos, permitindo orçamentação automática a partir das quantidades do modelo...\"",
    ),
    makeQuestion(
      12,
      "Qual é o principal benefício da compatibilização de projetos em BIM antes do início da obra?",
      ["Reduzir retrabalho e custos com conflitos identificados só em obra", "Eliminar a necessidade de projeto executivo", "Substituir o engenheiro estrutural", "Dispensar aprovação em prefeitura"],
      0,
      "multiple_choice",
      "hard",
      "\"Identificar interferências ainda em projeto evita retrabalho, desperdício de material e atrasos em obra...\"",
    ),
  ],
};

export function reviewQuestionMock(
  uploadId: string,
  questionId: string,
  action: QuestionReviewAction,
  editedFields?: ReviewQuestionEditedFields,
): ReviewQuestion {
  const question = mockReviewQuestions[uploadId]?.find((q) => q.id === questionId);
  if (!question) {
    throw new ApiError(404, {
      error_code: "TRACK_NOT_FOUND",
      message: `Pergunta ${questionId} não encontrada para o upload ${uploadId}.`,
      trace_id: "mock-trace",
    });
  }
  if (question.review_status !== "pending") {
    throw new ApiError(409, {
      error_code: "QUESTION_ALREADY_REVIEWED",
      message: "Esta pergunta já foi revisada.",
      trace_id: "mock-trace",
    });
  }

  if (action === "approve") {
    question.review_status = "approved";
  } else if (action === "reject") {
    question.review_status = "rejected";
  } else if (action === "edit") {
    question.review_status = "edited";
    if (editedFields?.enunciado) question.enunciado = editedFields.enunciado;
    if (editedFields?.opcoes) question.opcoes = editedFields.opcoes;
    if (editedFields?.resposta_correta) question.resposta_correta = editedFields.resposta_correta;
  }

  return question;
}
