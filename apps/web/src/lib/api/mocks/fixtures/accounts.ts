import { mockAdminUser, mockTeacherUser, mockUser } from "./user";
import { mockGamificationProfile } from "./gamification";
import type { GamificationProfile, User } from "@/types/api";

// Só dados puros aqui (sem next/headers nem nada específico de runtime) — este arquivo é
// importado tanto pelo AuthContext (cliente) quanto pelo middleware (edge runtime).
export type MockAccountId = "student-alex" | "teacher-marina" | "admin-root";

export interface MockAccount {
  id: MockAccountId;
  user: User;
  landingPath: string;
}

export const mockAccounts: MockAccount[] = [
  { id: "student-alex", user: mockUser, landingPath: "/" },
  { id: "teacher-marina", user: mockTeacherUser, landingPath: "/painel" },
  { id: "admin-root", user: mockAdminUser, landingPath: "/admin" },
];

export function getAccountById(id: string | null | undefined): MockAccount | null {
  return mockAccounts.find((account) => account.id === id) ?? null;
}

// Só a conta do aluno tem progresso de gamificação nesta fase — professor/admin recebem um
// perfil zerado (não é exibido nas telas deles, mas evita todo consumidor de useAuth() ter que
// tratar `gamification` como opcional).
export const EMPTY_GAMIFICATION: GamificationProfile = {
  xp_total: 0,
  xp_today: 0,
  level: 0,
  streak_current: 0,
  streak_best: 0,
  streak_freezes_available: 0,
  streak_at_risk: false,
  hearts_current: 0,
  hearts_next_at: null,
  gems: 0,
  league_tier: null,
  is_vip: false,
  vip_expires_at: null,
};

export function gamificationForAccount(id: MockAccountId | null | undefined): GamificationProfile {
  return id === "student-alex" ? mockGamificationProfile : EMPTY_GAMIFICATION;
}
