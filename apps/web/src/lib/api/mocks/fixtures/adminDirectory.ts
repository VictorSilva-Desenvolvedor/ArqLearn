import { mockUser, mockTeacherUser } from "./user";
import { mockLeague } from "./gamification";
import { mockTeacherClasses } from "./teacherAnalytics";

export interface DirectoryEntry {
  id: string;
  name: string;
  role: "student" | "teacher";
  detail: string;
  href: string | null;
}

// "Vê tudo de todos os usuários" — combina o único aluno com perfil completo no mock (Alex) com
// o resto do roster da liga (outros alunos já mockados em gamification.ts) e o professor. Sem
// endpoint de listagem de usuários no contrato (mesma lacuna já sinalizada pra outros catálogos),
// então isto é conteúdo do cliente/mock, não uma resposta de API real.
export const mockUserDirectory: DirectoryEntry[] = [
  {
    id: mockUser.id,
    name: mockUser.name,
    role: "student",
    detail: "Perfil completo disponível",
    href: "/perfil",
  },
  ...mockLeague.ranking
    .filter((entry) => entry.user_id !== mockUser.id)
    .map((entry) => ({
      id: entry.user_id,
      name: entry.name,
      role: "student" as const,
      detail: `${entry.xp_this_week} XP esta semana`,
      href: null,
    })),
  {
    id: mockTeacherUser.id,
    name: mockTeacherUser.name,
    role: "teacher",
    detail: `${mockTeacherClasses.length} turmas`,
    href: "/painel",
  },
];
