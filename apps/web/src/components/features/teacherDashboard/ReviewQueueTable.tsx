import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ReviewQueueRow } from "@/lib/api/mocks/fixtures/teacherAnalytics";

const statusTone = { pending: "neutral", approved: "tertiary", rejected: "error" } as const;
const statusLabel = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada" } as const;

export function ReviewQueueTable({ rows }: { rows: ReviewQueueRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Nenhuma questão pendente de revisão nesta turma.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-outline-variant rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-surface-gray">
          <tr>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Aluno</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Questão ID</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Tópico</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Status</th>
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.question_id} className="border-t border-outline-variant">
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface">{row.student_name}</td>
              <td className="px-md py-sm font-label text-body-sm text-on-surface-variant">{row.question_id}</td>
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface">{row.topic}</td>
              <td className="px-md py-sm">
                <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
              </td>
              <td className="px-md py-sm">
                <Link href={`/revisao/${row.upload_id}`} className="font-body-sm text-body-sm text-primary font-bold">
                  Revisar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
