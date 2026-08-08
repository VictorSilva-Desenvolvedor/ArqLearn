import { mockUserDirectory } from "@/lib/api/mocks/fixtures/adminDirectory";
import { Icon } from "@/components/ui/Icon";
import { MetricCard } from "@/components/features/teacherDashboard/MetricCard";
import { UserDirectoryTable } from "@/components/features/admin/UserDirectoryTable";

export default function AdminDashboardPage() {
  const totalStudents = mockUserDirectory.filter((entry) => entry.role === "student").length;
  const totalTeachers = mockUserDirectory.filter((entry) => entry.role === "teacher").length;

  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-lg">
      <div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">Painel do Administrador</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Visão consolidada de todas as contas do sistema — alunos e professores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        <MetricCard
          icon={<Icon name="group" filled className="text-3xl text-primary" />}
          label="Total de Usuários"
          value={String(mockUserDirectory.length)}
        />
        <MetricCard
          icon={<Icon name="school" filled className="text-3xl text-secondary" />}
          label="Alunos"
          value={String(totalStudents)}
        />
        <MetricCard
          icon={<Icon name="dashboard" filled className="text-3xl text-tertiary" />}
          label="Professores"
          value={String(totalTeachers)}
        />
      </div>

      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Todos os Usuários</h2>
        <UserDirectoryTable entries={mockUserDirectory} />
      </section>
    </div>
  );
}
