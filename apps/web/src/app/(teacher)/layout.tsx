import { redirect } from "next/navigation";
import { TeacherTopBar } from "@/components/layout/TeacherTopBar";
import { TeacherSideNav } from "@/components/layout/TeacherSideNav";
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav";
import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";

// Route group do Painel do Professor — persona/densidade de informação diferentes do app do
// aluno (ver Docs/CLAUDE.md: fica dentro de apps/web, não é um app separado nesta fase).
//
// Checagem de autorização (não só autenticação) fica aqui, não no proxy.ts — papel real
// (`users.role`) exige ida ao banco, que a documentação do Next.js recomenda evitar no Proxy
// (roda em toda rota, inclusive prefetch). Aqui roda uma vez por navegação real a este grupo de
// rotas, igual ao padrão "Data Access Layer" recomendado.
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const accessToken = await getServerAccessToken();
  const { user } = await getMe(accessToken);
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <TeacherTopBar />
      <TeacherSideNav />
      <main className="flex-1 md:pl-64 pb-[90px] md:pb-0">{children}</main>
      <TeacherBottomNav />
    </>
  );
}
