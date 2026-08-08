import { AdminTopBar } from "@/components/layout/AdminTopBar";

// Sem side nav / bottom nav dedicados — hoje o Admin tem uma única tela (visão geral de todos
// os usuários). Adicionar subseções vira uma AdminSideNav quando houver mais de uma rota real.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminTopBar />
      <main className="flex-1">{children}</main>
    </>
  );
}
