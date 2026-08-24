import type { DailyGoalLevel } from "@/types/api";

export interface DailyGoalCatalogEntry {
  title: string;
  description: string;
  icon: string;
  // Alvos numéricos — precisam bater exatamente com dailyGoalCatalog em
  // services/monolith/internal/gamification/dailygoal.go. Conferido manualmente (os dois lados
  // não compartilham código, Go vs TypeScript), mesma convenção já usada em
  // achievementCatalog.ts/personalRecordCatalog.ts. Também usado pelo mock (dailyGoal.ts) pra
  // calcular "achieved" sem duplicar os números uma terceira vez.
  questionsTarget: number;
  studyMinutesTarget: number;
}

export const DAILY_GOAL_LEVELS: DailyGoalLevel[] = ["leve", "regular", "consistente", "intensa"];

// TDD §13: calibração inicial (não telemetria real ainda) — revisitar com dados de conclusão
// depois de estar no ar. "regular" é o DEFAULT do backend, preserva o comportamento fixo de
// 10 perguntas de antes da Meta Diária personalizável existir.
export const dailyGoalCatalog: Record<DailyGoalLevel, DailyGoalCatalogEntry> = {
  leve: {
    title: "Leve",
    description: "Poucos minutos por dia — o mínimo pra manter o hábito vivo, mesmo num dia ruim.",
    icon: "spa",
    questionsTarget: 3,
    studyMinutesTarget: 5,
  },
  regular: {
    title: "Regular",
    description: "Ritmo confortável de estudo diário.",
    icon: "school",
    questionsTarget: 10,
    studyMinutesTarget: 12,
  },
  consistente: {
    title: "Consistente",
    description: "Progresso sólido, pra quem já tem o hábito estabelecido.",
    icon: "trending_up",
    questionsTarget: 15,
    studyMinutesTarget: 20,
  },
  intensa: {
    title: "Intensa",
    description: "Preparação acelerada — sprints de estudo.",
    icon: "bolt",
    questionsTarget: 25,
    studyMinutesTarget: 35,
  },
};

// Meta batida assim que perguntas certas OU minutos estudados no dia atingem o alvo do nível —
// nunca os dois ao mesmo tempo (TDD §13). Espelha gamification.MetaDiariaAtingida no backend;
// usado só pelo mock (o backend real já devolve `achieved` pronto em GET .../daily-goal).
export function metaDiariaAtingida(
  questionsToday: number,
  studyMinutesToday: number,
  level: DailyGoalLevel,
): boolean {
  const target = dailyGoalCatalog[level];
  return questionsToday >= target.questionsTarget || studyMinutesToday >= target.studyMinutesTarget;
}
