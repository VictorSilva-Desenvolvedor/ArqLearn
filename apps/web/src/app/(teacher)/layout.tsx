import { TeacherTopBar } from "@/components/layout/TeacherTopBar";
import { TeacherSideNav } from "@/components/layout/TeacherSideNav";
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav";

// Route group do Painel do Professor — persona/densidade de informação diferentes do app do
// aluno (ver Docs/CLAUDE.md: fica dentro de apps/web, não é um app separado nesta fase).
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TeacherTopBar />
      <TeacherSideNav />
      <main className="flex-1 md:pl-64 pb-[90px] md:pb-0">{children}</main>
      <TeacherBottomNav />
    </>
  );
}
