import type { QuestionDifficulty, SessionQuestion } from "@/types/api";

export interface MockQuestionEntry {
  question: SessionQuestion;
  correctOptionId: string;
  explanation: string;
}

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
};

export function xpForDifficulty(difficulty: QuestionDifficulty): number {
  return difficultyXp[difficulty];
}

export function getMockQuestionBank(lessonId: string): MockQuestionEntry[] {
  if (lessonId === "t2-l1") return gothicBank;
  return defaultBank;
}
