import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { DirectoryEntry } from "@/lib/api/mocks/fixtures/adminDirectory";

const roleLabel: Record<DirectoryEntry["role"], string> = { student: "Aluno", teacher: "Professor" };
const roleTone: Record<DirectoryEntry["role"], "primary" | "secondary"> = {
  student: "primary",
  teacher: "secondary",
};

export function UserDirectoryTable({ entries }: { entries: DirectoryEntry[] }) {
  return (
    <div className="overflow-x-auto border-2 border-outline-variant rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-surface-gray">
          <tr>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Nome</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Papel</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Detalhe</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Ação</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-outline-variant">
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface">{entry.name}</td>
              <td className="px-md py-sm">
                <Badge tone={roleTone[entry.role]}>{roleLabel[entry.role]}</Badge>
              </td>
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">{entry.detail}</td>
              <td className="px-md py-sm">
                {entry.href ? (
                  <Link href={entry.href} className="font-body-sm text-body-sm text-primary font-bold">
                    {entry.role === "teacher" ? "Ver painel" : "Ver perfil"}
                  </Link>
                ) : (
                  <span className="font-body-sm text-body-sm text-outline">Sem detalhes no mock</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
