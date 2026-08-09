import { redirect } from "next/navigation";
import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";

// Sem side nav / bottom nav dedicados — hoje o Admin tem uma única tela (visão geral de todos
// os usuários). Adicionar subseções vira uma AdminSideNav quando houver mais de uma rota real.
//
// Checagem de autorização real aqui, não no proxy.ts — mesmo motivo do (teacher)/layout.tsx:
// papel exige ida ao banco, que não deve rodar no Proxy.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const accessToken = await getServerAccessToken();
  const { user } = await getMe(accessToken);
  if (user.role === "teacher") {
    redirect("/painel");
  }
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <AdminTopBar />
      <main className="flex-1">{children}</main>
    </>
  );
}
