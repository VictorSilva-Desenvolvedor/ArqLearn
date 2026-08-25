import type { TeacherClassSummary } from "@/types/api";

// GET /v1/teacher/classes (listagem de turmas) não existe no contrato — só o resumo de uma
// turma específica. Lista de turmas para o seletor é conteúdo do cliente/mock.
export interface TeacherClass {
  id: string;
  name: string;
}

export const mockTeacherClasses: TeacherClass[] = [
  { id: "turma-2026-1a", name: "Arquitetura 2026 — Turma A" },
  { id: "turma-2026-1b", name: "Arquitetura 2026 — Turma B" },
];

// `topic` aqui TEM que casar com o `topic` de mockReviewQueue abaixo — é a chave que liga as duas
// seções desde que "Revisar Módulo" passou a filtrar a fila por tópico (25/08/2026, pendência #9).
// Antes desta auditoria nenhum dos 4 tópicos fracos existia na fila (todas as linhas eram
// "Introdução ao BIM"), então TODO clique em "Revisar Módulo" caía no estado vazio e o caminho
// feliz do recurso era literalmente inalcançável na demonstração. Cada turma agora tem um tópico
// COM questões na fila (caminho feliz) e um SEM (estado vazio) — os dois casos continuam
// demonstráveis de propósito.
export const mockTeacherClassSummary: Record<string, TeacherClassSummary> = {
  "turma-2026-1a": {
    students_count: 142,
    avg_streak: 14,
    avg_accuracy: 78,
    weak_topics: [
      { topic: "Introdução ao BIM", accuracy_rate: 55 },
      { topic: "Escala e Proporção", accuracy_rate: 62 },
    ],
  },
  "turma-2026-1b": {
    students_count: 98,
    avg_streak: 9,
    avg_accuracy: 71,
    weak_topics: [
      { topic: "Introdução ao BIM", accuracy_rate: 58 },
      { topic: "Conforto Térmico", accuracy_rate: 65 },
    ],
  },
};

// Engajamento semanal (gráfico de barras) — sem endpoint dedicado no contrato, mock estático.
export const mockWeeklyEngagement: Record<string, { day: string; value: number }[]> = {
  "turma-2026-1a": [
    { day: "Seg", value: 68 },
    { day: "Ter", value: 74 },
    { day: "Qua", value: 61 },
    { day: "Qui", value: 82 },
    { day: "Sex", value: 55 },
  ],
  "turma-2026-1b": [
    { day: "Seg", value: 50 },
    { day: "Ter", value: 58 },
    { day: "Qua", value: 47 },
    { day: "Qui", value: 63 },
    { day: "Sex", value: 40 },
  ],
};

// Fila de revisão de questões exibida no dashboard — resumo por aluno/questão, distinto da
// tela de revisão em si (que trabalha upload por upload). Sem endpoint dedicado, mock estático.
export interface ReviewQueueRow {
  student_name: string;
  question_id: string;
  topic: string;
  status: "pending" | "approved" | "rejected";
  upload_id: string;
}

export const mockReviewQueue: Record<string, ReviewQueueRow[]> = {
  "turma-2026-1a": [
    { student_name: "Ana Souza", question_id: "bim-q1", topic: "Introdução ao BIM", status: "pending", upload_id: "upload-bim-intro" },
    { student_name: "Bruno Alves", question_id: "bim-q4", topic: "Introdução ao BIM", status: "pending", upload_id: "upload-bim-intro" },
    { student_name: "Carla Nunes", question_id: "bim-q7", topic: "Introdução ao BIM", status: "pending", upload_id: "upload-bim-intro" },
  ],
  "turma-2026-1b": [
    { student_name: "Diego Ramos", question_id: "bim-q2", topic: "Introdução ao BIM", status: "pending", upload_id: "upload-bim-intro" },
  ],
};
