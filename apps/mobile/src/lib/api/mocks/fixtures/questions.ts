import type { QuestionDifficulty, SessionQuestion } from "@/types/api";

export interface MockQuestionEntry {
  question: SessionQuestion;
  correctOptionId: string;
  explanation: string;
}

// Espelha apps/web/src/lib/api/mocks/fixtures/questions.ts — mesmo banco (t2-l1 = trilha
// "Gótico"), cobrindo os 5 tipos de pergunta pra exercitar QuestionCard/AnswerOption/
// FillBlankInput por inteiro.
const gothicBank: MockQuestionEntry[] = [
  {
    question: {
      id: "q-gotico-1",
      prompt: "Qual destes elementos é característico do estilo Gótico?",
      type: "multiple_choice",
      difficulty: "medium",
      options: [
        { id: "a", label: "Arco Pleno" },
        { id: "b", label: "Arcos Ogivais" },
        { id: "c", label: "Pilastras Jônicas" },
        { id: "d", label: "Cúpulas Geodésicas" },
      ],
    },
    correctOptionId: "b",
    explanation:
      "Os arcos ogivais (em ponta) são a marca registrada do Gótico — permitem vãos mais altos e distribuem melhor as cargas para os contrafortes.",
  },
  {
    question: {
      id: "q-gotico-2",
      prompt: "O que caracteriza um contraforte volante em catedrais góticas?",
      type: "multiple_choice",
      difficulty: "medium",
      options: [
        { id: "a", label: "Um arco externo que transfere empuxo da abóbada para um pilar" },
        { id: "b", label: "Uma coluna decorativa sem função estrutural" },
        { id: "c", label: "Um vitral estrutural" },
        { id: "d", label: "Uma cúpula dupla" },
      ],
    },
    correctOptionId: "a",
    explanation:
      "O contraforte volante (flying buttress) transfere o empuxo lateral da abóbada para um pilar externo, permitindo paredes mais finas e altas com grandes vitrais.",
  },
  {
    question: {
      id: "q-gotico-3",
      prompt: "As catedrais góticas priorizavam qual efeito de luz?",
      type: "true_false",
      difficulty: "easy",
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
    },
    correctOptionId: "true",
    explanation:
      "Verdadeiro — os grandes vitrais coloridos eram usados para inundar o interior de luz, associada simbolicamente ao divino.",
  },
  {
    question: {
      id: "q-gotico-4",
      prompt: "Complete: o estilo predominante nas catedrais francesas do século XII é o _____.",
      type: "fill_blank",
      difficulty: "medium",
      // fill_blank não tem uma lista de opções pra clicar — a única entrada guarda o texto
      // esperado, usado tanto pra exibir "resposta esperada" quanto (via correctOptionId) pra
      // comparar com o que o usuário digitou.
      options: [{ id: "a", label: "Gótico" }],
    },
    correctOptionId: "Gótico",
    explanation: "O estilo Gótico sucedeu o Românico na França a partir do século XII.",
  },
  {
    question: {
      id: "q-gotico-5",
      prompt: "Associe: qual opção descreve corretamente o papel estrutural do arcobotante?",
      type: "matching",
      difficulty: "medium",
      options: [
        { id: "a", label: "Transfere o empuxo da abóbada para um pilar externo" },
        { id: "b", label: "Sustenta o telhado sem função estrutural" },
        { id: "c", label: "Ilumina o interior através de vitrais" },
        { id: "d", label: "Sela a base da coluna no piso" },
      ],
    },
    correctOptionId: "a",
    explanation:
      "O arcobotante (contraforte volante) transfere o empuxo lateral da abóbada para um pilar externo, permitindo paredes mais altas e finas.",
  },
  {
    question: {
      id: "q-gotico-6",
      prompt: "Observe a elevação: qual elemento estrutural está destacado na imagem?",
      type: "image_identification",
      difficulty: "hard",
      image_url: "https://picsum.photos/seed/arqlearn-gotico/800/450",
      options: [
        { id: "a", label: "Contraforte volante" },
        { id: "b", label: "Rosácea" },
        { id: "c", label: "Portal principal" },
        { id: "d", label: "Pináculo" },
      ],
    },
    correctOptionId: "a",
    explanation: "O contraforte volante é o arco externo visível apoiando a parede da nave.",
  },
];

const defaultBank: MockQuestionEntry[] = [
  {
    question: {
      id: "q-default-1",
      prompt: "Qual material é mais associado à arquitetura moderna do século XX?",
      type: "multiple_choice",
      difficulty: "easy",
      options: [
        { id: "a", label: "Taipa de pilão" },
        { id: "b", label: "Concreto armado" },
        { id: "c", label: "Adobe" },
        { id: "d", label: "Estuque" },
      ],
    },
    correctOptionId: "b",
    explanation:
      "O concreto armado permitiu vãos livres e plantas flexíveis, sendo um dos pilares da arquitetura moderna.",
  },
];

const difficultyXp: Record<QuestionDifficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
  impossible: 25,
};

export function xpForDifficulty(difficulty: QuestionDifficulty): number {
  return difficultyXp[difficulty];
}

export function getMockQuestionBank(lessonId: string): MockQuestionEntry[] {
  if (lessonId === "t2-l1") return gothicBank;
  return defaultBank;
}
