import type { AppNotification } from "@/types/api";

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-streak-risk",
    type: "streak_at_risk",
    message: "Sua sequência de 12 dias está em risco!",
    read: false,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "notif-league-promo",
    type: "league_promotion",
    message: "Você foi promovido para a Liga Prata!",
    read: false,
    created_at: "2026-08-07T20:00:00Z",
  },
  {
    id: "notif-new-challenge",
    type: "new_challenge",
    message: "Novo desafio semanal disponível.",
    read: false,
    created_at: "2026-08-06T09:00:00Z",
  },
  {
    id: "notif-questions-review",
    type: "questions_ready_for_review",
    message: "Suas perguntas estão prontas para revisão.",
    read: true,
    created_at: "2026-08-04T15:00:00Z",
  },
  {
    id: "notif-welcome",
    type: "welcome",
    message: "Bem-vindo ao ArqLearn!",
    read: true,
    created_at: "2026-07-01T10:00:00Z",
  },
];
