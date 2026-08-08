import { cookies } from "next/headers";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import { getAccountById, mockAccounts } from "@/lib/api/mocks/fixtures/accounts";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { TeacherTopBar } from "@/components/layout/TeacherTopBar";
import { TeacherSideNav } from "@/components/layout/TeacherSideNav";
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav";
import { AdminTopBar } from "@/components/layout/AdminTopBar";

// Rotas deste grupo (Home/Explorar/Liga/Perfil/Loja/Notificações) são majoritariamente do
// aluno, mas /perfil também é destino de nav do professor e é alcançável pelo admin — então o
// chrome (top bar + nav) precisa refletir o papel de quem está logado, não sempre o do aluno.
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accountId = cookieStore.get(ACCOUNT_COOKIE)?.value;
  const account = getAccountById(accountId) ?? mockAccounts[0];

  if (account.user.role === "teacher") {
    return (
      <>
        <TeacherTopBar />
        <TeacherSideNav />
        <main className="flex-1 md:pl-64 pb-[90px] md:pb-0">{children}</main>
        <TeacherBottomNav />
      </>
    );
  }

  if (account.user.role === "admin") {
    return (
      <>
        <AdminTopBar />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      <TopAppBar />
      <SideNav />
      <main className="flex-1 md:pl-64 pb-[90px] md:pb-0">{children}</main>
      <BottomNavBar />
    </>
  );
}
