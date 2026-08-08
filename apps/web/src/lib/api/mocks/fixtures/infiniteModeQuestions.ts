import type { InfiniteModeQuestion } from "@/types/api";

export interface InfiniteModeQuestionEntry {
  question: InfiniteModeQuestion;
  correctOptionId: string;
}

// Banco "difícil" por tópico — Modo Infinito usa perguntas de dificuldade elevada por design
// (ver Docs/stitch_app_visual_identity/modo_infinito_desafio_estrutural).
const structuralBank: InfiniteModeQuestionEntry[] = [
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

const banks: Record<string, InfiniteModeQuestionEntry[]> = {
  estruturas: structuralBank,
};

export function getInfiniteModeBank(topic: string): InfiniteModeQuestionEntry[] {
  return banks[topic] ?? structuralBank;
}
